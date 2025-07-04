import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BackendService } from "@/services/backendService";
import { TTSService } from "@/services/ttsService";
import { useSpeech } from "@/hooks/useSpeech";

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
    <View className="flex-1 bg-white">
      {/* Sticky Header */}
      <View className="z-10 flex-row justify-between items-center px-6 pt-14 pb-4 w-full bg-white border-b border-gray-100">
        <Text className="text-2xl font-extrabold tracking-tight text-black">Dhvani</Text>
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
          className="p-6 mb-6 bg-white rounded-2xl border border-gray-100 shadow-lg"
        >
          <TouchableOpacity
            onPress={handleFileUpload}
            disabled={isUploading || isLoading}
            className="flex flex-row justify-center items-center"
            activeOpacity={0.8}
          >
            <Ionicons name="cloud-upload-outline" size={32} color="#2563eb" />
            <Text className="ml-3 text-lg font-bold text-black">
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </Text>
          </TouchableOpacity>
          {currentPDF && (
            <View className="flex-row justify-between items-center mt-4">
              <View>
                <Text className="text-base font-semibold text-black">{currentPDF.name}</Text>
                <Text className="text-xs text-gray-500">{BackendService.formatFileSize(currentPDF.size)}</Text>
              </View>
              <View className="px-3 py-1 bg-blue-100 rounded-full">
                <Text className="text-xs font-bold text-blue-700">PDF Loaded</Text>
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
            className="p-6 mb-6 bg-white rounded-2xl border border-gray-100 shadow-lg"
          >
            <View className="flex-row justify-between items-center mb-2">
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
                <Text className="ml-2 text-xs font-bold text-orange-600">Truncated for TTS</Text>
              )}
            </View>
            {!showText ? (
              <TouchableOpacity onPress={() => setShowText(true)} activeOpacity={0.7}>
                <Text className="text-base text-gray-700" numberOfLines={3}>
                  {previewText}
                  {isLongText && <Text className="font-bold text-blue-500"> ...more</Text>}
                </Text>
              </TouchableOpacity>
            ) : (
              <>
                <View className="p-4 mb-2 bg-gray-50 rounded-xl">
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
                    className="flex-1 py-2 bg-red-50 rounded-lg border border-red-100"
                  >
                    <Text className="text-sm font-semibold text-center text-red-600">Clear</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveText}
                    className="flex-1 py-2 bg-green-50 rounded-lg border border-green-100"
                  >
                    <Text className="text-sm font-semibold text-center text-green-600">Save</Text>
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
          className="p-6 mb-6 bg-white rounded-2xl border border-gray-100 shadow-lg"
        >
          <Text className="mb-4 text-lg font-bold text-black">Text to Speech</Text>
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
                  className="p-4 bg-blue-600 rounded-full"
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
