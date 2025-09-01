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
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as Speech from "expo-speech";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";
import { useTranslation } from 'react-i18next';
import { getSpeechLanguageCode } from '@/src/locales/i18n';

const { width } = Dimensions.get('window');

const OCR_SPACE_API_KEY = "K86479850788957";
const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

const VOICE_MESSAGES_HI = {
  welcome: "नमस्ते। आपका ध्वनि ऐप में स्वागत है। यह स्क्रीन आपके टेक्स्ट को सुनाकर बताएगी।",
  chooseInput: "आप टेक्स्ट जोड़ने के लिए फोटो चुन सकते हैं, पीडीएफ चुन सकते हैं, या सीधे टाइप कर सकते हैं।",
  selectImage: "फोटो चुनने के लिए यहाँ दबाएं।",
  selectPdf: "पीडीएफ फाइल चुनने के लिए यहाँ दबाएं।",
  typeText: "यहाँ अपना टेक्स्ट लिखें।",
  processing: "कृपया रुकें। हम आपकी फाइल से टेक्स्ट निकाल रहे हैं।",
  textFound: "टेक्स्ट मिल गया है। अब मैं इसे पढ़कर सुनाऊँगी।",
  noContent: "कोई टेक्स्ट नहीं मिला।",
  instructions: "उपयोग का तरीका: फोटो या पीडीएफ चुनें, या टेक्स्ट टाइप करें। फिर सुनाने के लिए प्ले दबाएं। भाषा बदलने के लिए हिंदी या English बटन दबाएं।",
};

const VOICE_MESSAGES_EN = {
  welcome: "Hello. Welcome to Dhvani. This screen reads your text aloud.",
  chooseInput: "You can add text by selecting a photo, picking a PDF, or typing directly.",
  selectImage: "Press here to select an image.",
  selectPdf: "Press here to select a PDF file.",
  typeText: "Type your text here.",
  processing: "Please wait. Extracting text from your file.",
  textFound: "Text found. I will read it now.",
  noContent: "No text found.",
  instructions: "How to use: Select a photo or PDF, or type your text. Then press Play to hear it. Use the language buttons to change voice.",
};

const speakHi = (message: string) => {
  Speech.stop();
  Speech.speak(message, { language: "hi-IN", pitch: 1.0, rate: 0.95 });
};

const speakEn = (message: string) => {
  Speech.stop();
  Speech.speak(message, { language: "en-US", pitch: 1.0, rate: 1.0 });
};

const stopSpeaking = () => Speech.stop();

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
    // @ts-ignore
    uri: file.uri,
    name: file.name ?? (file.type?.includes("pdf") ? "document.pdf" : "image.jpg"),
    type: file.type ?? (file.uri.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg"),
  } as any);

  const res = await fetch(OCR_ENDPOINT, { method: "POST", body: form as any });
  if (!res.ok) throw new Error(`OCR request failed (${res.status})`);
  const json = await res.json();
  if (!json?.ParsedResults?.[0]) throw new Error("No OCR results found.");
  return json.ParsedResults.map((r: any) => r.ParsedText ?? "").join("\n").trim();
}

interface AccessibleButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  accessibilityHint?: string;
  icon?: string;
  voiceMessage?: string;
  onFocus?: () => void;
}

