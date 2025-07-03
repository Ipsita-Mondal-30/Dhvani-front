import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants/icons";

const { width, height } = Dimensions.get('window');

const FeatureCard = ({ icon, title, description, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 mb-4 border border-slate-700/50"
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${description}`}
  >
    <View className="flex-row items-center mb-3">
      <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
        <Image source={icon} className="w-6 h-6" tintColor="#3B82F6" />
      </View>
      <Text className="text-white text-xl font-bold flex-1">{title}</Text>
    </View>
    <Text className="text-slate-300 text-base leading-6">{description}</Text>
  </TouchableOpacity>
);

const Index = () => {
  const router = useRouter();

  const features = [
    {
      icon: icons.play,
      title: "Text to Speech",
      description: "Convert any text, PDF, or document into natural-sounding speech. Perfect for reading books, articles, and documents hands-free.",
      onPress: () => router.push("/speech")
    },
    {
      icon: icons.save,
      title: "Audio History",
      description: "Access your previously converted audio files and saved documents. Never lose track of important content.",
      onPress: () => router.push("/history")
    },
    {
      icon: icons.person,
      title: "Personalized Experience",
      description: "Customize voice settings, playback speed, and accessibility preferences to match your needs.",
      onPress: () => router.push("/profile")
    }
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
        <View className="mt-16 mb-8 items-center">
          <View className="w-20 h-20 bg-blue-500/20 rounded-3xl items-center justify-center mb-6">
            <Image source={icons.logo} className="w-12 h-12" tintColor="#3B82F6" />
          </View>
          
          <Text 
            className="text-white text-3xl font-bold text-center mb-2"
            accessibilityRole="header"
          >
            Dhvani
          </Text>
          
          <Text className="text-blue-400 text-lg font-semibold text-center mb-4">
            Voice for Everyone
          </Text>
          
          <Text className="text-slate-300 text-base text-center leading-6 px-4">
            Transform any text into clear, natural speech. Dhvani helps make content accessible to everyone, everywhere.
          </Text>
        </View>

        {/* Quick Start Button */}
        <TouchableOpacity
          onPress={() => router.push("/speech")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 mb-8 shadow-lg"
          accessibilityRole="button"
          accessibilityLabel="Start Text to Speech conversion"
        >
          <View className="flex-row items-center justify-center">
            <Image source={icons.play} className="w-8 h-8 mr-3" tintColor="#FFFFFF" />
            <Text className="text-white text-xl font-bold">Start Converting</Text>
          </View>
          <Text className="text-blue-100 text-center mt-2">
            Begin your text-to-speech journey
          </Text>
        </TouchableOpacity>

        {/* Features Section */}
        <View className="mb-6">
          <Text 
            className="text-white text-2xl font-bold mb-6"
            accessibilityRole="header"
          >
            Features
                </Text>
          
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>

        {/* How it Works */}
        <View className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50">
          <Text className="text-white text-xl font-bold mb-4">How it Works</Text>
          
          <View className="space-y-4">
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-4 mt-1">
                <Text className="text-white font-bold">1</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">Upload or Type</Text>
                <Text className="text-slate-300">Add your text, upload a PDF, or paste content you want to hear.</Text>
              </View>
            </View>

            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-4 mt-1">
                <Text className="text-white font-bold">2</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">Customize</Text>
                <Text className="text-slate-300">Choose voice, speed, and other preferences for the perfect listening experience.</Text>
              </View>
            </View>
            
            <View className="flex-row items-start">
              <View className="w-8 h-8 bg-blue-500 rounded-full items-center justify-center mr-4 mt-1">
                <Text className="text-white font-bold">3</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold mb-1">Listen</Text>
                <Text className="text-slate-300">Enjoy clear, natural speech that brings your content to life.</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Index;
