import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from 'expo-document-picker';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { useAppStore } from "@/store/useAppStore";
import { BackendService } from "@/services/backendService";
import { TTSService } from "@/services/ttsService";

const Speech = () => {
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
    
    // Use production URL by default (already set in BackendService)
    // Users can switch to local development URLs if needed
    setCurrentBackendUrl(BackendService.getBaseUrl());
  }, []);

  // Initialize TTS and load documents on component mount
  useEffect(() => {
    const initializeServices = async () => {
      try {
        console.log('🔄 [Speech] Component mounted, initializing services...');
        
        // Initialize TTS service
        await TTSService.initialize();
        console.log('✅ [Speech] TTS Service initialized');
        
        // Load documents from backend
        await loadDocumentsFromBackend();
        console.log('✅ [Speech] Documents loaded');
      } catch (error) {
        console.error('💥 [Speech] Failed to initialize services:', error);
      }
    };

    initializeServices();
    
    // Start position update timer
    positionUpdateInterval.current = setInterval(updatePlaybackStatus, 1000);
    
    // Cleanup on unmount
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
      
      // Pick PDF file
      console.log('📂 [Speech] Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('👤 [Speech] User cancelled file selection');
        return;
      }

      const file = result.assets[0];
      console.log('✅ [Speech] File picked successfully:');
      console.log('  - Name:', file.name);
      console.log('  - URI:', file.uri);
      console.log('  - Size:', file.size);
      console.log('  - Type:', file.mimeType);

      // Show upload progress
      Alert.alert("Uploading", `Uploading "${file.name}" to server for text extraction...`, [{ text: "OK" }]);
      
      // Upload to backend
      console.log('📤 [Speech] Starting backend upload...');
      const pdfFile = await uploadPDFToBackend(file.uri, file.name, file.size || 0);
      
      console.log('🎉 [Speech] Upload completed successfully!');
      
      // Show success message
      Alert.alert(
        "Text Extracted!", 
        `Successfully extracted ${pdfFile.extractedText.length} characters from "${pdfFile.name}".`,
        [{ text: "Great!" }]
      );

    } catch (error) {
      console.error('💥 [Speech] Upload error occurred:');
      console.error('  - Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('  - Error message:', errorMessage);
      
      Alert.alert(
        "Upload Failed", 
        errorMessage,
        [
          { text: "OK" },
          { 
            text: "Show Debug Info", 
            onPress: () => setShowDebugInfo(true)
          }
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
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => setInputText("")
        }
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
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      Alert.alert("Connection Test Failed", `❌ ${errorMessage}`);
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

  // TTS Handlers
  const handleGenerateSpeech = async () => {
    if (!inputText.trim()) {
      Alert.alert("No Text", "Please add some text to convert to speech.");
      return;
    }

    try {
      setIsTTSLoading(true);
      console.log('🎤 [Speech] Starting TTS generation...');
      
      // Check if text will be truncated
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
      const errorMessage = error instanceof Error ? error.message : 'TTS generation failed';
      Alert.alert("TTS Error", errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : 'TTS generation failed';
      Alert.alert("TTS Error", errorMessage);
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

  // Collapsible text preview logic
  const previewLines = 3;
  const textLines = inputText.split('\n');
  const previewText = textLines.slice(0, previewLines).join('\n');
  const isLongText = textLines.length > previewLines;

  return (
    <View className="flex-1 bg-white">
      {/* Sticky Header */}
      <View className="w-full px-6 pt-14 pb-4 bg-white border-b border-gray-100 flex-row items-center justify-between z-10">
        <Text className="text-2xl font-extrabold text-black tracking-tight">Dhvani</Text>
        <Ionicons name="volume-high" size={28} color="#2563eb" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
      >
        {/* PDF Upload Card */}
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="mb-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <TouchableOpacity
            onPress={handleFileUpload}
            disabled={isUploading || isLoading}
            className="flex flex-row items-center justify-center"
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={32} color="#2563eb" />
            <Text className="ml-3 text-lg font-bold text-black">
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </Text>
          </TouchableOpacity>
          {currentPDF && (
            <View className="mt-4 flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-black">{currentPDF.name}</Text>
                <Text className="text-xs text-gray-500">{BackendService.formatFileSize(currentPDF.size)}</Text>
              </View>
              <View className="bg-blue-100 px-3 py-1 rounded-full">
                <Text className="text-xs text-blue-700 font-bold">PDF Loaded</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Extracted Text Card */}
        {currentPDF && typeof inputText === 'string' && (
          <View className="mb-3">
            {(inputText || '').includes('Failed to extract text') || (inputText || '').includes('No text could be extracted') ? (
              <View className="flex-row items-center p-2 rounded-lg border bg-orange-500/20 border-orange-500/30">
                <Text className="text-sm text-orange-400">⚠️ Text extraction failed - you can edit manually</Text>
              </View>
            ) : (
              <View className="flex-row items-center p-2 rounded-lg border bg-green-500/20 border-green-500/30">
                <Text className="text-sm text-green-400">✅ Text extracted successfully</Text>
              </View>
            )}
          </View>
        )}

        {/* Extracted Text Card */}
        {currentPDF && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="mb-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-bold text-black">Extracted Text</Text>
              <TouchableOpacity onPress={() => setShowText(!showText)}>
                <Ionicons name={showText ? 'chevron-up' : 'chevron-down'} size={24} color="#2563eb" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center mb-2">
              <View className={`px-2 py-0.5 rounded-full ${inputText.length > 4500 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-semibold ${inputText.length > 4500 ? 'text-orange-600' : 'text-gray-700'}`}>{inputText.length} chars</Text>
              </View>
              {inputText.length > 4500 && (
                <Text className="ml-2 text-xs text-orange-600 font-bold">Truncated for TTS</Text>
              )}
            </View>
            {!showText ? (
              <TouchableOpacity onPress={() => setShowText(true)} activeOpacity={0.7}>
                <Text className="text-base text-gray-700" numberOfLines={previewLines}>
                  {previewText}
                  {isLongText && <Text className="text-blue-500 font-bold"> ...more</Text>}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View className="bg-gray-50 rounded-xl p-4 mb-2">
                  <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Edit extracted text..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={10}
                    className="text-black text-base leading-6 min-h-[120px]"
                    textAlignVertical="top"
                  />
                </View>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={handleClearText}
                    className="flex-1 py-2 rounded-lg bg-red-50 border border-red-100"
                  >
                    <Text className="text-sm font-semibold text-red-600 text-center">Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveText}
                    className="flex-1 py-2 rounded-lg bg-green-50 border border-green-100"
                  >
                    <Text className="text-sm font-semibold text-green-600 text-center">Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        )}

        {/* TTS Controls Card */}
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="mb-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
        >
          <Text className="text-lg font-bold text-black mb-4">Text to Speech</Text>
          {!hasAudio ? (
            <TouchableOpacity
              onPress={handleGenerateSpeech}
              disabled={isTTSLoading || !inputText.trim()}
              className={`flex-row items-center justify-center p-4 rounded-xl ${isTTSLoading || !inputText.trim() ? 'bg-gray-100' : 'bg-blue-600'}`}
              activeOpacity={0.85}
            >
              <Ionicons name="play" size={24} color={isTTSLoading || !inputText.trim() ? '#94A3B8' : '#fff'} />
              <Text className={`ml-2 text-lg font-bold ${isTTSLoading || !inputText.trim() ? 'text-gray-400' : 'text-white'}`}>
                {isTTSLoading ? 'Generating...' : 'Generate Speech'}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {/* Audio Player */}
              <View className="mb-4">
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={duration > 0 ? currentPosition / duration : 0}
                  onSlidingComplete={handleSeekAudio}
                  minimumTrackTintColor="#2563eb"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#2563eb"
                />
                <View className="flex-row justify-between">
                  <Text className="text-xs text-gray-600">
                    {TTSService.formatTime(currentPosition)}
                  </Text>
                  <Text className="text-xs text-gray-600">
                    {TTSService.formatTime(duration)}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-4 justify-center items-center">
                <TouchableOpacity
                  onPress={handleStopAudio}
                  disabled={!isPlaying && !isPaused}
                  className={`p-3 rounded-full ${!isPlaying && !isPaused ? 'bg-gray-100' : 'bg-red-50'}`}
                  activeOpacity={0.8}
                >
                  <Ionicons name="stop" size={28} color={!isPlaying && !isPaused ? '#94A3B8' : '#ef4444'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={isPlaying ? handlePauseAudio : handlePlayAudio}
                  className="p-4 rounded-full bg-blue-600"
                  activeOpacity={0.8}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGenerateSpeech}
                  disabled={isTTSLoading}
                  className={`p-3 rounded-full ${isTTSLoading ? 'bg-gray-100' : 'bg-green-50'}`}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={28} color={isTTSLoading ? '#94A3B8' : '#22c55e'} />
                </TouchableOpacity>
              </View>
              <Text className="mt-4 text-sm text-center text-gray-600">
                {isTTSLoading ? 'Generating speech...' :
                  isPlaying ? 'Playing audio...' :
                  isPaused ? 'Paused' :
                  'Ready to play'}
              </Text>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default Speech;
