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

// ======================
// CONFIG — replace with your OCR.Space API key
// ======================
const OCR_SPACE_API_KEY = "K86479850788957"; // <-- put your real key here
const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

// ======================
// Voice Messages (Hindi & English guidance)
// ======================
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

  // announce on mount
  useEffect(() => {
    const tmr = setTimeout(() => {
      if (i18n.language === 'hi') {
        speakHi(M.welcome);
        setTimeout(() => speakHi(M.chooseInput), 2600);
      } else {
        speakEn(M.welcome);
        setTimeout(() => speakEn(M.chooseInput), 2600);
      }
    }, 600);
    return () => {
      clearTimeout(tmr);
      stopSpeaking();
    };
  }, [i18n.language]);

  // speak helper based on chosen language
  const speak = (content: string) => {
    if (!content?.trim()) {
      if (i18n.language === 'hi') {
        speakHi(M.noContent);
      } else {
        speakEn(M.noContent);
      }
      Alert.alert(t('speechPage.noText'), t('speechPage.addTextFirst'));
        return;
      }
    Speech.stop();
    if (lang === "hi-IN") {
      Speech.speak(content, { language: "hi-IN", pitch: 1.0, rate: 0.95 });
      } else {
      Speech.speak(content, { language: "en-US", pitch: 1.0, rate: 1.0 });
    }
  };

  const pickImage = async () => {
    stopSpeaking();
    if (i18n.language === 'hi') speakHi(M.processing); else speakEn(M.processing);
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
        if (i18n.language === 'hi') speakHi("फोटो नहीं चुनी गई।"); else speakEn("No image selected.");
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
        if (i18n.language === 'hi') speakHi(M.noContent); else speakEn(M.noContent);
        setBusy(false);
        setStatus("");
        return;
      }
      setText(extracted);
      setBusy(false);
      setStatus("");
      if (i18n.language === 'hi') speakHi(M.textFound); else speakEn(M.textFound);
      setTimeout(() => speak(extracted), 900);
    } catch (e: any) {
      setBusy(false);
      setStatus("");
      if (i18n.language === 'hi') speakHi("त्रुटि हुई।"); else speakEn("An error occurred.");
      Alert.alert(
        "Image OCR Error",
        e?.message ?? "Could not extract text from the selected image."
      );
    }
  };

  const pickPdf = async () => {
    stopSpeaking();
    if (i18n.language === 'hi') speakHi(M.processing); else speakEn(M.processing);
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
        if (i18n.language === 'hi') speakHi("पीडीएफ नहीं चुनी गई।"); else speakEn("No PDF selected.");
        return;
      }
      const asset = res.assets[0];
      const file = { uri: asset.uri, name: asset.name ?? "document.pdf", type: "application/pdf" };
      setStatus(t('common.loading'));
      const extracted = await ocrWithOcrSpaceAsync(file);
      if (!extracted) {
        if (i18n.language === 'hi') speakHi(M.noContent); else speakEn(M.noContent);
        setBusy(false);
        setStatus("");
        return;
      }
      setText(extracted);
      setBusy(false);
      setStatus("");
      if (i18n.language === 'hi') speakHi(M.textFound); else speakEn(M.textFound);
      setTimeout(() => speak(extracted), 900);
    } catch (e: any) {
      setBusy(false);
      setStatus("");
      if (i18n.language === 'hi') speakHi("त्रुटि हुई।"); else speakEn("An error occurred.");
      Alert.alert(
        "PDF OCR Error",
        e?.message ?? "Could not extract text from the selected PDF."
      );
    }
  };

  const handleTextFocus = () => {
    if (i18n.language === 'hi') speakHi(M.typeText); else speakEn(M.typeText);
  };

  const clearAll = () => {
    stopSpeaking();
    setText("");
    if (i18n.language === 'hi') speakHi(t('speechPage.cleared')); else speakEn(t('speechPage.cleared'));
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
            if (i18n.language === 'hi') speakHi(M.instructions); else speakEn(M.instructions);
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
        accessible
        accessibilityLabel="Main content area"
      >
        {/* Input actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.chooseInput')}</Text>
          <Text style={styles.sectionDesc}>
            {t('speechPage.chooseInputDesc')}
          </Text>

          <View style={styles.buttonContainer}>
            <AButton
              label={t('speechPage.selectImage')}
              icon="📷"
              onPress={pickImage}
              hint={t('speechPage.selectImage')}
              onFocusVoice={M.selectImage}
              disabled={busy}
            />
            <AButton
              label={t('speechPage.selectPdf')}
              icon="📄"
              variant="secondary"
              onPress={pickPdf}
              hint={t('speechPage.selectPdf')}
              onFocusVoice={M.selectPdf}
              disabled={busy}
                />
              </View>
            </View>

        {/* Manual input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.typeYourText')}</Text>
          <Text style={styles.sectionDesc}>{t('speechPage.typeYourTextDesc')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              multiline
              placeholder={t('speechPage.placeholder')}
              placeholderTextColor="#94a3b8"
              value={text}
              onChangeText={setText}
              onFocus={handleTextFocus}
              textAlignVertical="top"
              accessible
              accessibilityLabel="Text input"
              accessibilityHint={t('speechPage.typeYourTextDesc')}
            />
              </View>
            </View>

        {/* Busy indicator */}
        {busy && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            {!!status && <Text style={styles.loadingText}>{status}</Text>}
          </View>
        )}

        {/* Playback controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.playbackControls')}</Text>
          
          {/* Main play button */}
          <View style={styles.buttonContainer}>
            <AButton
              label={`▶️ ${t('speechPage.playIn', { language: languageName })}`}
              variant="success"
              onPress={() => speak(text)}
              hint={t('speechPage.pressPlayHint')}
              onFocusVoice={i18n.language === 'hi' ? "प्ले दबाने से टेक्स्ट सुनाई देगा।" : "Press play to hear the text."}
              disabled={busy}
            />
            <AButton
              label={`⏹️ ${t('speechPage.stop')}`}
              variant="danger"
              onPress={stopSpeaking}
              hint={t('speechPage.speechWillStop')}
              onFocusVoice={i18n.language === 'hi' ? "स्पीच रोक दी जाएगी।" : t('speechPage.speechWillStop')}
              />
            </View>
            
          {/* Language selection */}
          <View style={styles.languageSection}>
            <Text style={styles.languageTitle}>{t('speechPage.languageSelection')}</Text>
            <View style={styles.languageButtons}>
              <AButton
                label="🇮🇳 हिंदी"
                onPress={() => {
                  setLang("hi-IN");
                  speakHi("भाषा हिंदी चुनी गई।");
                }}
                variant={lang === "hi-IN" ? "primary" : "secondary"}
                hint={t('speechPage.languageSelection')}
              />
              <AButton
                label="🇺🇸 English"
                onPress={() => {
                  setLang("en-US");
                  speakEn("English language selected.");
                }}
                variant={lang === "en-US" ? "primary" : "secondary"}
                hint={t('speechPage.languageSelection')}
              />
            </View>
            </View>

          {/* Clear button */}
          <View style={styles.buttonContainer}>
            <AButton
              label={`🗑️ ${t('speechPage.clearText')}`}
              variant="secondary"
              onPress={clearAll}
              hint={t('speechPage.clearText')}
              onFocusVoice={i18n.language === 'hi' ? "टेक्स्ट साफ करने के लिए दबाएं।" : t('speechPage.clearText')}
            />
          </View>
            </View>
            
        {/* Preview of text */}
        {!!text && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('speechPage.currentTextPreview')}</Text>
            <View style={styles.previewContainer}>
              <ScrollView
                style={styles.previewScroll}
                accessible
                accessibilityLabel={`Current text: ${text}`}
              >
                <Text style={styles.previewText}>{text}</Text>
              </ScrollView>
              </View>
                </View>
              )}
      </ScrollView>
            </View>
  );
}

