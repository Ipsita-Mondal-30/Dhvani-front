import { useState, useEffect, useRef } from 'react';
import { Alert, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useAppStore } from '@/store/useAppStore';
import { BackendService } from '@/services/backendService';
import { TTSService } from '@/services/ttsService';

export const useSpeech = () => {
  const [inputText, setInputText] = useState("");
  const [showText, setShowText] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [currentBackendUrl, setCurrentBackendUrl] = useState(BackendService.getBaseUrl());
  
  // TTS state
  const [isTTSLoading, setIsTTSLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasAudio, setHasAudio] = useState(false);
  
  // Timer for updating playback position
  const positionUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  
  const {
    currentPDF,
    isLoading,
    isUploading,
    error,
    updatePDFText,
    setCurrentPDF,
    setError,
    uploadPDFToBackend,
    loadDocumentsFromBackend,
  } = useAppStore();

  // Auto-detect platform and set appropriate URL
  useEffect(() => {
    console.log('🔍 [Speech] Platform detected:', Platform.OS);
    console.log('🌐 [Speech] Using production backend by default:', BackendService.getBaseUrl());
    setCurrentBackendUrl(BackendService.getBaseUrl());
  }, []);

  // Initialize TTS and load documents on component mount
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🔄 [Speech] Component mounted, initializing services...');
        await TTSService.initialize();
        console.log('✅ [Speech] TTS Service initialized');
        await loadDocumentsFromBackend();
        console.log('✅ [Speech] Documents loaded');
      } catch (error) {
        console.error('💥 [Speech] Failed to initialize services:', error);
      }
    };

    initializeServices();
    positionUpdateInterval.current = setInterval(updatePlaybackStatus, 1000);
    
    return () => {
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
      TTSService.cleanup();
    };
  }, []);

  // Update playback status from TTS service
  const updatePlaybackStatus = () => {
    const status = TTSService.getPlaybackStatus();
    setIsPlaying(status.isPlaying);
    setIsPaused(status.isPaused);
    setCurrentPosition(status.currentPosition);
    setDuration(status.duration);
    setHasAudio(status.hasAudio);
  };

  // Update input text when current PDF changes
  useEffect(() => {
    if (currentPDF) {
      console.log('📄 [Speech] Loading text from current PDF:', currentPDF.name);
      setInputText(currentPDF.extractedText);
    } else {
      setInputText("");
    }
  }, [currentPDF]);

  const handleFileUpload = async () => {
    console.log('🚀 [Speech] Starting PDF upload...');
    console.log('🔗 [Speech] Backend URL:', BackendService.getBaseUrl());
    
    try {
      setError(null);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('👤 [Speech] User cancelled file selection');
        return;
      }

      const file = result.assets[0];
      console.log('✅ [Speech] File picked successfully:', file);

      Alert.alert("Uploading", `Uploading "${file.name}" to server for text extraction...`, [{ text: "OK" }]);
      
      const pdfFile = await uploadPDFToBackend(file.uri, file.name, file.size || 0);
      console.log('🎉 [Speech] Upload completed successfully!');
      
      Alert.alert(
        "Text Extracted!", 
        `Successfully extracted ${pdfFile.extractedText.length} characters from "${pdfFile.name}".`,
        [{ text: "Great!" }]
      );

    } catch (error) {
      console.error('💥 [Speech] Upload error occurred:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      
      Alert.alert(
        "Upload Failed", 
        errorMessage,
        [
          { text: "OK" },
          { text: "Show Debug Info", onPress: () => setShowDebugInfo(true) }
        ]
      );
    }
  };

  const handleSaveText = () => {
    if (!inputText.trim()) {
      Alert.alert("No text to save", "Please add some text before saving.");
      return;
    }

    if (currentPDF) {
      updatePDFText(currentPDF.id, inputText);
      Alert.alert("Saved", "Your changes have been saved locally.");
    } else {
      Alert.alert("No PDF Selected", "Please upload a PDF first.");
    }
  };

  const handleClearText = () => {
    Alert.alert(
      "Clear Text",
      "Are you sure you want to clear all text?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => setInputText("") }
      ]
    );
  };

  const handleRefreshDocuments = async () => {
    try {
      console.log('🔄 [Speech] Refreshing documents from backend...');
      await loadDocumentsFromBackend();
      Alert.alert("Refreshed", "Documents loaded from server.");
    } catch (error) {
      console.error('💥 [Speech] Refresh error:', error);
      Alert.alert("Error", "Failed to refresh documents.");
    }
  };

  const handleTestConnection = async () => {
    try {
      console.log('🔍 [Speech] Testing backend connection...');
      Alert.alert("Testing Connection", "Checking server connectivity...");
      
      const healthData = await BackendService.checkHealth();
      Alert.alert(
        "Connection Test Passed", 
        `✅ ${healthData.message}\n\nServer Time: ${new Date(healthData.timestamp).toLocaleString()}`
      );
    } catch (error) {
      console.error('💥 [Speech] Connection test failed:', error);
      Alert.alert("Connection Test Failed", `❌ ${error instanceof Error ? error.message : 'Connection failed'}`);
    }
  };

  const handleSwitchBackendUrl = () => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const },
      { 
        text: 'Production (Vercel)', 
        onPress: () => {
          BackendService.setUrlForPlatform('production');
          setCurrentBackendUrl(BackendService.getBaseUrl());
          Alert.alert('URL Changed', 'Now using Production URL (Vercel)');
        }
      },
      { 
        text: 'iOS Simulator (localhost)', 
        onPress: () => {
          BackendService.setUrlForPlatform('ios');
          setCurrentBackendUrl(BackendService.getBaseUrl());
          Alert.alert('URL Changed', 'Now using iOS Simulator URL');
        }
      },
      { 
        text: 'Android Emulator (10.0.2.2)', 
        onPress: () => {
          BackendService.setUrlForPlatform('android');
          setCurrentBackendUrl(BackendService.getBaseUrl());
          Alert.alert('URL Changed', 'Now using Android Emulator URL');
        }
      },
    ];

    Alert.alert(
      'Switch Backend URL',
      `Current: ${currentBackendUrl}\n\nChoose the URL for your platform:`,
      options
    );
  };

  const handleGenerateSpeech = async () => {
    if (!inputText.trim()) {
      Alert.alert("No Text", "Please add some text to convert to speech.");
      return;
    }

    try {
      setIsTTSLoading(true);
      console.log('🎤 [Speech] Starting TTS generation...');
      
      const maxLength = 4500;
      const willTruncate = inputText.length > maxLength;
      
      if (willTruncate) {
        Alert.alert(
          "Long Text Detected", 
          `Your text is ${inputText.length} characters long. Only the first ${maxLength} characters will be converted to speech.`,
          [
            { text: "Cancel", style: "cancel", onPress: () => setIsTTSLoading(false) },
            { text: "Continue", onPress: () => proceedWithTTS() }
          ]
        );
      } else {
        Alert.alert("Generating Speech", "Converting text to speech...", [{ text: "OK" }]);
        proceedWithTTS();
      }
    } catch (error) {
      console.error('💥 [Speech] TTS generation failed:', error);
      Alert.alert("TTS Error", error instanceof Error ? error.message : 'TTS generation failed');
      setIsTTSLoading(false);
    }
  };

  const proceedWithTTS = async () => {
    try {
      const audioUri = await TTSService.synthesizeSpeech(inputText);
      console.log('✅ [Speech] TTS generation completed:', audioUri);
      
      setHasAudio(true);
      Alert.alert("Speech Ready!", "Your audio is ready to play.", [{ text: "Play", onPress: handlePlayAudio }]);
    } catch (error) {
      console.error('💥 [Speech] TTS generation failed:', error);
      Alert.alert("TTS Error", error instanceof Error ? error.message : 'TTS generation failed');
    } finally {
      setIsTTSLoading(false);
    }
  };

  const handlePlayAudio = async () => {
    try {
      if (isPaused) {
        await TTSService.resumeAudio();
      } else {
        await TTSService.playAudio();
      }
      updatePlaybackStatus();
    } catch (error) {
      console.error('💥 [Speech] Play audio failed:', error);
      Alert.alert("Playback Error", "Failed to play audio");
    }
  };

  const handlePauseAudio = async () => {
    try {
      await TTSService.pauseAudio();
      updatePlaybackStatus();
    } catch (error) {
      console.error('💥 [Speech] Pause audio failed:', error);
    }
  };

  const handleStopAudio = async () => {
    try {
      await TTSService.stopAudio();
      updatePlaybackStatus();
    } catch (error) {
      console.error('💥 [Speech] Stop audio failed:', error);
    }
  };

  const handleSeekAudio = async (value: number) => {
    try {
      const position = value * duration;
      await TTSService.seekTo(position);
      setCurrentPosition(position);
    } catch (error) {
      console.error('💥 [Speech] Seek audio failed:', error);
    }
  };

  // Text preview helpers
  const getPreviewText = () => {
    const previewLines = 3;
    const textLines = inputText.split('\n');
    return {
      previewText: textLines.slice(0, previewLines).join('\n'),
      isLongText: textLines.length > previewLines
    };
  };

  return {
    // State
    inputText,
    showText,
    showDebugInfo,
    currentBackendUrl,
    isTTSLoading,
    isPlaying,
    isPaused,
    currentPosition,
    duration,
    hasAudio,
    currentPDF,
    isLoading,
    isUploading,
    error,

    // Actions
    setInputText,
    setShowText,
    handleFileUpload,
    handleSaveText,
    handleClearText,
    handleRefreshDocuments,
    handleTestConnection,
    handleSwitchBackendUrl,
    handleGenerateSpeech,
    handlePlayAudio,
    handlePauseAudio,
    handleStopAudio,
    handleSeekAudio,
    getPreviewText,
  };
}; 