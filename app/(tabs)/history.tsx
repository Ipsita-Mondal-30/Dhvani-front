import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants/icons";

const HistoryItem = ({ item, onPlay, onDelete }: any) => (
  <View className="p-4 mb-4 rounded-2xl border bg-slate-800/50 border-slate-700/50">
    <View className="flex-row justify-between items-start mb-3">
      <View className="flex-1 mr-4">
        <Text className="mb-1 text-lg font-semibold text-white" numberOfLines={2}>
          {item.title}
        </Text>
        <Text className="text-sm text-slate-400">
          {item.date} • {item.duration} • {item.type}
        </Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => onPlay(item)}
          className="justify-center items-center w-10 h-10 rounded-xl bg-blue-500/20"
          accessibilityRole="button"
          accessibilityLabel={`Play ${item.title}`}
        >
          <Image source={icons.play} className="w-5 h-5" tintColor="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          className="justify-center items-center w-10 h-10 rounded-xl bg-red-500/20"
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
        >
          <Text className="text-lg font-bold text-red-400">×</Text>
        </TouchableOpacity>
      </View>
    </View>
    
    <Text className="text-sm leading-5 text-slate-300" numberOfLines={3}>
      {item.preview}
    </Text>
    
    <View className="flex-row items-center pt-3 mt-3 border-t border-slate-700/50">
      <View className="flex-row flex-1 items-center">
        <View className="mr-2 w-2 h-2 bg-green-500 rounded-full" />
        <Text className="text-xs text-slate-400">
          {item.voice} • {item.speed}x speed
        </Text>
      </View>
      <Text className="text-xs text-slate-500">{item.size}</Text>
    </View>
  </View>
);

const History = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  
  // Mock data - replace with actual data from storage
  const historyData = [
    {
      id: 1,
      title: "Chapter 1: Introduction to Machine Learning",
      type: "PDF",
      date: "Today",
      duration: "15:30",
      voice: "Female Voice",
      speed: 1.0,
      size: "2.3 MB",
      preview: "Machine learning is a subset of artificial intelligence that provides systems the ability to automatically learn and improve from experience without being explicitly programmed...",
    },
    {
      id: 2,
      title: "Meeting Notes - Project Discussion",
      type: "Text",
      date: "Yesterday",
      duration: "8:45",
      voice: "Male Voice",
      speed: 1.25,
      size: "1.1 MB",
      preview: "Key points discussed: Project timeline, resource allocation, and milestone reviews. The team agreed on the following action items...",
    },
    {
      id: 3,
      title: "Research Paper: Climate Change Impact",
      type: "Document",
      date: "2 days ago",
      duration: "22:15",
      voice: "Neutral Voice",
      speed: 0.75,
      size: "4.7 MB",
      preview: "This comprehensive study examines the long-term effects of climate change on coastal ecosystems and proposes mitigation strategies...",
    },
    {
      id: 4,
      title: "Recipe: Homemade Pasta",
      type: "Text",
      date: "1 week ago",
      duration: "3:20",
      voice: "Female Voice",
      speed: 1.0,
      size: "0.5 MB",
      preview: "Ingredients: 2 cups all-purpose flour, 3 large eggs, 1 tablespoon olive oil, 1 teaspoon salt. Instructions: Create a well with flour...",
    },
  ];

  const categories = [
    { id: "all", name: "All", count: historyData.length },
    { id: "pdf", name: "PDFs", count: historyData.filter(item => item.type === "PDF").length },
    { id: "text", name: "Text", count: historyData.filter(item => item.type === "Text").length },
    { id: "document", name: "Documents", count: historyData.filter(item => item.type === "Document").length },
  ];

  const filteredData = selectedCategory === "all" 
    ? historyData 
    : historyData.filter(item => item.type.toLowerCase() === selectedCategory);

  const handlePlay = (item: any) => {
    console.log("Playing:", item.title);
    // Implement play functionality
  };

  const handleDelete = (id: number) => {
    console.log("Deleting item:", id);
    // Implement delete functionality
  };

  const handleClearAll = () => {
    console.log("Clearing all history");
    // Implement clear all functionality
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
          <View className="flex-row justify-between items-center mb-4">
            <Text 
              className="text-3xl font-bold text-white"
              accessibilityRole="header"
            >
              History
            </Text>
            <TouchableOpacity
              onPress={handleClearAll}
              className="px-4 py-2 rounded-xl bg-red-500/20"
              accessibilityRole="button"
              accessibilityLabel="Clear all history"
            >
              <Text className="font-semibold text-red-400">Clear All</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-base text-slate-300">
            Your previously converted audio files and saved content
          </Text>
        </View>

        {/* Category Filters */}
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-3">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-xl flex-row items-center ${
                    selectedCategory === category.id
                      ? 'bg-blue-500'
                      : 'bg-slate-700/50'
                  }`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: selectedCategory === category.id }}
                >
                  <Text className={`font-semibold mr-1 ${
                    selectedCategory === category.id ? 'text-white' : 'text-slate-300'
                  }`}>
                    {category.name}
                  </Text>
                  <View className={`px-2 py-0.5 rounded-full ${
                    selectedCategory === category.id ? 'bg-white/20' : 'bg-slate-600'
                  }`}>
                    <Text className={`text-xs font-bold ${
                      selectedCategory === category.id ? 'text-white' : 'text-slate-300'
                    }`}>
                      {category.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Stats Overview */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 p-4 rounded-xl border bg-slate-800/30 border-slate-700/50">
            <Text className="text-sm text-slate-400">Total Files</Text>
            <Text className="text-2xl font-bold text-white">{historyData.length}</Text>
          </View>
          <View className="flex-1 p-4 rounded-xl border bg-slate-800/30 border-slate-700/50">
            <Text className="text-sm text-slate-400">Storage Used</Text>
            <Text className="text-2xl font-bold text-white">8.6 MB</Text>
          </View>
        </View>

        {/* History List */}
        {filteredData.length > 0 ? (
          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-white">
              {selectedCategory === "all" ? "All Files" : `${categories.find(c => c.id === selectedCategory)?.name} Files`}
            </Text>
            {filteredData.map((item) => (
              <HistoryItem
                key={item.id}
                item={item}
                onPlay={handlePlay}
                onDelete={handleDelete}
              />
            ))}
          </View>
        ) : (
          <View className="flex-1 justify-center items-center py-16">
            <View className="justify-center items-center mb-6 w-20 h-20 rounded-3xl bg-slate-700/50">
              <Image source={icons.save} className="w-10 h-10" tintColor="#64748B" />
            </View>
            <Text className="mb-2 text-lg font-semibold text-slate-400">No Files Found</Text>
            <Text className="text-center text-slate-500">
              {selectedCategory === "all" 
                ? "You haven't converted any files yet" 
                : `No ${selectedCategory} files in your history`}
            </Text>
          </View>
        )}

        {/* Tips */}
        <View className="p-6 rounded-2xl border bg-slate-800/30 border-slate-700/50">
          <Text className="mb-4 text-xl font-bold text-white">Tips</Text>
          <View className="space-y-3">
            <Text className="text-slate-300">• Tap play to resume where you left off</Text>
            <Text className="text-slate-300">• Files are automatically saved after conversion</Text>
            <Text className="text-slate-300">• Swipe left on items for quick actions</Text>
            <Text className="text-slate-300">• Export audio files to share with others</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default History;
