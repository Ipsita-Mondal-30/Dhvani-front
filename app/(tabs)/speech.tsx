import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from "react-native";
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from "expo-linear-gradient";

import { BackendService } from "@/services/backendService";
import { TTSService } from "@/services/ttsService";
import { useSpeech } from "@/hooks/useSpeech";
import SimpleHamburgerMenu from "@/src/components/SimpleHamburgerMenu";

const Speech = () => {
  const {
    // State
    inputText,
    showText,
    isTTSLoading,
    isPlaying,
    isPaused,
    currentPosition,
    duration,
    hasAudio,
    currentPDF,
    isUploading,
    isLoading,

    // Actions
    setInputText,
    setShowText,
    handleFileUpload,
    handleSaveText,
    handleClearText,
    handleGenerateSpeech,
    handlePlayAudio,
    handlePauseAudio,
    handleStopAudio,
    handleSeekAudio,
    getPreviewText,
  } = useSpeech();

  const { previewText, isLongText } = getPreviewText();

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Simple Hamburger Menu */}
      <SimpleHamburgerMenu />
      
      {/* Header */}
      <View className="px-6 pt-14 pb-4 bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-black text-black">Dhvani</Text>
          <View className="justify-center items-center w-10 h-10 bg-blue-50 rounded-xl">
            <Ionicons name="volume-high" size={24} color="#2563eb" />
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* PDF Upload Card */}
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          className="mb-5"
        >
          <TouchableOpacity
            onPress={handleFileUpload}
            disabled={isUploading || isLoading}
            className="p-6 bg-white rounded-xl border border-gray-100 shadow-md"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
            }}
            activeOpacity={0.8}
          >
            <View className="flex-row justify-center items-center">
              <View className="justify-center items-center mr-4 w-12 h-12 bg-blue-50 rounded-xl">
                <Ionicons 
                  name={isUploading ? "hourglass-outline" : "cloud-upload-outline"} 
                  size={24} 
                  color="#2563eb" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-black">
                  {isUploading ? 'Uploading PDF...' : 'Upload PDF Document'}
                </Text>
                <Text className="mt-1 text-sm text-gray-600">
                  {isUploading ? 'Please wait while we process your file' : 'Tap to select a PDF file from your device'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {currentPDF && (
            <View className="p-4 mt-3 bg-white rounded-xl border border-gray-100 shadow-sm">
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-bold text-black">{currentPDF.name}</Text>
                  <Text className="text-sm text-gray-500">{BackendService.formatFileSize(currentPDF.size)}</Text>
                </View>
                <View className="px-3 py-1 bg-green-100 rounded-full">
                  <Text className="text-xs font-bold text-green-700">✓ Loaded</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Text Status Indicator */}
        {currentPDF && typeof inputText === 'string' && (
          <View className="mb-4">
            {(inputText && typeof inputText === 'string' && (inputText.includes('Failed to extract text') || inputText.includes('No text could be extracted'))) ? (
              <View className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <View className="flex-row items-center">
                  <View className="justify-center items-center mr-3 w-6 h-6 bg-orange-100 rounded-full">
                    <Ionicons name="warning-outline" size={14} color="#ea580c" />
                  </View>
                  <Text className="text-sm font-medium text-orange-700">Text extraction needs attention - edit manually below</Text>
                </View>
              </View>
            ) : (
              <View className="p-3 bg-green-50 rounded-xl border border-green-200">
                <View className="flex-row items-center">
                  <View className="justify-center items-center mr-3 w-6 h-6 bg-green-100 rounded-full">
                    <Ionicons name="checkmark-outline" size={14} color="#16a34a" />
                  </View>
                  <Text className="text-sm font-medium text-green-700">Text extracted successfully</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Extracted Text Card */}
        {currentPDF && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="p-5 mb-5 bg-white rounded-xl border border-gray-100 shadow-md"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold text-black">Extracted Text</Text>
              <TouchableOpacity 
                onPress={() => setShowText(!showText)}
                className="justify-center items-center w-8 h-8 bg-gray-100 rounded-full"
              >
                <Ionicons name={showText ? 'chevron-up' : 'chevron-down'} size={16} color="#374151" />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row items-center mb-3">
              <View className={`px-3 py-1 rounded-full ${(inputText?.length || 0) > 4500 ? 'bg-orange-100' : 'bg-gray-100'}`}>
                <Text className={`text-xs font-bold ${(inputText?.length || 0) > 4500 ? 'text-orange-600' : 'text-gray-700'}`}>
                  {inputText?.length || 0} characters
                </Text>
              </View>
              {(inputText?.length || 0) > 4500 && (
                <View className="px-2 py-1 ml-2 bg-orange-50 rounded-full">
                  <Text className="text-xs font-bold text-orange-600">Will be truncated</Text>
                </View>
              )}
            </View>
            
            {!showText ? (
              <TouchableOpacity onPress={() => setShowText(true)} activeOpacity={0.7}>
                <Text className="text-base leading-6 text-gray-700" numberOfLines={3}>
                  {previewText}
                  {isLongText && <Text className="font-bold text-blue-500"> ...tap to expand</Text>}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View className="p-4 mb-4 bg-gray-50 rounded-xl">
                  <TextInput
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Edit extracted text..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={8}
                    className="text-black text-base leading-6 min-h-[120px]"
                    textAlignVertical="top"
                  />
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    onPress={handleClearText}
                    className="flex-1 py-3 bg-red-50 rounded-xl border border-red-100"
                  >
                    <Text className="text-sm font-bold text-center text-red-600">Clear Text</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveText}
                    className="flex-1 py-3 bg-green-50 rounded-xl border border-green-100"
                  >
                    <Text className="text-sm font-bold text-center text-green-600">Save Changes</Text>
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
          className="p-5 bg-white rounded-xl border border-gray-100 shadow-md"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text className="mb-5 text-lg font-bold text-black">Text to Speech</Text>
          
          {!hasAudio ? (
            <TouchableOpacity
              onPress={handleGenerateSpeech}
              disabled={isTTSLoading || !inputText?.trim()}
              className={`rounded-xl overflow-hidden ${isTTSLoading || !inputText?.trim() ? 'opacity-50' : ''}`}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isTTSLoading || !inputText?.trim() ? ['#F3F4F6', '#F3F4F6'] : ['#3B82F6', '#2563EB']}
                className="flex-row justify-center items-center p-4"
              >
                <View className="justify-center items-center mr-3 w-10 h-10 rounded-full bg-white/20">
                  <Ionicons 
                    name={isTTSLoading ? "hourglass-outline" : "play"} 
                    size={20} 
                    color={isTTSLoading || !inputText?.trim() ? '#9CA3AF' : '#FFFFFF'} 
                  />
                </View>
                <Text className={`text-lg font-bold ${isTTSLoading || !inputText?.trim() ? 'text-gray-400' : 'text-white'}`}>
                  {isTTSLoading ? 'Generating Speech...' : 'Generate Speech'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              {/* Audio Progress */}
              <View className="p-4 mb-5 bg-gray-50 rounded-xl">
                <Slider
                  style={{ width: '100%', height: 32 }}
                  minimumValue={0}
                  maximumValue={1}
                  value={duration > 0 ? currentPosition / duration : 0}
                  onSlidingComplete={handleSeekAudio}
                  minimumTrackTintColor="#2563EB"
                  maximumTrackTintColor="#E5E7EB"
                  thumbTintColor="#2563EB"
                />
                <View className="flex-row justify-between mt-2">
                  <Text className="text-sm font-medium text-gray-600">
                    {TTSService.formatTime(currentPosition)}
                  </Text>
                  <Text className="text-sm font-medium text-gray-600">
                    {TTSService.formatTime(duration)}
                  </Text>
                </View>
              </View>

              {/* Audio Controls */}
              <View className="flex-row gap-4 justify-center items-center mb-4">
                <TouchableOpacity
                  onPress={handleStopAudio}
                  disabled={!isPlaying && !isPaused}
                  className={`w-12 h-12 rounded-xl items-center justify-center ${
                    !isPlaying && !isPaused ? 'bg-gray-100' : 'bg-red-50'
                  }`}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="stop" 
                    size={20} 
                    color={!isPlaying && !isPaused ? '#9CA3AF' : '#EF4444'} 
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={isPlaying ? handlePauseAudio : handlePlayAudio}
                  className="justify-center items-center w-16 h-16 bg-blue-500 rounded-2xl shadow-lg"
                  style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={24} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleGenerateSpeech}
                  disabled={isTTSLoading}
                  className={`w-12 h-12 rounded-xl items-center justify-center ${
                    isTTSLoading ? 'bg-gray-100' : 'bg-green-50'
                  }`}
                  activeOpacity={0.8}
                >
                  <Ionicons 
                    name="refresh" 
                    size={20} 
                    color={isTTSLoading ? '#9CA3AF' : '#22C55E'} 
                  />
                </TouchableOpacity>
              </View>

              {/* Status Text */}
              <View className="p-3 bg-gray-50 rounded-xl">
                <Text className="text-sm font-medium text-center text-gray-700">
                  {isTTSLoading ? 'Generating new speech...' :
                    isPlaying ? 'Playing audio' :
                    isPaused ? 'Audio paused' :
                    'Audio ready to play'}
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

export default Speech;