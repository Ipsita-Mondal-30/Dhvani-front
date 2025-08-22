// Speech.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  TextInput,
  StyleSheet,
  StatusBar,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Speech from "expo-speech";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { useTranslation } from 'react-i18next';
import { getSpeechLanguageCode } from '@/src/locales/i18n';

// ======================
// CONFIG — replace with your OCR.Space API key
// ======================
const OCR_SPACE_API_KEY = "K86479850788957"; // <-- put your real key here
const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

// ======================
// Voice Messages (Hindi & English guidance)

const VOICE_MESSAGES_HI = {
  welcome: "नमस्ते। आपका ध्वनि ऐप में स्वागत है। यह स्क्रीन आपके टेक्स्ट को सुनाकर बताएगी।",
  chooseInput:
    "आप टेक्स्ट जोड़ने के लिए फोटो चुन सकते हैं, पीडीएफ चुन सकते हैं, या सीधे टाइप कर सकते हैं।",
  selectImage: "फोटो चुनने के लिए यहाँ दबाएं।",
  selectPdf: "पीडीएफ फाइल चुनने के लिए यहाँ दबाएं।",
  typeText: "यहाँ अपना टेक्स्ट लिखें।",
  processing: "कृपया रुकें। हम आपकी फाइल से टेक्स्ट निकाल रहे हैं।",
  textFound: "टेक्स्ट मिल गया है। अब मैं इसे पढ़कर सुनाऊँगी।",
  noContent: "कोई टेक्स्ट नहीं मिला।",
  instructions:
    "उपयोग का तरीका: फोटो या पीडीएफ चुनें, या टेक्स्ट टाइप करें। फिर सुनाने के लिए प्ले दबाएं। भाषा बदलने के लिए हिंदी या English बटन दबाएं।",
};

const VOICE_MESSAGES_EN = {
  welcome: "Hello. Welcome to Dhvani. This screen reads your text aloud.",
  chooseInput:
    "You can add text by selecting a photo, picking a PDF, or typing directly.",
  selectImage: "Press here to select an image.",
  selectPdf: "Press here to select a PDF file.",
  typeText: "Type your text here.",
  processing: "Please wait. Extracting text from your file.",
  textFound: "Text found. I will read it now.",
  noContent: "No text found.",
  instructions:
    "How to use: Select a photo or PDF, or type your text. Then press Play to hear it. Use the language buttons to change voice.",
};

// ======================
// Small speech helpers
// ======================
const speakHi = (message: string) => {
  Speech.stop();
  Speech.speak(message, { language: "hi-IN", pitch: 1.0, rate: 0.95 });
};
const speakEn = (message: string) => {
  Speech.stop();
  Speech.speak(message, { language: "en-US", pitch: 1.0, rate: 1.0 });
};

const stopSpeaking = () => Speech.stop();

