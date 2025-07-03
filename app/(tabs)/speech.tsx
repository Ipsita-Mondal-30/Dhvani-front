import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAppStore } from "@/store/useAppStore";
import { PDFService } from "@/services/pdfService";

const Speech = () => {
  const [inputText, setInputText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  const {
    currentPDF,
    isLoading,
    error,
    addPDFFile,
    updatePDFText,
    setLoading,
    setError,
  } = useAppStore();

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
    
    try {
      setIsUploading(true);
      setError(null);
      
      const pickedFile = await PDFService.pickPDF();
      
      if (!pickedFile) {
        console.log('👤 [Speech] User cancelled file selection');
        return;
      }

      console.log('✅ [Speech] File picked:', pickedFile.name);
      setLoading(true);
      
      const isValid = await PDFService.validatePDFFile(pickedFile.uri);
      if (!isValid) {
        throw new Error('Invalid PDF file');
      }
      
      const extractedText = await PDFService.extractTextFromPDF(pickedFile.uri);
      console.log('📝 [Speech] Text extracted, length:', extractedText.length);
      
      const pdfFile = {
        id: PDFService.generateId(),
        name: pickedFile.name,
        uri: pickedFile.uri,
        size: pickedFile.size,
        extractedText,
        createdAt: new Date(),
      };

      addPDFFile(pdfFile);
      console.log('💾 [Speech] PDF saved to store');
      
      Alert.alert("Success", `"${pickedFile.name}" uploaded successfully!`);

    } catch (error) {
      console.error('💥 [Speech] Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      Alert.alert("Error", "Failed to upload PDF. Please try again.");
    } finally {
      setIsUploading(false);
      setLoading(false);
    }
  };

  const handleSaveText = () => {
    if (!inputText.trim()) {
      Alert.alert("No text to save", "Please add some text before saving.");
      return;
    }

    if (currentPDF) {
      updatePDFText(currentPDF.id, inputText);
      Alert.alert("Saved", "Your changes have been saved.");
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
            PDF to Text
          </Text>
          <Text className="text-base text-center text-slate-300">
            Upload PDF files and extract text for processing
          </Text>
        </View>

        {/* Current PDF Info */}
        {currentPDF && (
          <View className="p-4 mb-6 rounded-xl border bg-blue-500/20 border-blue-500/30">
            <Text className="mb-1 text-sm font-semibold text-blue-400">Current PDF</Text>
            <Text className="mb-1 text-lg font-bold text-white">{currentPDF.name}</Text>
            <Text className="text-sm text-slate-300">
              {PDFService.formatFileSize(currentPDF.size)} • {currentPDF.createdAt.toLocaleDateString()}
            </Text>
          </View>
        )}

        {/* Upload Section */}
        <TouchableOpacity
          onPress={handleFileUpload}
          disabled={isUploading || isLoading}
          className={`bg-slate-800/50 border-2 border-dashed border-slate-600 rounded-xl p-8 items-center mb-6 ${
            isUploading || isLoading ? 'opacity-50' : ''
          }`}
        >
          {isUploading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <>
              <Text className="mb-2 text-2xl">📄</Text>
              <Text className="mb-1 text-lg font-semibold text-white">
                {isUploading ? 'Uploading...' : 'Upload PDF'}
              </Text>
              <Text className="text-center text-slate-400">
                Tap to select a PDF file
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Text Input Section */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-white">Extracted Text</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleClearText}
                className="px-3 py-1 rounded-lg bg-red-500/20"
              >
                <Text className="text-sm font-semibold text-red-400">Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveText}
                className="px-3 py-1 rounded-lg bg-green-500/20"
              >
                <Text className="text-sm font-semibold text-green-400">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="p-4 rounded-xl border bg-slate-800/50 border-slate-700/50">
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Upload a PDF file to extract text, or type your own text here..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={12}
              className="text-white text-base leading-6 min-h-[200px]"
              textAlignVertical="top"
            />
          </View>
          <Text className="mt-2 text-sm text-slate-400">
            {inputText.length} characters
          </Text>
        </View>

        {/* Error Display */}
        {error && (
          <View className="p-4 mb-6 rounded-xl border bg-red-500/20 border-red-500/30">
            <Text className="font-semibold text-red-400">Error</Text>
            <Text className="text-sm text-red-300">{error}</Text>
          </View>
        )}

        {/* Info */}
        <View className="p-4 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-2 text-lg font-bold text-white">How it works:</Text>
          <Text className="mb-2 text-slate-300">1. Upload a PDF file</Text>
          <Text className="mb-2 text-slate-300">2. Text is automatically extracted</Text>
          <Text className="mb-2 text-slate-300">3. Edit the text if needed</Text>
          <Text className="text-slate-300">4. Save to your device storage</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Speech;