// ======================
// Styles - Clean White & Blue Theme
// ======================
const styles = StyleSheet.create({
  container: { 
                      flex: 1,
    backgroundColor: "#ffffff" 
  },

  // Header styles
  header: {
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  title: { 
    fontSize: 36, 
    fontWeight: "700", 
    color: "#3b82f6", 
    marginBottom: 8,
  },
  subtitle: { 
    fontSize: 18, 
    color: "#64748b",
    fontWeight: "500",
  },
  helpBtn: {
    marginTop: 16,
    backgroundColor: "#3b82f6",
                      paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  helpBtnText: { 
    color: "#ffffff", 
    fontSize: 16, 
    fontWeight: "600" 
  },

  // Scroll view styles
  scrollView: { 
                      flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContent: { 
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // Section styles
  section: { 
    marginBottom: 40,
  },
  sectionTitle: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#1e293b", 
    marginBottom: 12,
  },
  sectionDesc: { 
    fontSize: 16, 
    color: "#64748b", 
    marginBottom: 24,
    lineHeight: 24,
  },

  // Button styles
  buttonContainer: {
    gap: 16,
  },
  btn: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  btnPrimary: { 
    backgroundColor: "#3b82f6" 
  },
  btnSecondary: { 
    backgroundColor: "#ffffff", 
    borderWidth: 2, 
    borderColor: "#3b82f6" 
  },
  btnSuccess: { 
    backgroundColor: "#10b981" 
  },
  btnDanger: { 
    backgroundColor: "#ef4444" 
  },
  btnDisabled: { 
    backgroundColor: "#f1f5f9", 
    shadowOpacity: 0,
    elevation: 0 
  },
  btnText: { 
                  fontSize: 18,
    fontWeight: "600" 
  },
  btnTextPrimary: { 
    color: "#ffffff" 
  },
  btnTextSecondary: { 
    color: "#3b82f6" 
  },

  // Language section
  languageSection: {
    marginTop: 24,
  },
  languageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 16,
  },
  languageButtons: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-between",
  },

  // Input styles
  inputContainer: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
                    borderRadius: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    minHeight: 140,
            padding: 20,
    fontSize: 18,
    color: "#1e293b",
    lineHeight: 26,
  },

  // Loading styles
  loadingContainer: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
                borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
  },
  loadingText: { 
    marginTop: 16, 
    color: "#3b82f6", 
    fontSize: 16,
    fontWeight: "500" 
  },

  // Preview styles
  previewContainer: {
    backgroundColor: "#f8fafc",
                borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  previewScroll: { 
    maxHeight: 200, 
    padding: 20,
  },
  previewText: { 
    fontSize: 16, 
    color: "#334155", 
    lineHeight: 24 
  },
});