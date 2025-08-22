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

const { width } = Dimensions.get('window');

// ======================
// CONFIG — replace with your OCR.Space API key
// ======================
const OCR_SPACE_API_KEY = 'K86479850788957';
const OCR_ENDPOINT = 'https://api.ocr.space/parse/image';

// ======================
// Hindi Voice Messages for Guidance
// ======================
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
  instructions: 'उपयोग करने का तरीका: पहले फोटो, पीडीएफ चुनें या टेक्स्ट टाइप करें। फिर यह अपने आप ब्रेल में बदल जाएगा। अंत में आप इसे सेव कर सकते हैं।'
};

// ======================
// Voice Helper Functions
// ======================
const speakHindi = (message: string) => {
  Speech.speak(message, {
    language: 'hi-IN',
    pitch: 1.0,
    rate: 0.8,
    volume: 1.0,
  });
};

const stopSpeaking = () => {
  Speech.stop();
};

// ======================
// Very simple Grade-1 (uncontracted) English Braille mapper
// ======================
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

// ======================
// OCR helpers (OCR.Space)
// ======================
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
  });
  const res = await fetch(OCR_ENDPOINT, { method: 'POST', body: form as any });
  if (!res.ok) throw new Error(`OCR request failed (${res.status})`);
  const json = await res.json();
  if (!json?.ParsedResults?.[0]) throw new Error('No OCR results found.');
  return json.ParsedResults.map((r: any) => r.ParsedText ?? '').join('\n').trim();
}

// ======================
// File save helpers
// ======================
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

