import React, { useState, useEffect } from 'react';
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
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import SimpleHamburgerMenu from '@/src/components/SimpleHamburgerMenu';
import { useTranslation } from 'react-i18next';
import { getSpeechLanguageCode } from '@/src/locales/i18n';

const { width } = Dimensions.get('window');

const OCR_SPACE_API_KEY = 'K86479850788957';
const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';

const VOICE_MESSAGES = {
  welcome: 'नमस्ते। आपका ध्वनि ऐप में स्वागत है। यह ऐप टेक्स्ट को ब्रेल में बदलता है।',
  chooseInput: 'अब आप तीन तरीकों से टेक्स्ट जोड़ सकते हैं। पहला - फोटो से, दूसरा - पीडीएफ से, तीसरा - सीधे टाइप करके।',
  selectImage: 'फोटो चुनने के लिए यहाँ दबाएं। यह आपके फोन की गैलरी खोलेगा।',
  selectPdf: 'पीडीएफ फाइल चुनने के लिए यहाँ दबाएं।',
  typeText: 'आप यहाँ सीधे लिख भी सकते हैं। जो भी आप लिखेंगे वो तुरंत ब्रेल में बदल जाएगा।',
  processing: 'कृपया रुकें। हम आपकी फाइल को प्रोसेस कर रहे हैं और टेक्स्ट निकाल रहे हैं।',
  textFound: 'बढ़िया! हमें टेक्स्ट मिल गया है और इसे ब्रेल में बदल दिया गया है।',
  brailleReady: 'आपका ब्रेल टेक्स्ट तैयार है। अब आप इसे सेव कर सकते हैं या साफ कर सकते हैं।',
  saveFile: 'ब्रेल फाइल सेव करने के लिए यहाँ दबाएं।',
  clearAll: 'सब कुछ साफ करने के लिए यहाँ दबाएं।',
  fileSaved: 'आपकी ब्रेल फाइल सफलतापूर्वक सेव हो गई है।',
  error: 'कुछ समस्या हुई है। कृपया दोबारा कोशिश करें।',
  noContent: 'कोई टेक्स्ट नहीं मिला। कृपया दूसरी फाइल चुनें या टेक्स्ट टाइप करें।',
  instructions: 'उपयोग करने का तरीका: पहले फोटो, पीडीएफ चुनें या टेक्स्ट टाइप करें। फिर यह अपने आप ब्रेल में बदल जाएगा। अंत में आप इसे सेव कर सकते हैं।',
  readingText: 'अब मैं आपके लिए टेक्स्ट पढ़ रहा हूँ।'
};

const speakInCurrentLanguage = (message: string, i18n: any) => {
  Speech.speak(message, {
    language: getSpeechLanguageCode(i18n.language),
    pitch: 1.0,
    rate: 0.8,
    volume: 1.0,
  });
};

const stopSpeaking = () => {
  Speech.stop();
};

const BRAILLE_MAP: Record<string, string> = {
  a:'⠁', b:'⠃', c:'⠉', d:'⠙', e:'⠑', f:'⠋', g:'⠛', h:'⠓', i:'⠊', j:'⠚',
  k:'⠅', l:'⠇', m:'⠍', n:'⠝', o:'⠕', p:'⠏', q:'⠟', r:'⠗', s:'⠎', t:'⠞',
  u:'⠥', v:'⠧', w:'⠺', x:'⠭', y:'⠽', z:'⠵',
  ' ':' ', '\n':'\n', '.':'⠲', ',':'⠂', '?':'⠦', ';':'⠆', ':':'⠒', '!':'⠖', '\'':'⠄', '-':'⠤', '–':'⠤', '—':'⠤', '"':'⠐⠶', '(':'⠐⠣', ')':'⠐⠜',
};
const NUMBER_SIGN = '⠼';
const DIGIT_TO_BRAILLE: Record<string, string> = {
  '1': '⠁','2':'⠃','3':'⠉','4':'⠙','5':'⠑','6':'⠋','7':'⠛','8':'⠓','9':'⠊','0':'⠚'
};

function toBrailleGrade1(input: string): string {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (/[0-9]/.test(ch)) {
      let j = i;
      let num = '';
      while (j < input.length && /[0-9]/.test(input[j])) {
        num += input[j];
        j++;
      }
      out += NUMBER_SIGN + num.split('').map(d => DIGIT_TO_BRAILLE[d]).join('');
      i = j;
      continue;
    }
    const lower = ch.toLowerCase();
    if (/[A-Z]/.test(ch)) {
      out += '⠠' + (BRAILLE_MAP[lower] ?? ch);
      i++;
      continue;
    }
    out += BRAILLE_MAP[lower] ?? ch;
    i++;
  }
  return out;
}

