import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants/icons";

const Speech = () => {
  const [inputText, setInputText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState("female");

  const handleTextToSpeech = () => {
    if (!inputText.trim()) {
      Alert.alert("Please enter some text", "You need to add text before converting to speech.");
      return;
    }
    
    setIsPlaying(!isPlaying);
    // Here you would implement actual text-to-speech functionality
    console.log("Converting text to speech:", inputText);
  };

  const handleFileUpload = () => {
    Alert.alert("File Upload", "Choose your file type", [
      { text: "PDF Document", onPress: () => console.log("PDF selected") },
      { text: "Text Document", onPress: () => console.log("Text doc selected") },
      { text: "Image with Text", onPress: () => console.log("Image selected") },
      { text: "Cancel", style: "cancel" }
    ]);
  };

  const speedOptions = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
  const voiceOptions = [
    { id: "female", name: "Female Voice", description: "Clear and warm" },
    { id: "male", name: "Male Voice", description: "Deep and confident" },
    { id: "neutral", name: "Neutral Voice", description: "Balanced tone" },
  ];

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0F172A', '#1E293B', '#334155']}
        className="absolute inset-0"
      />
      
      <ScrollView
        className="flex-1 px-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Header */}
        <View className="mt-16 mb-8">
          <Text 
            className="text-white text-3xl font-bold text-center mb-2"
            accessibilityRole="header"
          >
            Text to Speech
          </Text>
          <Text className="text-slate-300 text-center text-base">
            Convert your text, documents, or files into natural speech
          </Text>
        </View>

        {/* File Upload Section */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">Upload File</Text>
          <TouchableOpacity
            onPress={handleFileUpload}
            className="bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-2xl p-8 items-center"
            accessibilityRole="button"
            accessibilityLabel="Upload file for text to speech conversion"
          >
            <View className="w-16 h-16 bg-blue-500/20 rounded-2xl items-center justify-center mb-4">
              <Image source={icons.save} className="w-8 h-8" tintColor="#3B82F6" />
            </View>
            <Text className="text-white text-lg font-semibold mb-2">Upload Document</Text>
            <Text className="text-slate-400 text-center">
              PDF, Word, Text files, or images with text
            </Text>
          </TouchableOpacity>
        </View>

        {/* Text Input Section */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">Or Type Your Text</Text>
          <View className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-4">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Enter the text you want to convert to speech..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={8}
              className="text-white text-base leading-6 min-h-[120px]"
              textAlignVertical="top"
              accessibilityLabel="Text input for speech conversion"
            />
          </View>
          <Text className="text-slate-400 text-sm mt-2">
            {inputText.length} characters
          </Text>
        </View>

        {/* Voice Settings */}
        <View className="mb-6">
          <Text className="text-white text-xl font-bold mb-4">Voice Settings</Text>
          
          {/* Voice Selection */}
          <View className="mb-4">
            <Text className="text-slate-300 text-base font-semibold mb-3">Select Voice</Text>
            {voiceOptions.map((voice) => (
              <TouchableOpacity
                key={voice.id}
                onPress={() => setSelectedVoice(voice.id)}
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  selectedVoice === voice.id 
                    ? 'bg-blue-500/20 border border-blue-500/50' 
                    : 'bg-slate-800/30 border border-slate-700/50'
                }`}
                accessibilityRole="radio"
                accessibilityState={{ selected: selectedVoice === voice.id }}
              >
                <View className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  selectedVoice === voice.id ? 'bg-blue-500 border-blue-500' : 'border-slate-500'
                }`} />
                <View className="flex-1">
                  <Text className="text-white font-semibold">{voice.name}</Text>
                  <Text className="text-slate-400 text-sm">{voice.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Speed Control */}
          <View>
            <Text className="text-slate-300 text-base font-semibold mb-3">
              Speech Speed: {speechSpeed}x
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {speedOptions.map((speed) => (
                <TouchableOpacity
                  key={speed}
                  onPress={() => setSpeechSpeed(speed)}
                  className={`px-4 py-2 rounded-xl ${
                    speechSpeed === speed
                      ? 'bg-blue-500'
                      : 'bg-slate-700/50'
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel={`Set speech speed to ${speed}x`}
                >
                  <Text className={`font-semibold ${
                    speechSpeed === speed ? 'text-white' : 'text-slate-300'
                  }`}>
                    {speed}x
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Control Buttons */}
        <View className="flex-row gap-4 mb-8">
          <TouchableOpacity
            onPress={handleTextToSpeech}
            className="flex-1 bg-blue-500 rounded-2xl p-4 flex-row items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? "Stop speech" : "Start text to speech"}
          >
            <Image 
              source={icons.play} 
              className="w-6 h-6 mr-2" 
              tintColor="#FFFFFF" 
            />
            <Text className="text-white text-lg font-bold">
              {isPlaying ? 'Stop' : 'Play'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-700 rounded-2xl p-4 flex-row items-center justify-center min-w-[80px]"
            accessibilityRole="button"
            accessibilityLabel="Save audio to history"
          >
            <Image 
              source={icons.save} 
              className="w-6 h-6" 
              tintColor="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <Text className="text-white text-xl font-bold mb-4">Quick Tips</Text>
          <View className="space-y-3">
            <Text className="text-slate-300">• Use punctuation for natural pauses</Text>
            <Text className="text-slate-300">• Try different voices to find your preference</Text>
            <Text className="text-slate-300">• Adjust speed for comfortable listening</Text>
            <Text className="text-slate-300">• Save frequently used texts to history</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Speech;
