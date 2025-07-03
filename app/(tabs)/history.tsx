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

const History = () => {
  const { pdfFiles, setCurrentPDF, removePDFFile } = useAppStore();

  const handleSelectPDF = (pdf: any) => {
    setCurrentPDF(pdf);
    Alert.alert("PDF Selected", `"${pdf.name}" is now active for editing.`);
  };

  const handleDeletePDF = (pdf: any) => {
    Alert.alert(
      "Delete PDF",
      `Are you sure you want to delete "${pdf.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => removePDFFile(pdf.id),
        },
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
            PDF History
          </Text>
          <Text className="text-base text-center text-slate-300">
            Your uploaded PDF files and extracted text
          </Text>
        </View>

        {/* Stats */}
        <View className="p-4 mb-6 rounded-xl border bg-slate-800/30 border-slate-700/50">
          <Text className="text-lg font-bold text-white mb-2">Storage Info</Text>
          <Text className="text-slate-300">
            Total PDFs: {pdfFiles.length}
          </Text>
          <Text className="text-slate-300">
            Total Size: {PDFService.formatFileSize(
              pdfFiles.reduce((sum, file) => sum + file.size, 0)
            )}
          </Text>
        </View>

        {/* PDF Files List */}
        {pdfFiles.length === 0 ? (
          <View className="p-8 rounded-xl border bg-slate-800/30 border-slate-700/50 items-center">
            <Text className="text-2xl mb-4">📄</Text>
            <Text className="text-lg font-semibold text-white mb-2">No PDFs Yet</Text>
            <Text className="text-center text-slate-400">
              Upload a PDF file in the Speech tab to get started
            </Text>
          </View>
        ) : (
          pdfFiles.map((pdf) => (
            <View
              key={pdf.id}
              className="p-4 mb-4 rounded-xl border bg-slate-800/30 border-slate-700/50"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1 mr-4">
                  <Text className="text-lg font-bold text-white mb-1">
                    {pdf.name}
                  </Text>
                  <Text className="text-sm text-slate-400">
                    {PDFService.formatFileSize(pdf.size)} • {pdf.createdAt.toLocaleDateString()}
                  </Text>
                  <Text className="text-sm text-slate-400">
                    {pdf.extractedText.length} characters extracted
                  </Text>
                </View>
              </View>
              
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  onPress={() => handleSelectPDF(pdf)}
                  className="flex-1 bg-blue-500 rounded-lg py-2 px-4"
                >
                  <Text className="text-center font-semibold text-white">
                    Select
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handleDeletePDF(pdf)}
                  className="bg-red-500/20 rounded-lg py-2 px-4"
                >
                  <Text className="text-center font-semibold text-red-400">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default History;