function AccessibleButton({ 
  label, 
  onPress, 
  disabled = false, 
  variant = 'primary',
  accessibilityHint,
  icon,
  voiceMessage,
  onFocus,
  i18n
}: AccessibleButtonProps & { i18n: any }) {
  const buttonStyle = [
    styles.button,
    variant === 'secondary' ? styles.buttonSecondary : 
    variant === 'success' ? styles.buttonSuccess :
    variant === 'danger' ? styles.buttonDanger : 
    styles.buttonPrimary,
    disabled && styles.buttonDisabled
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'secondary' ? styles.buttonTextSecondary : styles.buttonTextPrimary
  ];

  const handleFocus = () => {
    if (voiceMessage && !disabled) {
      const languageCode = getSpeechLanguageCode(i18n.language);
      Speech.speak(voiceMessage, { language: languageCode, pitch: 1.0, rate: 0.95 });
    }
    onFocus?.();
  };

  const handlePress = () => {
    stopSpeaking();
    onPress();
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      onFocus={handleFocus}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${icon ? icon + ' ' : ''}${label}`}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      <Text style={textStyle}>
        {icon && <Text style={styles.buttonIcon}>{icon} </Text>}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function SpeechScreen() {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<"hi-IN" | "en-US">(i18n.language === 'hi' ? "hi-IN" : "en-US");
  const [status, setStatus] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);

  const M = i18n.language === 'hi' ? VOICE_MESSAGES_HI : VOICE_MESSAGES_EN;

  const speakInCurrentLanguage = (message: string) => {
    Speech.stop();
    const languageCode = getSpeechLanguageCode(i18n.language);
    Speech.speak(message, { language: languageCode, pitch: 1.0, rate: 0.95 });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      speakInCurrentLanguage(M.welcome);
      setTimeout(() => speakInCurrentLanguage(M.chooseInput), 2600);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, [i18n.language]);

  const speak = (content: string) => {
    if (!content?.trim()) {
      speakInCurrentLanguage(M.noContent);
      Alert.alert(t('speechPage.noText'), t('speechPage.addTextFirst'));
      return;
    }
    setIsPlaying(true);
    Speech.stop();
    const languageCode = lang;
    Speech.speak(content, { 
      language: languageCode, 
      pitch: 1.0, 
      rate: 0.95,
      onDone: () => setIsPlaying(false),
      onStopped: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const stopSpeech = () => {
    Speech.stop();
    setIsPlaying(false);
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
      Alert.alert("Image OCR Error", e?.message ?? "Could not extract text from the selected image.");
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
      Alert.alert("PDF OCR Error", e?.message ?? "Could not extract text from the selected PDF.");
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

  const speakInstructions = () => {
    stopSpeaking();
    speakInCurrentLanguage(M.instructions);
  };

  const languageName = lang === "hi-IN" ? t('language.hindi') : t('language.english');

  return (
    <View style={styles.container}>
      <SimpleHamburgerMenu/>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.header}>
        <Text style={styles.appTitle}>Dhvani</Text>
        <Text style={styles.appSubtitle}>{t('speechPage.subtitle')}</Text>
        <Text style={styles.appDescription}>{t('speechPage.description')}</Text>
        <TouchableOpacity 
          style={styles.voiceButton}
          onPress={speakInstructions}
          accessible={true}
          accessibilityLabel={t('speechPage.help')}
        >
          <Text style={styles.voiceButtonText}>Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="Main content area"
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.chooseInput')}</Text>
          <Text style={styles.sectionDescription}>{t('speechPage.chooseInputDesc')}</Text>
          <View style={styles.buttonContainer}>
            <AccessibleButton
              label={t('speechPage.selectImage')}
              onPress={pickImage}
              disabled={busy}
              icon="📷"
              voiceMessage={M.selectImage}
              accessibilityHint={t('speechPage.selectImage')}
              i18n={i18n}
            />
            <AccessibleButton
              label={t('speechPage.selectPdf')}
              onPress={pickPdf}
              disabled={busy}
              variant="secondary"
              icon="📄"
              voiceMessage={M.selectPdf}
              accessibilityHint={t('speechPage.selectPdf')}
              i18n={i18n}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.typeYourText')}</Text>
          <Text style={styles.sectionDescription}>{t('speechPage.typeYourTextDesc')}</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder={t('speechPage.placeholder')}
              placeholderTextColor="#94a3b8"
              multiline
              textAlignVertical="top"
              onFocus={handleTextFocus}
              accessible={true}
              accessibilityLabel={t('speechPage.typeYourText')}
              accessibilityHint={t('speechPage.typeYourTextDesc')}
            />
          </View>
        </View>

        {busy && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.processingText}>{status}</Text>
            <Text style={styles.processingSubtext}>{t('common.loading')}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.playbackControls')}</Text>
          <Text style={styles.sectionDescription}>Control speech playback and choose your preferred language</Text>
          
          <View style={styles.buttonContainer}>
            {!isPlaying ? (
              <AccessibleButton
                label={t('speechPage.playIn', { language: languageName })}
                onPress={() => speak(text)}
                variant="success"
                icon="▶️"
                disabled={!text.trim() || busy}
                accessibilityHint={t('speechPage.pressPlayHint')}
                i18n={i18n}
              />
            ) : (
              <AccessibleButton
                label={t('speechPage.stop')}
                onPress={stopSpeech}
                variant="danger"
                icon="⏹️"
                accessibilityHint={t('speechPage.speechWillStop')}
                i18n={i18n}
              />
            )}
            <AccessibleButton
              label={t('speechPage.clearText')}
              onPress={clearAll}
              variant="secondary"
              icon="🗑️"
              disabled={!text.trim()}
              accessibilityHint={t('speechPage.cleared')}
              i18n={i18n}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.languageSelection')}</Text>
          <Text style={styles.sectionDescription}>Choose the voice language for speech playback</Text>
          
          <View style={styles.buttonContainer}>
            <AccessibleButton
              label={t('language.hindi')}
              onPress={() => setLang("hi-IN")}
              variant={lang === "hi-IN" ? "success" : "secondary"}
              icon="🇮🇳"
              accessibilityHint={t('language.hindi')}
              i18n={i18n}
            />
            <AccessibleButton
              label={t('language.english')}
              onPress={() => setLang("en-US")}
              variant={lang === "en-US" ? "success" : "secondary"}
              icon="🇺🇸"
              accessibilityHint={t('language.english')}
              i18n={i18n}
            />
          </View>
        </View>

        {text.trim() && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('speechPage.currentTextPreview')}</Text>
            <View style={styles.textDisplayContainer}>
              <ScrollView 
                style={styles.textScrollView}
                contentContainerStyle={styles.scrollContent}
                accessible={true}
                accessibilityLabel={`Current text content: ${text}`}
                accessibilityHint="Scroll to read the full text"
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                scrollEventThrottle={16}
                bounces={true}
                overScrollMode="always"
                nestedScrollEnabled={true}
              >
                <Text style={styles.previewText} selectable={true}>
                  {text}
                </Text>
              </ScrollView>
            </View>
            <Text style={styles.charCount}>
              {text.length} {t('speech.characters')}
              {text.length > 5000 && (
                <Text style={styles.warning}> ({t('speech.willBeTruncated')})</Text>
              )}
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('speechPage.howToUse')}</Text>
          <TouchableOpacity 
            style={styles.instructionsButton}
            onPress={speakInstructions}
            accessible={true}
            accessibilityLabel={t('speechPage.help')}
          >
            <Text style={styles.instructionsButtonText}>{t('speechPage.help')}</Text>
          </TouchableOpacity>
        
          <View style={styles.instructionContainer}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('speechPage.chooseInput')}</Text>
                <Text style={styles.stepDescription}>
                  Select an image, PDF file, or type your text directly into the input field
                </Text>
              </View>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choose Language</Text>
                <Text style={styles.stepDescription}>
                  Select Hindi or English for the voice that will read your text aloud
                </Text>
              </View>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Listen</Text>
                <Text style={styles.stepDescription}>
                  Press the Play button to hear your text read aloud, or Stop to pause playback
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#3b82f6',
    marginBottom: 8,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 18,
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  appDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  voiceButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 24,
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonSecondary: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
  },
  buttonDanger: {
    backgroundColor: '#ef4444',
  },
  buttonDisabled: {
    backgroundColor: '#f1f5f9',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextSecondary: {
    color: '#3b82f6',
  },
  buttonIcon: {
    fontSize: 20,
  },
  inputContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  textInput: {
    minHeight: 140,
    padding: 20,
    fontSize: 18,
    color: '#1e293b',
    lineHeight: 26,
    textAlignVertical: 'top',
  },
  processingContainer: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  processingText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  processingSubtext: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    textAlign: 'center',
  },
  textDisplayContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    height: 200,
    overflow: 'hidden',
    marginBottom: 16,
  },
  textScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scrollContent: {
    paddingVertical: 4,
    paddingBottom: 20,
  },
  previewText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  charCount: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'right',
  },
  warning: {
    color: '#ef4444',
    fontWeight: '600',
  },
  instructionsButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    marginTop: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
});