import { Tabs } from "expo-router";
import { ImageBackground, Image, Text, View } from "react-native";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

function TabIcon({ focused, icon, title }: any) {
  if (focused) {
    return (
      <View className="flex flex-row w-full flex-1 min-w-[112px] min-h-14 mt-4 justify-center items-center rounded-full bg-blue-500 overflow-hidden">
        <Image source={icon} tintColor="#FFFFFF" className="size-6" />
        <Text className="ml-2 text-lg font-bold text-white accessibility-label">
          {title}
        </Text>
      </View>
    );
  }

  return (
    <View className="justify-center items-center mt-4 rounded-full size-full">
      <Image source={icon} tintColor="#94A3B8" className="size-6" />
      <Text className="mt-1 text-sm font-medium text-slate-400">
        {title}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: "#1E293B",
          borderRadius: 25,
          marginHorizontal: 16,
          marginBottom: 32,
          height: 80,
          position: "absolute",
          overflow: "hidden",
          borderWidth: 2,
          borderColor: "#334155",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="speech"
        options={{
          title: "Text to Speech",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.play} title="Speech" />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} title="History" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
