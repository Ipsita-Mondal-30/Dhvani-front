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

// ======================
// CONFIG — replace with your OCR.Space API key
// ======================
const OCR_SPACE_API_KEY = "K86479850788957"; // <-- put your real key here
const OCR_ENDPOINT = "https://api.ocr.space/parse/image";

// ======================
// Voice Messages (Hindi guidance)
// ======================
const VOICE_MESSAGES = {
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
  });

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
  const [text, setText] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState<"hi-IN" | "en-US">("hi-IN");
  const [status, setStatus] = useState<string>("");

  // announce on mount
  useEffect(() => {
    const t = setTimeout(() => {
      speakHi(VOICE_MESSAGES.welcome);
      setTimeout(() => speakHi(VOICE_MESSAGES.chooseInput), 2600);
    }, 600);
    return () => {
      clearTimeout(t);
      stopSpeaking();
    };
  }, []);

  // speak helper based on chosen language
  const speak = (content: string) => {
    if (!content?.trim()) {
      speakHi(VOICE_MESSAGES.noContent);
      Alert.alert("No Text", "Please add some text first.");
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
    speakHi(VOICE_MESSAGES.processing);
    try {
      setBusy(true);
      setStatus("Opening image picker…");
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
      });
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setStatus("");
        speakHi("फोटो नहीं चुनी गई।");
        return;
      }
      const asset = res.assets[0];
      const file = {
        uri: asset.uri,
        name: asset.fileName ?? "image.jpg",
        type: asset.mimeType ?? "image/jpeg",
      };
      setStatus("Running OCR on image…");
      const extracted = await ocrWithOcrSpaceAsync(file);
      if (!extracted) {
        speakHi(VOICE_MESSAGES.noContent);
        setBusy(false);
        setStatus("");
        return;
      }
      setText(extracted);
      setBusy(false);
      setStatus("");
      speakHi(VOICE_MESSAGES.textFound);
      setTimeout(() => speak(extracted), 900);
    } catch (e: any) {
      setBusy(false);
      setStatus("");
      speakHi("त्रुटि हुई।");
      Alert.alert(
        "Image OCR Error",
        e?.message ?? "Could not extract text from the selected image."
      );
    }
  };

  const pickPdf = async () => {
    stopSpeaking();
    speakHi(VOICE_MESSAGES.processing);
    try {
      setBusy(true);
      setStatus("Opening document picker…");
      const res = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setStatus("");
        speakHi("पीडीएफ नहीं चुनी गई।");
        return;
      }
      const asset = res.assets[0];
      const file = { uri: asset.uri, name: asset.name ?? "document.pdf", type: "application/pdf" };
      setStatus("Running OCR on PDF…");
      const extracted = await ocrWithOcrSpaceAsync(file);
      if (!extracted) {
        speakHi(VOICE_MESSAGES.noContent);
        setBusy(false);
        setStatus("");
        return;
      }
      setText(extracted);
      setBusy(false);
      setStatus("");
      speakHi(VOICE_MESSAGES.textFound);
      setTimeout(() => speak(extracted), 900);
    } catch (e: any) {
      setBusy(false);
      setStatus("");
      speakHi("त्रुटि हुई।");
      Alert.alert(
        "PDF OCR Error",
        e?.message ?? "Could not extract text from the selected PDF."
      );
    }
  };

  const handleTextFocus = () => speakHi(VOICE_MESSAGES.typeText);

  const clearAll = () => {
    stopSpeaking();
    setText("");
    speakHi("टेक्स्ट साफ कर दिया गया।");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Dhvani</Text>
        <Text style={styles.subtitle}>Text to Speech</Text>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => {
            stopSpeaking();
            speakHi(VOICE_MESSAGES.instructions);
          }}
          accessible
          accessibilityLabel="उपयोग का तरीका सुनें"
          accessibilityHint="इस बटन को दबाने से आपको उपयोग का तरीका सुनाई देगा"
        >
          <Text style={styles.helpBtnText}>🔊 सहायता</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
        accessible
        accessibilityLabel="Main content area"
      >
        {/* Input actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Input</Text>
          <Text style={styles.sectionDesc}>
            Pick an image or PDF to extract text, or type below.
          </Text>

          <View style={{ gap: 14 }}>
            <AButton
              label="Select Image"
              icon="📷"
              onPress={pickImage}
              hint="Opens gallery to select an image for OCR and speech"
              onFocusVoice={VOICE_MESSAGES.selectImage}
              disabled={busy}
            />
            <AButton
              label="Select PDF"
              icon="📄"
              variant="secondary"
              onPress={pickPdf}
              hint="Opens file picker for PDF OCR"
              onFocusVoice={VOICE_MESSAGES.selectPdf}
              disabled={busy}
            />
          </View>
        </View>

        {/* Manual input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type or Paste Text</Text>
          <Text style={styles.sectionDesc}>What you type here will be spoken aloud.</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Type or paste text here…"
              placeholderTextColor="#64748b"
              value={text}
              onChangeText={setText}
              onFocus={handleTextFocus}
              textAlignVertical="top"
              accessible
              accessibilityLabel="Text input"
              accessibilityHint="Type or paste text here, then press Play to hear it"
            />
          </View>
        </View>

        {/* Busy indicator */}
        {busy && (
          <View style={styles.busyWrap}>
            <ActivityIndicator size="large" />
            {!!status && <Text style={styles.busyText}>{status}</Text>}
          </View>
        )}

        {/* Playback controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          <View style={{ gap: 14 }}>
            <AButton
              label={`Play (${lang === "hi-IN" ? "Hindi" : "English"})`}
              icon="▶️"
              variant="success"
              onPress={() => speak(text)}
              hint="Speaks the text aloud"
              onFocusVoice="प्ले दबाने से टेक्स्ट सुनाई देगा।"
              disabled={busy}
            />
            <AButton
              label="Stop"
              icon="⏹️"
              variant="danger"
              onPress={stopSpeaking}
              hint="Stops speech"
              onFocusVoice="स्पीच रोक दी जाएगी।"
            />
            <View style={styles.row}>
              <AButton
                label="🇮🇳 Hindi"
                onPress={() => {
                  setLang("hi-IN");
                  speakHi("भाषा हिंदी चुनी गई।");
                }}
                variant={lang === "hi-IN" ? "success" : "secondary"}
                hint="Set speech language to Hindi"
              />
              <AButton
                label="🇺🇸 English"
                onPress={() => {
                  setLang("en-US");
                  speakEn("English language selected.");
                }}
                variant={lang === "en-US" ? "success" : "secondary"}
                hint="Set speech language to English"
              />
            </View>
            <AButton
              label="Clear Text"
              icon="🗑️"
              variant="secondary"
              onPress={clearAll}
              hint="Clears current text"
              onFocusVoice="टेक्स्ट साफ करने के लिए दबाएं।"
            />
          </View>
        </View>

        {/* Preview of text */}
        {!!text && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Text</Text>
            <View style={styles.previewBox}>
              <ScrollView
                style={{ maxHeight: 200, padding: 12 }}
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
// Styles
// ======================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#1e40af",
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 4,
  },
  title: { fontSize: 30, fontWeight: "700", color: "#fff", marginBottom: 6, paddingTop: 6 },
  subtitle: { fontSize: 16, color: "#dbeafe" },
  helpBtn: {
    marginTop: 12,
    backgroundColor: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  helpBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },

  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#1e293b", marginBottom: 8 },
  sectionDesc: { fontSize: 15, color: "#64748b", marginBottom: 16 },

  btn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 12,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  btnPrimary: { backgroundColor: "#1e40af" },
  btnSecondary: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#1e40af" },
  btnSuccess: { backgroundColor: "#059669" },
  btnDanger: { backgroundColor: "#dc2626" },
  btnDisabled: { backgroundColor: "#e2e8f0", elevation: 0 },
  btnText: { fontSize: 16, fontWeight: "600" },
  btnTextPrimary: { color: "#fff" },
  btnTextSecondary: { color: "#1e40af" },

  inputWrap: {
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 1,
  },
  input: {
    minHeight: 120,
    padding: 14,
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 22,
  },

  busyWrap: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 12,
  },
  busyText: { marginTop: 8, color: "#1e40af", fontWeight: "600" },

  previewBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
  },

  previewText: { fontSize: 16, color: "#334155", lineHeight: 24 },

  row: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
});
