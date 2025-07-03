import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from "react-native";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";

import { icons } from "@/constants/icons";

const SettingItem = ({ title, description, value, onToggle, type = "switch" }: any) => (
  <View className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-slate-700/50">
    <View className="flex-row items-center justify-between">
      <View className="flex-1 mr-4">
        <Text className="text-white text-lg font-semibold mb-1">{title}</Text>
        <Text className="text-slate-400 text-sm leading-5">{description}</Text>
      </View>
      {type === "switch" && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: "#374151", true: "#3B82F6" }}
          thumbColor={value ? "#FFFFFF" : "#9CA3AF"}
        />
      )}
      {type === "button" && (
        <TouchableOpacity
          onPress={onToggle}
          className="bg-blue-500/20 px-4 py-2 rounded-xl"
        >
          <Text className="text-blue-400 font-semibold">Change</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const ProfileCard = ({ icon, title, value, onPress }: any) => (
  <TouchableOpacity
    onPress={onPress}
    className="bg-slate-800/50 rounded-2xl p-4 mb-4 border border-slate-700/50"
    accessibilityRole="button"
  >
    <View className="flex-row items-center">
      <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
        <Image source={icon} className="w-6 h-6" tintColor="#3B82F6" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-lg font-semibold">{title}</Text>
        <Text className="text-slate-400 text-sm">{value}</Text>
      </View>
      <Image source={icons.arrow} className="w-5 h-5" tintColor="#94A3B8" />
    </View>
  </TouchableOpacity>
);

const Profile = () => {
  const [settings, setSettings] = useState({
    autoSave: true,
    hapticFeedback: true,
    darkMode: true,
    highContrast: false,
    largeText: false,
    autoPlay: false,
    backgroundPlayback: true,
    voiceAnnouncements: true,
  });

  const handleSettingToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleVoiceSettings = () => {
    Alert.alert("Voice Settings", "Choose your preferred voice options");
  };

  const handleExportData = () => {
    Alert.alert("Export Data", "Export your audio files and settings");
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account", 
      "Are you sure? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => console.log("Account deleted") }
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
        <View className="mt-16 mb-8 items-center">
          <View className="w-24 h-24 bg-blue-500/20 rounded-3xl items-center justify-center mb-4">
            <Image source={icons.person} className="w-12 h-12" tintColor="#3B82F6" />
          </View>
          <Text 
            className="text-white text-2xl font-bold mb-2"
            accessibilityRole="header"
          >
            Profile & Settings
          </Text>
          <Text className="text-slate-300 text-center">
            Customize your text-to-speech experience
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-4">Quick Actions</Text>
          <ProfileCard
            icon={icons.play}
            title="Voice Preferences"
            value="Female Voice, 1.0x speed"
            onPress={handleVoiceSettings}
          />
          <ProfileCard
            icon={icons.save}
            title="Export Data"
            value="Download your audio files"
            onPress={handleExportData}
          />
        </View>

        {/* Accessibility Settings */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-4">Accessibility</Text>
          
          <SettingItem
            title="High Contrast Mode"
            description="Increase contrast for better visibility"
            value={settings.highContrast}
            onToggle={() => handleSettingToggle('highContrast')}
          />
          
          <SettingItem
            title="Large Text"
            description="Make text larger and easier to read"
            value={settings.largeText}
            onToggle={() => handleSettingToggle('largeText')}
          />
          
          <SettingItem
            title="Voice Announcements"
            description="Hear navigation and status updates"
            value={settings.voiceAnnouncements}
            onToggle={() => handleSettingToggle('voiceAnnouncements')}
          />
          
          <SettingItem
            title="Haptic Feedback"
            description="Feel vibrations for important actions"
            value={settings.hapticFeedback}
            onToggle={() => handleSettingToggle('hapticFeedback')}
          />
        </View>

        {/* Playback Settings */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-4">Playback</Text>
          
          <SettingItem
            title="Auto-Save Audio"
            description="Automatically save converted audio files"
            value={settings.autoSave}
            onToggle={() => handleSettingToggle('autoSave')}
          />
          
          <SettingItem
            title="Auto-Play"
            description="Start playback immediately after conversion"
            value={settings.autoPlay}
            onToggle={() => handleSettingToggle('autoPlay')}
          />
          
          <SettingItem
            title="Background Playback"
            description="Continue playback when app is minimized"
            value={settings.backgroundPlayback}
            onToggle={() => handleSettingToggle('backgroundPlayback')}
          />
        </View>

        {/* General Settings */}
        <View className="mb-8">
          <Text className="text-white text-xl font-bold mb-4">General</Text>
          
          <SettingItem
            title="Dark Mode"
            description="Use dark theme throughout the app"
            value={settings.darkMode}
            onToggle={() => handleSettingToggle('darkMode')}
          />
        </View>

        {/* Storage Info */}
        <View className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
          <Text className="text-white text-xl font-bold mb-4">Storage</Text>
          <View className="flex-row justify-between mb-3">
            <Text className="text-slate-300">Audio Files</Text>
            <Text className="text-white font-semibold">8.6 MB</Text>
          </View>
          <View className="flex-row justify-between mb-3">
            <Text className="text-slate-300">Cache</Text>
            <Text className="text-white font-semibold">2.1 MB</Text>
          </View>
          <View className="h-px bg-slate-700 my-3" />
          <View className="flex-row justify-between">
            <Text className="text-slate-300">Total Used</Text>
            <Text className="text-white font-bold">10.7 MB</Text>
          </View>
          
          <TouchableOpacity className="bg-blue-500/20 rounded-xl p-3 mt-4">
            <Text className="text-blue-400 text-center font-semibold">Clear Cache</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View className="bg-slate-800/30 rounded-2xl p-6 border border-slate-700/50 mb-8">
          <Text className="text-white text-xl font-bold mb-4">About</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between">
              <Text className="text-slate-300">Version</Text>
              <Text className="text-white">1.0.0</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-300">Last Updated</Text>
              <Text className="text-white">Today</Text>
            </View>
          </View>
          
          <View className="flex-row gap-3 mt-6">
            <TouchableOpacity className="flex-1 bg-blue-500/20 rounded-xl p-3">
              <Text className="text-blue-400 text-center font-semibold">Help & Support</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-blue-500/20 rounded-xl p-3">
              <Text className="text-blue-400 text-center font-semibold">Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="bg-red-500/10 rounded-2xl p-6 border border-red-500/30">
          <Text className="text-red-400 text-xl font-bold mb-4">Danger Zone</Text>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="bg-red-500/20 rounded-xl p-4"
          >
            <Text className="text-red-400 text-center font-semibold">Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Profile;
