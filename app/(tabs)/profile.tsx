import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppStore } from "@/store/useAppStore";
import { PDFService } from "@/services/pdfService";

const Profile = () => {
  const { pdfFiles, clearAll } = useAppStore();

  const handleClearAllData = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to delete all PDF files and data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            clearAll();
            Alert.alert("Cleared", "All data has been deleted.");
          },
        },
      ]
    );
  };

  const totalSize = pdfFiles.reduce((sum, file) => sum + file.size, 0);

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
          <Text className="mb-2 text-3xl font-bold text-center text-white">
            Profile
          </Text>
          <Text className="text-base text-center text-slate-300">
            App settings and data management
          </Text>
        </View>

        {/* App Info */}
        <View className="p-6 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="text-2xl font-bold text-white mb-2">📱 Dhvani</Text>
          <Text className="text-slate-300 mb-4">
            Voice for Everyone - Your PDF to Text companion
          </Text>
          <Text className="text-sm text-slate-400">Version 1.0.0</Text>
        </View>

        {/* Storage Statistics */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="text-lg font-bold text-white mb-4">📊 Storage</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-slate-300">Total PDF Files</Text>
              <Text className="text-white font-semibold">{pdfFiles.length}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-300">Storage Used</Text>
              <Text className="text-white font-semibold">
                {PDFService.formatFileSize(totalSize)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-300">Total Characters</Text>
              <Text className="text-white font-semibold">
                {pdfFiles.reduce((sum, file) => sum + file.extractedText.length, 0).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* About */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="text-lg font-bold text-white mb-4">ℹ️ About</Text>
          <Text className="text-slate-300 leading-6">
            Dhvani helps you extract text from PDF files and manage your documents. 
            Upload PDFs, extract text content, and edit it as needed. All data is 
            stored locally on your device for privacy.
          </Text>
        </View>

        {/* Features */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="text-lg font-bold text-white mb-4">✨ Features</Text>
          <View className="space-y-2">
            <Text className="text-slate-300">• PDF file upload and processing</Text>
            <Text className="text-slate-300">• Automatic text extraction</Text>
            <Text className="text-slate-300">• Text editing and saving</Text>
            <Text className="text-slate-300">• Local storage with AsyncStorage</Text>
            <Text className="text-slate-300">• Simple and accessible interface</Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="p-4 mb-6 rounded-xl border bg-red-500/20 border-red-500/30">
          <Text className="text-lg font-bold text-red-400 mb-4">⚠️ Danger Zone</Text>
          <Text className="text-red-300 mb-4">
            This action will permanently delete all your PDF files and extracted text.
          </Text>
          <TouchableOpacity
            onPress={handleClearAllData}
            className="bg-red-500 rounded-lg py-3 px-4"
          >
            <Text className="text-center font-bold text-white">
              Clear All Data
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="items-center py-6">
          <Text className="text-slate-500 text-sm">
            Made with ❤️ for accessibility
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