// ======================
// OCR helper (OCR.Space)
// Works for images and PDFs (server does the heavy lifting)
// ======================
async function ocrWithOcrSpaceAsync(file: {
  uri: string;
  name?: string;
  type?: string;
}) {
  const form = new FormData();
  form.append("apikey", OCR_SPACE_API_KEY);
  form.append("language", "eng");
  form.append("isOverlayRequired", "false");
  form.append("isTable", "false");
  form.append("scale", "true");
  form.append("OCREngine", "2");
  form.append("file", {
    // @ts-ignore React Native file shim
    uri: file.uri,
    name: file.name ?? (file.type?.includes("pdf") ? "document.pdf" : "image.jpg"),
    type:
      file.type ??
      (file.uri.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
  } as any);

  const res = await fetch(OCR_ENDPOINT, { method: "POST", body: form as any });
  if (!res.ok) throw new Error(`OCR request failed (${res.status})`);
  const json = await res.json();
  if (!json?.ParsedResults?.[0]) throw new Error("No OCR results found.");
  return json.ParsedResults.map((r: any) => r.ParsedText ?? "").join("\n").trim();
}

// ======================
// Accessible Button
// ======================
 type BtnVariant = "primary" | "secondary" | "danger" | "success";
function AButton({
  label,
  onPress,
  variant = "primary",
  disabled,
  hint,
  icon,
  onFocusVoice,
}: {
  label: string;
  onPress: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  hint?: string;
  icon?: string;
  onFocusVoice?: string;
}) {
  const style = [
    styles.btn,
    variant === "secondary"
      ? styles.btnSecondary
      : variant === "danger"
      ? styles.btnDanger
      : variant === "success"
      ? styles.btnSuccess
      : styles.btnPrimary,
    disabled && styles.btnDisabled,
  ];
  const textStyle = [
    styles.btnText,
    variant === "secondary" ? styles.btnTextSecondary : styles.btnTextPrimary,
  ];
  return (
    <TouchableOpacity
      style={style}
      onPress={() => {
        stopSpeaking();
        onPress();
      }}
      onFocus={() => {
        if (onFocusVoice && !disabled) speakHi(onFocusVoice);
      }}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${icon ? icon + " " : ""}${label}`}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
    >
      <Text style={textStyle}>
        {icon ? `${icon} ` : ""}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ======================
// Main TTS Screen
// ======================
export default function SpeechScreen() {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<"hi-IN" | "en-US">(i18n.language === 'hi' ? "hi-IN" : "en-US");
  const [status, setStatus] = useState<string>("");

  const M = i18n.language === 'hi' ? VOICE_MESSAGES_HI : VOICE_MESSAGES_EN;

  // speak helper based on current language
  const speakInCurrentLanguage = (message: string) => {
    Speech.stop();
    const languageCode = getSpeechLanguageCode(i18n.language);
    Speech.speak(message, { language: languageCode, pitch: 1.0, rate: 0.95 });
  };

  // announce on mount
  useEffect(() => {
    const tmr = setTimeout(() => {
      speakInCurrentLanguage(M.welcome);
      setTimeout(() => speakInCurrentLanguage(M.chooseInput), 2600);
    }, 600);
    return () => {
      clearTimeout(tmr);
      stopSpeaking();
    };
  }, [i18n.language]);

  // speak helper based on chosen language
  const speak = (content: string) => {
    if (!content?.trim()) {
      speakInCurrentLanguage(M.noContent);
      Alert.alert(t('speechPage.noText'), t('speechPage.addTextFirst'));
      return;
    }
    Speech.stop();
    const languageCode = getSpeechLanguageCode(i18n.language);
    Speech.speak(content, { language: languageCode, pitch: 1.0, rate: 0.95 });
  };

  const pickImage = async () => {
    stopSpeaking();
    speakInCurrentLanguage(M.processing);
    try {
      setBusy(true);
      setStatus(t('common.loading'));
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setStatus("");
        speakInCurrentLanguage(i18n.language === 'hi' ? "फोटो नहीं चुनी गई।" : "No image selected.");
        return;
      }
      const asset = res.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName ?? "image.jpg",
        type: asset.mimeType ?? "image/jpeg",
      };
      setStatus(t('common.loading'));
      const extracted = await ocrWithOcrSpaceAsync(file);
      if (!extracted) {
        speakInCurrentLanguage(M.noContent);
        setBusy(false);
        setStatus("");
        return;
      }
      setText(extracted);
      setBusy(false);
      setStatus("");
      speakInCurrentLanguage(M.textFound);
      setTimeout(() => speak(extracted), 900);
    } catch (e: any) {
      setBusy(false);
      setStatus("");
      speakInCurrentLanguage(i18n.language === 'hi' ? "त्रुटि हुई।" : "An error occurred.");
      Alert.alert(
        "Image OCR Error",
        e?.message ?? "Could not extract text from the selected image."
      );
    }
  };

  const pickPdf = async () => {
    stopSpeaking();
    speakInCurrentLanguage(M.processing);
    try {
      setBusy(true);
      setStatus(t('common.loading'));
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setStatus("");
        speakInCurrentLanguage(i18n.language === 'hi' ? "पीडीएफ नहीं चुनी गई।" : "No PDF selected.");
        return;
      }
      const asset = res.assets[0];
      const file = { uri: asset.uri, name: asset.name ?? "document.pdf", type: "application/pdf" };
      setStatus(t('common.loading'));
      const extracted = await ocrWithOcrSpaceAsync(file);
      if (!extracted) {
        speakInCurrentLanguage(M.noContent);
        setBusy(false);
        setStatus("");
        return;
      }
      setText(extracted);
      setBusy(false);
      setStatus("");
      speakInCurrentLanguage(M.textFound);
      setTimeout(() => speak(extracted), 900);
    } catch (e: any) {
      setBusy(false);
      setStatus("");
      speakInCurrentLanguage(i18n.language === 'hi' ? "त्रुटि हुई।" : "An error occurred.");
      Alert.alert(
        "PDF OCR Error",
        e?.message ?? "Could not extract text from the selected PDF."
      );
    }
  };

  const handleTextFocus = () => {
    speakInCurrentLanguage(M.typeText);
  };

  const clearAll = () => {
    stopSpeaking();
    setText("");
    speakInCurrentLanguage(t('speechPage.cleared'));
  };

  const languageName = lang === "hi-IN" ? t('language.hindi') : t('language.english');

  return (
    <View style={styles.container}>
      <SimpleHamburgerMenu/>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dhvani</Text>
        <Text style={styles.subtitle}>{t('speechPage.subtitle')}</Text>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => {
            stopSpeaking();
            speakInCurrentLanguage(M.instructions);
          }}
          accessible
          accessibilityLabel={i18n.language === 'hi' ? "उपयोग का तरीका सुनें" : "Hear usage instructions"}
          accessibilityHint={i18n.language === 'hi' ? "इस बटन को दबाने से आपको उपयोग का तरीका सुनाई देगा" : "Press to hear how to use this screen"}
        >
          <Text style={styles.helpBtnText}>🔊 {t('speechPage.help')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Method Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.chooseInput')}</Text>
          <Text style={styles.sectionDesc}>{t('speechPage.chooseInputDesc')}</Text>
          
          <View style={styles.buttonRow}>
            <AButton
              label={t('speechPage.selectImage')}
              onPress={pickImage}
              icon="📷"
              hint={t('speechPage.selectImage')}
              onFocusVoice={M.selectImage}
            />
            <AButton
              label={t('speechPage.selectPdf')}
              onPress={pickPdf}
              icon="📄"
              hint={t('speechPage.selectPdf')}
              onFocusVoice={M.selectPdf}
            />
          </View>
        </View>

        {/* Text Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.typeYourText')}</Text>
          <Text style={styles.sectionDesc}>{t('speechPage.typeYourTextDesc')}</Text>
          
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder={t('speechPage.placeholder')}
            placeholderTextColor="#64748b"
            multiline
            textAlignVertical="top"
            onFocus={handleTextFocus}
            accessible
            accessibilityLabel={t('speechPage.typeYourText')}
            accessibilityHint={t('speechPage.typeYourTextDesc')}
          />
        </View>

        {/* Playback Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.playbackControls')}</Text>
          
          <View style={styles.buttonRow}>
            <AButton
              label={t('speechPage.playIn', { language: languageName })}
              onPress={() => speak(text)}
              variant="success"
              icon="▶️"
              disabled={!text.trim() || busy}
              hint={t('speechPage.pressPlayHint')}
            />
            <AButton
              label={t('speechPage.stop')}
              onPress={stopSpeaking}
              variant="secondary"
              icon="⏹️"
              hint={t('speechPage.speechWillStop')}
            />
          </View>
          
          <View style={styles.buttonRow}>
            <AButton
              label={t('speechPage.clearText')}
              onPress={clearAll}
              variant="danger"
              icon="🗑️"
              disabled={!text.trim()}
              hint={t('speechPage.cleared')}
            />
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.languageSelection')}</Text>
          
          <View style={styles.buttonRow}>
            <AButton
              label={t('language.hindi')}
              onPress={() => setLang("hi-IN")}
              variant={lang === "hi-IN" ? "success" : "secondary"}
              icon="🇮🇳"
              hint={t('language.hindi')}
            />
            <AButton
              label={t('language.english')}
              onPress={() => setLang("en-US")}
              variant={lang === "en-US" ? "success" : "secondary"}
              icon="🇺🇸"
              hint={t('language.english')}
            />
          </View>
        </View>

        {/* Current Text Preview */}
        {text.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('speechPage.currentTextPreview')}</Text>
            <Text style={styles.previewText}>
              {text.length > 200 ? `${text.substring(0, 200)}...` : text}
            </Text>
            <Text style={styles.charCount}>
              {text.length} {t('speech.characters')}
              {text.length > 5000 && (
                <Text style={styles.warning}> ({t('speech.willBeTruncated')})</Text>
              )}
            </Text>
          </View>
        )}

        {/* Status */}
        {status && (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#1e40af" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ======================
// Accessible White & Blue Theme Styles
// ======================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 70 : 50,
    paddingHorizontal: 28,
    paddingBottom: 32,
    backgroundColor: "#ffffff",
    borderBottomWidth: 2,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#1e40af",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    color: "#475569",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 28,
  },
  helpBtn: {
    alignSelf: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3b82f6",
    minHeight: 56,
    justifyContent: "center",
  },
  helpBtnText: {
    fontSize: 18,
    color: "#1e40af",
    fontWeight: "600",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    padding: 28,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 40,
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1e40af",
    marginBottom: 12,
    textAlign: "center",
  },
  sectionDesc: {
    fontSize: 18,
    color: "#64748b",
    marginBottom: 24,
    lineHeight: 26,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    borderWidth: 2,
  },
  btnPrimary: {
    backgroundColor: "#3b82f6",
    borderColor: "#1e40af",
  },
  btnSecondary: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
  },
  btnSuccess: {
    backgroundColor: "#10b981",
    borderColor: "#059669",
  },
  btnDanger: {
    backgroundColor: "#ef4444",
    borderColor: "#dc2626",
  },
  btnDisabled: {
    opacity: 0.4,
  },
  btnText: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
  },
  btnTextPrimary: {
    color: "#ffffff",
  },
  btnTextSecondary: {
    color: "#475569",
  },
  textInput: {
    borderWidth: 3,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    padding: 20,
    fontSize: 20,
    color: "#1e293b",
    minHeight: 160,
    backgroundColor: "#ffffff",
    textAlignVertical: "top",
    lineHeight: 28,
  },
  previewText: {
    fontSize: 18,
    color: "#475569",
    lineHeight: 26,
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  charCount: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "right",
    marginTop: 8,
  },
  warning: {
    color: "#dc2626",
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#dbeafe",
    borderRadius: 16,
    marginTop: 20,
    borderWidth: 2,
    borderColor: "#93c5fd",
    minHeight: 80,
  },
  statusText: {
    marginLeft: 16,
    fontSize: 18,
    color: "#1e40af",
    fontWeight: "600",
  },
});