import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants/icons";

const { width, height } = Dimensions.get('window');

const FeatureCard = ({ icon, title, description, onPress }: any) => (
  <TouchableOpacity 
    onPress={onPress}
    className="p-5 mb-4 bg-white rounded-xl border border-gray-100 shadow-md"
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 6,
    }}
    accessibilityRole="button"
    accessibilityLabel={`${title}: ${description}`}
  >
    <View className="flex-row items-center mb-3">
      <View className="justify-center items-center mr-4 w-12 h-12 bg-blue-50 rounded-xl">
        <Image source={icon} className="w-6 h-6" tintColor="#2563EB" />
      </View>
      <Text className="flex-1 text-lg font-bold text-gray-900">{title}</Text>
    </View>
    <Text className="text-sm font-medium leading-5 text-gray-600">{description}</Text>
    
    {/* Subtle arrow indicator */}
    <View className="flex-row justify-end mt-3">
      <View className="justify-center items-center w-6 h-6 bg-gray-100 rounded-full">
        <Text className="text-xs font-bold text-gray-400">→</Text>
      </View>
    </View>
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
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Subtle gradient background */}
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC', '#F1F5F9']}
        className="absolute inset-0"
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        {/* Header Section */}
        <View className="items-center px-6 pt-16 pb-8">
          {/* Logo with enhanced styling */}
          <View 
            className="justify-center items-center mb-6 w-20 h-20 bg-blue-500 rounded-2xl shadow-lg"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Image source={icons.logo} className="w-12 h-12" tintColor="#FFFFFF" />
          </View>
          
          {/* App name with modern typography */}
          <Text 
            className="mb-2 text-3xl font-black tracking-tight text-center text-black"
            accessibilityRole="header"
          >
            Dhvani
          </Text>
          
          <Text className="mb-4 text-base font-bold tracking-wide text-center text-blue-500">
            VOICE FOR EVERYONE
          </Text>
          
          <Text className="px-4 text-sm font-medium leading-5 text-center text-gray-600">
            Transform any text into clear, natural speech. Dhvani helps make content accessible to everyone, everywhere.
          </Text>
        </View>

        {/* Main CTA Button */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={() => router.push("/speech")}
            className="overflow-hidden bg-blue-500 rounded-xl shadow-lg"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 10,
            }}
            accessibilityRole="button"
            accessibilityLabel="Start Text to Speech conversion"
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-5"
            >
              <View className="flex-row justify-center items-center mb-1">
                <View className="justify-center items-center mr-3 w-8 h-8 rounded-full bg-white/20">
                  <Image source={icons.play} className="w-4 h-4" tintColor="#FFFFFF" />
                </View>
                <Text className="text-lg font-bold text-white">Start Converting</Text>
              </View>
              <Text className="text-sm font-medium text-center text-blue-100">
                Begin your text-to-speech journey
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View className="px-6 mb-8">
          <Text 
            className="mb-5 text-xl font-bold text-center text-black"
            accessibilityRole="header"
          >
            Features
          </Text>
          
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </View>

        {/* How it Works Section */}
        <View className="px-6">
          <View 
            className="p-6 bg-white rounded-xl border border-gray-100 shadow-md"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text className="mb-6 text-xl font-bold text-center text-black">
              How it Works
            </Text>
            
            <View className="space-y-5">
              <View className="flex-row items-start">
                <View 
                  className="justify-center items-center mt-1 mr-4 w-8 h-8 bg-blue-500 rounded-lg shadow-md"
                  style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className="text-sm font-bold text-white">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-base font-bold text-black">Upload or Type</Text>
                  <Text className="text-sm font-medium leading-5 text-gray-600">
                    Add your text, upload a PDF, or paste content you want to hear.
                  </Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View 
                  className="justify-center items-center mt-1 mr-4 w-8 h-8 bg-blue-500 rounded-lg shadow-md"
                  style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className="text-sm font-bold text-white">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-base font-bold text-black">Customize</Text>
                  <Text className="text-sm font-medium leading-5 text-gray-600">
                    Choose voice, speed, and other preferences for the perfect listening experience.
                  </Text>
                </View>
              </View>
              
              <View className="flex-row items-start">
                <View 
                  className="justify-center items-center mt-1 mr-4 w-8 h-8 bg-blue-500 rounded-lg shadow-md"
                  style={{
                    shadowColor: "#2563EB",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <Text className="text-sm font-bold text-white">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-base font-bold text-black">Listen</Text>
                  <Text className="text-sm font-medium leading-5 text-gray-600">
                    Enjoy clear, natural speech that brings your content to life.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Index;