async function ocrWithOcrSpaceAsync(file: { uri: string; name?: string; type?: string }) {
  const form = new FormData();
  form.append('apikey', OCR_SPACE_API_KEY);
  form.append('language', 'eng');
  form.append('isOverlayRequired', 'false');
  form.append('isTable', 'false');
  form.append('scale', 'true');
  form.append('OCREngine', '2');
  form.append('file', {
    // @ts-ignore
    uri: file.uri,
    name: file.name ?? (file.type?.includes('pdf') ? 'document.pdf' : 'image.jpg'),
    type: file.type ?? (file.uri.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
  } as any);
  const res = await fetch(OCR_ENDPOINT, { method: 'POST', body: form as any });
  if (!res.ok) throw new Error(`OCR request failed (${res.status})`);
  const json = await res.json();
  if (!json?.ParsedResults?.[0]) throw new Error('No OCR results found.');
  return json.ParsedResults.map((r: any) => r.ParsedText ?? '').join('\n').trim();
}

async function saveBrailleFile(brailleText: string, baseName = 'braille-output') {
  const filename = `${baseName}.txt`;
  if (Platform.OS === 'android') {
    try {
      const perm = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (perm.granted) {
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(perm.directoryUri, filename, 'text/plain');
        await FileSystem.writeAsStringAsync(fileUri, brailleText, { encoding: FileSystem.EncodingType.UTF8 });
        Alert.alert('File Saved Successfully', 'Your Braille file has been saved and can be shared with others.');
        return;
      }
    } catch {}
  }
  const target = FileSystem.documentDirectory! + filename;
  await FileSystem.writeAsStringAsync(target, brailleText, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(target, { mimeType: 'text/plain', dialogTitle: 'Share Braille file' });
  } else {
    Alert.alert('File Saved Successfully', `Your Braille file has been saved to: ${target}`);
  }
}

interface AccessibleButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
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
    variant === 'secondary' ? styles.buttonSecondary : variant === 'success' ? styles.buttonSuccess : styles.buttonPrimary,
    disabled && styles.buttonDisabled
  ];

  const textStyle = [
    styles.buttonText,
    variant === 'secondary' ? styles.buttonTextSecondary : styles.buttonTextPrimary
  ];

  const handleFocus = () => {
    if (voiceMessage && !disabled) {
      speakInCurrentLanguage(voiceMessage, i18n);
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

export default function BrailleScreen() {
  const { t, i18n } = useTranslation();
  const [extractedText, setExtractedText] = useState('');
  const [braille, setBraille] = useState('');
  const [typedText, setTypedText] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      speakInCurrentLanguage(VOICE_MESSAGES.welcome, i18n);
      setTimeout(() => {
        speakInCurrentLanguage(VOICE_MESSAGES.chooseInput, i18n);
      }, 3000);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, []);

  const pickImage = async () => {
    stopSpeaking();
    speakInCurrentLanguage(VOICE_MESSAGES.processing, i18n);
    try {
      setBusy(true);
      setCurrentAction(t('common.loading'));
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setCurrentAction('');
        speakInCurrentLanguage('फोटो नहीं चुनी गई। कृपया दोबारा कोशिश करें।', i18n);
        return;
      }
      const asset = res.assets[0];
      const file = { 
        uri: asset.uri, 
        name: asset.fileName ?? 'image.jpg', 
        type: asset.mimeType ?? 'image/jpeg' 
      };
      const text = await ocrWithOcrSpaceAsync(file);
      if (!text || text.trim().length === 0) {
        speakInCurrentLanguage(VOICE_MESSAGES.noContent, i18n);
        setBusy(false);
        setCurrentAction('');
        return;
      }
      setExtractedText(text);
      setBraille(toBrailleGrade1(text));
      setTypedText('');
      speakInCurrentLanguage(VOICE_MESSAGES.textFound, i18n);
      setTimeout(() => {
        speakInCurrentLanguage(VOICE_MESSAGES.brailleReady, i18n);
      }, 2000);
      Alert.alert(
        t('common.success'), 
        t('braille.extractedTextDesc')
      );
    } catch (e: any) {
      speakInCurrentLanguage(VOICE_MESSAGES.error, i18n);
      Alert.alert(t('common.error'), e?.message ?? 'Could not extract text from the selected image.');
    } finally {
      setBusy(false);
      setCurrentAction('');
    }
  };

  const pickPdf = async () => {
    stopSpeaking();
    speakInCurrentLanguage(VOICE_MESSAGES.processing, i18n);
    try {
      setBusy(true);
      setCurrentAction(t('common.loading'));
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setCurrentAction('');
        speakInCurrentLanguage('पीडीएफ नहीं चुनी गई। कृपया दोबारा कोशिश करें।', i18n);
        return;
      }
      const asset = res.assets[0];
      const file = { 
        uri: asset.uri, 
        name: asset.name ?? 'document.pdf', 
        type: 'application/pdf' 
      };
      const text = await ocrWithOcrSpaceAsync(file);
      if (!text || text.trim().length === 0) {
        speakInCurrentLanguage(VOICE_MESSAGES.noContent, i18n);
        setBusy(false);
        setCurrentAction('');
        return;
      }
      setExtractedText(text);
      setBraille(toBrailleGrade1(text));
      setTypedText('');
      speakInCurrentLanguage(VOICE_MESSAGES.textFound, i18n);
      setTimeout(() => {
        speakInCurrentLanguage(VOICE_MESSAGES.brailleReady, i18n);
      }, 2000);
      Alert.alert(
        t('common.success'), 
        t('braille.extractedTextDesc')
      );
    } catch (e: any) {
      speakInCurrentLanguage(VOICE_MESSAGES.error, i18n);
      Alert.alert(t('common.error'), e?.message ?? 'Could not extract text from the selected PDF.');
    } finally {
      setBusy(false);
      setCurrentAction('');
    }
  };

  const saveFile = async () => {
    stopSpeaking();
    if (!braille) {
      speakInCurrentLanguage(VOICE_MESSAGES.noContent, i18n);
      Alert.alert(t('common.info'), t('braille.typeYourTextDesc'));
      return;
    }
    try {
      await saveBrailleFile(braille);
      speakInCurrentLanguage(VOICE_MESSAGES.fileSaved, i18n);
    } catch (error) {
      speakInCurrentLanguage(VOICE_MESSAGES.error, i18n);
      Alert.alert(t('common.error'), t('common.error'));
    }
  };

  const handleTyping = (text: string) => {
    setTypedText(text);
    setBraille(toBrailleGrade1(text));
    if (text && extractedText) {
      setExtractedText('');
    }
    if (text.length === 1 && !extractedText) {
      speakInCurrentLanguage('अच्छा! आप टाइप कर रहे हैं। यह तुरंत ब्रेल में बदल रहा है।', i18n);
    }
  };

  const handleTextInputFocus = () => {
    speakInCurrentLanguage(VOICE_MESSAGES.typeText, i18n);
  };

  const clearAll = () => {
    stopSpeaking();
    Alert.alert(
      t('braille.clearAll'),
      t('common.info'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('braille.clearAll'),
          style: 'destructive',
          onPress: () => {
            setExtractedText('');
            setBraille('');
            setTypedText('');
            speakInCurrentLanguage('सब कुछ साफ कर दिया गया। अब आप नया टेक्स्ट जोड़ सकते हैं।', i18n);
          }
        }
      ]
    );
  };

  const speakInstructions = () => {
    stopSpeaking();
    speakInCurrentLanguage(VOICE_MESSAGES.instructions, i18n);
  };

  const speakExtractedText = () => {
    stopSpeaking();
    if (extractedText) {
      setIsReading(true);
      speakInCurrentLanguage(VOICE_MESSAGES.readingText, i18n);
      setTimeout(() => {
        Speech.speak(extractedText, {
          language: 'en-US',
          pitch: 1.0,
          rate: 0.7,
          volume: 1.0,
          onDone: () => setIsReading(false),
          onStopped: () => setIsReading(false),
          onError: () => setIsReading(false),
        });
      }, 2000);
    }
  };

  const stopReading = () => {
    Speech.stop();
    setIsReading(false);
  };

  return (
    <View style={styles.container}>
      <SimpleHamburgerMenu/>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <Text style={styles.appTitle}>Dhvani</Text>
        <Text style={styles.appSubtitle}>{t('braille.title')}</Text>
        <Text style={styles.appDescription}>{t('braille.description')}</Text>
        <TouchableOpacity 
          style={styles.voiceButton}
          onPress={speakInstructions}
          accessible={true}
          accessibilityLabel={t('braille.listenInstructions')}
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
          <Text style={styles.sectionTitle}>{t('braille.chooseInput')}</Text>
          <Text style={styles.sectionDescription}>
            {t('braille.chooseInputDesc')}
          </Text>
          <View style={styles.buttonContainer}>
            <AccessibleButton
              label={t('braille.selectImage')}
              onPress={pickImage}
              disabled={busy}
              icon="📷"
              voiceMessage={VOICE_MESSAGES.selectImage}
              accessibilityHint={t('braille.selectImage')}
              i18n={i18n}
            />
            <AccessibleButton
              label={t('braille.selectPdf')}
              onPress={pickPdf}
              disabled={busy}
              variant="secondary"
              icon="📄"
              voiceMessage={VOICE_MESSAGES.selectPdf}
              accessibilityHint={t('braille.selectPdf')}
              i18n={i18n}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('braille.typeYourText')}</Text>
          <Text style={styles.sectionDescription}>
            {t('braille.typeYourTextDesc')}
          </Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              multiline
              placeholder="Type or paste your text here to convert to Braille..."
              placeholderTextColor="#94a3b8"
              value={typedText}
              onChangeText={handleTyping}
              onFocus={handleTextInputFocus}
              accessible={true}
              accessibilityLabel="Text input field"
              accessibilityHint={t('braille.typeYourTextDesc')}
              textAlignVertical="top"
            />
          </View>
        </View>

        {busy && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.processingText}>{currentAction}</Text>
            <Text style={styles.processingSubtext}>{t('common.loading')}</Text>
          </View>
        )}

        {!!extractedText && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('braille.extractedText')}</Text>
              <View style={styles.speechButtonContainer}>
                {!isReading ? (
                  <TouchableOpacity 
                    style={styles.speakButton}
                    onPress={speakExtractedText}
                    accessible={true}
                    accessibilityLabel="Read extracted text aloud"
                    accessibilityHint="Tap to hear the extracted text read aloud"
                  >
                    <Text style={styles.speakButtonText}>🔊 Read</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={styles.stopButton}
                    onPress={stopReading}
                    accessible={true}
                    accessibilityLabel="Stop reading text"
                    accessibilityHint="Tap to stop reading the text aloud"
                  >
                    <Text style={styles.stopButtonText}>⏹️ Stop</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            <Text style={styles.sectionDescription}>
              {t('braille.extractedTextDesc')}
            </Text>
            <View style={styles.textDisplayContainer}>
              <ScrollView 
                style={styles.textScrollView}
                contentContainerStyle={styles.scrollContent}
                accessible={true}
                accessibilityLabel={`Extracted text content: ${extractedText}`}
                accessibilityHint="Scroll to read the full extracted text"
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                scrollEventThrottle={16}
                bounces={true}
                overScrollMode="always"
                nestedScrollEnabled={true}
              >
                <Text style={styles.extractedText} selectable={true}>
                  {extractedText}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}

        {!!braille && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('braille.brailleOutput')}</Text>
            <Text style={styles.sectionDescription}>
              {t('braille.brailleOutputDesc')}
            </Text>
            <View style={styles.brailleContainer}>
              <ScrollView 
                style={styles.brailleScrollView}
                contentContainerStyle={styles.scrollContent}
                accessible={true}
                accessibilityLabel="Braille text output"
                accessibilityHint="Scroll to read the full braille text"
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                scrollEventThrottle={16}
                bounces={true}
                overScrollMode="always"
                nestedScrollEnabled={true}
              >
                <Text style={styles.brailleText} selectable={true}>
                  {braille}
                </Text>
              </ScrollView>
            </View>
          </View>
        )}

        {(braille || extractedText || typedText) && (
          <View style={styles.section}>
            <View style={styles.buttonContainer}>
              <AccessibleButton
                label={t('braille.saveFile')}
                onPress={saveFile}
                variant="success"
                icon="💾"
                voiceMessage={VOICE_MESSAGES.saveFile}
                accessibilityHint={t('braille.saveFile')}
                i18n={i18n}
              />
              <AccessibleButton
                label={t('braille.clearAll')}
                onPress={clearAll}
                variant="secondary"
                icon="🗑️"
                voiceMessage={VOICE_MESSAGES.clearAll}
                accessibilityHint={t('braille.clearAll')}
                i18n={i18n}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('braille.howToUse')}</Text>
          <TouchableOpacity 
            style={styles.instructionsButton}
            onPress={speakInstructions}
            accessible={true}
            accessibilityLabel={t('braille.listenInstructions')}
          >
            <Text style={styles.instructionsButtonText}>{t('braille.listenInstructions')}</Text>
          </TouchableOpacity>
        
          <View style={styles.instructionContainer}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('braille.chooseInput')}</Text>
                <Text style={styles.stepDescription}>
                  {t('braille.chooseInputDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('braille.brailleOutput')}</Text>
                <Text style={styles.stepDescription}>
                  {t('braille.brailleOutputDesc')}
                </Text>
              </View>
            </View>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{t('braille.saveFile')}</Text>
                <Text style={styles.stepDescription}>
                  {t('braille.saveFile')}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 12,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    lineHeight: 24,
  },
  speechButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakButton: {
    backgroundColor: '#10b981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  speakButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  stopButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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
  extractedText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },
  brailleContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    height: 250,
    overflow: 'hidden',
  },
  brailleScrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  brailleText: {
    fontSize: 32,
    color: '#1e40af',
    lineHeight: 48,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
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