// ======================
// Voice-Guided Accessible Button Component
// ======================
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
  onFocus
}: AccessibleButtonProps) {
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
      speakHindi(voiceMessage);
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

// ======================
// Main Component
// ======================
export default function BrailleScreen() {
  const [extractedText, setExtractedText] = useState('');
  const [braille, setBraille] = useState('');
  const [typedText, setTypedText] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentAction, setCurrentAction] = useState('');

  // Voice guidance on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      speakHindi(VOICE_MESSAGES.welcome);
      setTimeout(() => {
        speakHindi(VOICE_MESSAGES.chooseInput);
      }, 3000);
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      stopSpeaking();
    };
  }, []);

  const pickImage = async () => {
    stopSpeaking();
    speakHindi(VOICE_MESSAGES.processing);
    
    try {
      setBusy(true);
      setCurrentAction('Processing image and extracting text...');
      
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setCurrentAction('');
        speakHindi('फोटो नहीं चुनी गई। कृपया दोबारा कोशिश करें।');
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
        speakHindi(VOICE_MESSAGES.noContent);
        setBusy(false);
        setCurrentAction('');
        return;
      }
      
      setExtractedText(text);
      setBraille(toBrailleGrade1(text));
      setTypedText('');
      
      speakHindi(VOICE_MESSAGES.textFound);
      setTimeout(() => {
        speakHindi(VOICE_MESSAGES.brailleReady);
      }, 2000);
      
      Alert.alert(
        'Text Extracted Successfully', 
        `Found ${text.length} characters. The text has been converted to Braille and is ready to view or save.`,
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (e: any) {
      speakHindi(VOICE_MESSAGES.error);
      Alert.alert('Error Processing Image', e?.message ?? 'Could not extract text from the selected image. Please try a different image with clearer text.');
    } finally {
      setBusy(false);
      setCurrentAction('');
    }
  };

  const pickPdf = async () => {
    stopSpeaking();
    speakHindi(VOICE_MESSAGES.processing);
    
    try {
      setBusy(true);
      setCurrentAction('Processing PDF document and extracting text...');
      
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      
      if (res.canceled || !res.assets?.length) {
        setBusy(false);
        setCurrentAction('');
        speakHindi('पीडीएफ नहीं चुनी गई। कृपया दोबारा कोशिश करें।');
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
        speakHindi(VOICE_MESSAGES.noContent);
        setBusy(false);
        setCurrentAction('');
        return;
      }
      
      setExtractedText(text);
      setBraille(toBrailleGrade1(text));
      setTypedText('');
      
      speakHindi(VOICE_MESSAGES.textFound);
      setTimeout(() => {
        speakHindi(VOICE_MESSAGES.brailleReady);
      }, 2000);
      
      Alert.alert(
        'PDF Processed Successfully', 
        `Extracted ${text.length} characters from the PDF. The text has been converted to Braille and is ready to view or save.`,
        [{ text: 'OK', style: 'default' }]
      );
      
    } catch (e: any) {
      speakHindi(VOICE_MESSAGES.error);
      Alert.alert('Error Processing PDF', e?.message ?? 'Could not extract text from the selected PDF. Please try a different PDF file.');
    } finally {
      setBusy(false);
      setCurrentAction('');
    }
  };

  const saveFile = async () => {
    stopSpeaking();
    
    if (!braille) {
      speakHindi(VOICE_MESSAGES.noContent);
      Alert.alert(
        'Nothing to Save', 
        'Please first select an image, PDF, or type some text to convert to Braille before saving.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }
    
    try {
      await saveBrailleFile(braille);
      speakHindi(VOICE_MESSAGES.fileSaved);
    } catch (error) {
      speakHindi(VOICE_MESSAGES.error);
      Alert.alert('Save Error', 'Could not save the Braille file. Please try again.');
    }
  };

  const handleTyping = (text: string) => {
    setTypedText(text);
    setBraille(toBrailleGrade1(text));
    
    // Clear OCR results when user starts typing
    if (text && extractedText) {
      setExtractedText('');
    }
    
    // Voice feedback when user starts typing
    if (text.length === 1 && !extractedText) {
      speakHindi('अच्छा! आप टाइप कर रहे हैं। यह तुरंत ब्रेल में बदल रहा है।');
    }
  };

  const handleTextInputFocus = () => {
    speakHindi(VOICE_MESSAGES.typeText);
  };

  const clearAll = () => {
    stopSpeaking();
    
    Alert.alert(
      'Clear All Content',
      'This will remove all extracted text, typed text, and Braille output. Are you sure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => speakHindi('रद्द कर दिया गया।')
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            setExtractedText('');
            setBraille('');
            setTypedText('');
            speakHindi('सब कुछ साफ कर दिया गया। अब आप नया टेक्स्ट जोड़ सकते हैं।');
          }
        }
      ]
    );
  };

  const speakInstructions = () => {
    stopSpeaking();
    speakHindi(VOICE_MESSAGES.instructions);
  };

  return (
    <View style={styles.container}>
      <SimpleHamburgerMenu/>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>Dhvani</Text>
        <Text style={styles.appSubtitle}>Text to Braille Converter</Text>
        <Text style={styles.appDescription}>Making text accessible through Braille conversion</Text>
        
        {/* Voice Control Button */}
        <TouchableOpacity 
          style={styles.voiceButton}
          onPress={speakInstructions}
          accessible={true}
          accessibilityLabel="उपयोग का तरीका सुनें"
          accessibilityHint="इस बटन को दबाने से आपको ऐप के उपयोग का तरीका सुनाई देगा"
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
        {/* Action Buttons Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Input Method</Text>
          <Text style={styles.sectionDescription}>
            Select how you want to add text for Braille conversion
          </Text>
          
          <View style={styles.buttonContainer}>
            <AccessibleButton
              label="Select Image"
              onPress={pickImage}
              disabled={busy}
              icon="📷"
              voiceMessage={VOICE_MESSAGES.selectImage}
              accessibilityHint="Opens camera roll to select an image with text to convert to Braille"
            />
            
            <AccessibleButton
              label="Select PDF"
              onPress={pickPdf}
              disabled={busy}
              variant="secondary"
              icon="📄"
              voiceMessage={VOICE_MESSAGES.selectPdf}
              accessibilityHint="Opens file picker to select a PDF document to extract text from"
            />
          </View>
        </View>

        {/* Manual Text Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Type Your Text</Text>
          <Text style={styles.sectionDescription}>
            Enter the text you want to be converted to Braille
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
              accessibilityHint="Type or paste text here. It will automatically be converted to Braille as you type"
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Processing Status */}
        {busy && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.processingText}>{currentAction}</Text>
            <Text style={styles.processingSubtext}>Please wait while we process your request</Text>
          </View>
        )}

        {/* Extracted Text Display */}
        {!!extractedText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Extracted Text</Text>
            <Text style={styles.sectionDescription}>
              This is the text that was found in your image or PDF
            </Text>
            
            <View style={styles.textDisplayContainer}>
              <ScrollView 
                style={styles.textScrollView}
                accessible={true}
                accessibilityLabel={`Extracted text content: ${extractedText}`}
                accessibilityHint="This is the text that was extracted from your image or PDF"
              >
                <Text style={styles.extractedText}>{extractedText}</Text>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Braille Output */}
        {!!braille && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Braille Output</Text>
            <Text style={styles.sectionDescription}>
              Grade-1 English Braille conversion of your text
            </Text>
            
            <View style={styles.brailleContainer}>
              <ScrollView 
                style={styles.brailleScrollView}
                accessible={true}
                accessibilityLabel="Braille text output"
                accessibilityHint="This is your text converted to Grade-1 English Braille. You can save this to share with others"
              >
                <Text style={styles.brailleText}>{braille}</Text>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Action Buttons for Save/Clear */}
        {(braille || extractedText || typedText) && (
          <View style={styles.section}>
            <View style={styles.buttonContainer}>
              <AccessibleButton
                label="Save Braille File"
                onPress={saveFile}
                variant="success"
                icon="💾"
                voiceMessage={VOICE_MESSAGES.saveFile}
                accessibilityHint="Saves the Braille text to a file that you can share with others"
              />
              
              <AccessibleButton
                label="Clear All"
                onPress={clearAll}
                variant="secondary"
                icon="🗑️"
                voiceMessage={VOICE_MESSAGES.clearAll}
                accessibilityHint="Clears all text and starts over"
              />
            </View>
          </View>
        )}

        {/* Instructions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Use Dhvani</Text>
          
          <TouchableOpacity 
            style={styles.instructionsButton}
            onPress={speakInstructions}
            accessible={true}
            accessibilityLabel="उपयोग के निर्देश सुनें"
            accessibilityHint="इस बटन को दबाने से आपको विस्तार से निर्देश सुनाई देंगे"
          >
            <Text style={styles.instructionsButtonText}>Listen to Instructions</Text>
          </TouchableOpacity>
          
          <View style={styles.instructionContainer}>
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Choose Your Input</Text>
                <Text style={styles.stepDescription}>
                  Select an image or PDF with text, or type directly into the text field
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Automatic Conversion</Text>
                <Text style={styles.stepDescription}>
                  Dhvani will automatically convert your text to Grade-1 English Braille
                </Text>
              </View>
            </View>
            
            <View style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Save and Share</Text>
                <Text style={styles.stepDescription}>
                  Save the Braille output as a text file to share with others or use with Braille devices
                </Text>
              </View>
            </View>
          </View>
        </View>
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
    backgroundColor: '#ffffff',
  },

  // Header styles
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

  // Content styles
  content: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  // Section styles
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

  // Button styles
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

  // Input styles
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

  // Processing styles
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

  // Text display styles
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
  },
  textScrollView: {
    maxHeight: 160,
    padding: 20,
  },
  extractedText: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 24,
  },

  // Braille output styles
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
  },
  brailleScrollView: {
    maxHeight: 200,
    padding: 20,
  },
  brailleText: {
    fontSize: 32,
    color: '#1e40af',
    lineHeight: 48,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
  },

  // Instructions styles
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