# Multilingual Setup Guide

This guide explains how to test and use the multilingual features in the Dhvani app.

## ✅ What's Implemented

### Frontend Features
- **Language Detection**: Automatically detects device language
- **Language Persistence**: Saves language preference using AsyncStorage
- **Real-time Switching**: UI updates immediately when language changes
- **Speech Integration**: TTS uses appropriate language codes
- **Comprehensive Translations**: All UI elements are translated

### Backend Features
- **Translation API**: Automatic text translation using Google Cloud
- **Language-aware TTS**: Voice synthesis in appropriate language
- **Multiple Detection Methods**: Query params, headers, and body
- **Graceful Fallbacks**: Continues working if translation fails

## 🧪 Testing the Implementation

### 1. Frontend Language Switching

**Test the Tab Navigation:**
```javascript
// The tab labels should change when you switch languages
// Home -> होम (Hindi) -> হোম (Bengali)
```

**Test the Home Screen:**
```javascript
// Welcome message changes:
// "Welcome to Dhvani" -> "ध्वनि में आपका स्वागत है" -> "ধ্বনিতে স্বাগতম"
```

**Test Settings Screen:**
```javascript
// Navigate to Settings tab
// Language section should show current language
// All text should be in selected language
```

### 2. Language Persistence Test

1. Change language to Hindi
2. Close and restart the app
3. App should remember Hindi as the selected language

### 3. Speech Language Test

```javascript
// In the home screen, the welcome speech should use:
// English: en-US voice
// Hindi: hi-IN voice  
// Bengali: bn-IN voice
```

### 4. Backend API Testing

**Test Messages API:**
```bash
# English (default)
curl "http://localhost:3000/api/messages?type=welcome"

# Hindi
curl "http://localhost:3000/api/messages?type=welcome&lang=hi"

# Bengali with header
curl -H "x-language: bn" "http://localhost:3000/api/messages?type=welcome"
```

**Test TTS with Translation:**
```bash
# English text to Hindi speech
curl -X POST "http://localhost:3000/api/tts" \
  -H "Content-Type: application/json" \
  -H "x-language: hi" \
  -d '{"text": "Hello, how are you?"}' \
  --output test_hindi.mp3

# Check response headers for translation info
curl -I -X POST "http://localhost:3000/api/tts" \
  -H "Content-Type: application/json" \
  -H "x-language: hi" \
  -d '{"text": "Hello world"}'
```

## 🔧 Manual Testing Steps

### Step 1: Language Switching
1. Open the app
2. Go to Settings tab
3. Tap on Language section
4. Notice all text is in English
5. Change to Hindi - UI should update immediately
6. Change to Bengali - UI should update again

### Step 2: Persistence Test
1. Set language to Hindi
2. Force close the app
3. Reopen the app
4. App should start in Hindi

### Step 3: Speech Test
1. Go to Home screen
2. Tap "Replay Welcome" button
3. Should hear speech in current UI language

### Step 4: Translation Test (if backend is running)
1. Upload a PDF with English text
2. Set language to Hindi
3. Generate speech - should be in Hindi voice

## 🐛 Troubleshooting

### Common Issues

**1. Language not changing:**
- Check if i18n is properly initialized in _layout.tsx
- Verify translation files exist and are properly formatted
- Check AsyncStorage permissions

**2. Speech in wrong language:**
- Verify getSpeechLanguageCode() is being used
- Check if expo-speech supports the language code
- Ensure device has the language voice installed

**3. Backend translation not working:**
- Check Google Cloud API key is set
- Verify service account has Translation API permissions
- Check network connectivity to Google Cloud

**4. Profile icon showing as arrow:**
- This might be an emoji rendering issue
- Try clearing app cache
- Check if device supports the emoji

### Debug Steps

**1. Check Language State:**
```javascript
// Add this to any component to debug
const { i18n } = useTranslation();
console.log('Current language:', i18n.language);
```

**2. Check AsyncStorage:**
```javascript
// Check stored language
AsyncStorage.getItem('user-language').then(lang => {
  console.log('Stored language:', lang);
});
```

**3. Check Translation Loading:**
```javascript
// In i18n.ts, enable debug mode
debug: true, // This will log translation loading
```

## 📱 Expected Behavior

### Language Switching Flow
1. User opens app → Detects device language or loads saved preference
2. User changes language → UI updates immediately + saves to AsyncStorage
3. User restarts app → Loads saved language preference
4. User uses speech features → Uses appropriate language voice

### API Language Flow
1. Frontend sends request with language preference
2. Backend detects language from query/header/body
3. Backend translates text if needed
4. Backend returns response with translation metadata
5. Frontend uses translated content

## 🎯 Success Criteria

✅ **Frontend:**
- [ ] Tab labels change when switching languages
- [ ] Home screen text changes in real-time
- [ ] Language preference persists after app restart
- [ ] Speech uses correct language voice
- [ ] Settings screen shows current language

✅ **Backend:**
- [ ] Messages API returns translated text
- [ ] TTS API translates and synthesizes in target language
- [ ] Language detection works from query params and headers
- [ ] Translation metadata is included in responses
- [ ] Graceful fallback when translation fails

## 🚀 Next Steps

1. **Test with Real Users**: Get feedback from native Hindi and Bengali speakers
2. **Add More Languages**: Extend support to other Indian languages
3. **Improve Translations**: Use professional translation services for better quality
4. **Voice Customization**: Allow users to select different voices within each language
5. **Offline Support**: Cache translations for offline use

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure Google Cloud APIs are enabled and have proper permissions
4. Test with a simple curl command to isolate frontend vs backend issues