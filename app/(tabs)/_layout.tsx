import { Tabs } from "expo-router";
import { Image, View } from "react-native";
import { icons } from "@/constants/icons";

interface TabIconProps {
  focused: boolean;
  icon: any;
  title: string;
}

function TabIcon({ focused, icon, title }: TabIconProps) {
  return (
    <View className="items-center">
      <Image 
        source={icon} 
        className="size-6 mb-1"
        tintColor={focused ? "#3B82F6" : "#6B7280"}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        },
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 64,
          paddingBottom: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 4,
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: "/",
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />

      <Tabs.Screen
        name="speech"
        options={{
          href: "/speech",
          title: "Text to Speech",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.play} title="Speech" />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          href: "/history",
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.save} title="History" />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          href: "/profile",
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.person} title="Profile" />
          ),
        }}
      />
    </Tabs>
  );
}
