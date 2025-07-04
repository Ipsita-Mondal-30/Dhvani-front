import { Tabs } from "expo-router";
import { View, Text } from "react-native";

interface TabIconProps {
  focused: boolean;
  icon: string;
  title: string;
}

function TabIcon({ focused, icon, title }: TabIconProps) {
  return (
    <View className="justify-center items-center py-2">
      <View
        className={`items-center justify-center w-8 h-8 rounded-lg ${
          focused ? "bg-blue-500" : "bg-transparent"
        }`}
        style={{
          shadowColor: focused ? "#3B82F6" : "transparent",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: focused ? 0.3 : 0,
          shadowRadius: 4,
          elevation: focused ? 4 : 0,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: focused ? "#FFFFFF" : "#6B7280",
          }}
        >
          {icon}
        </Text>
      </View>
      <Text
        className={`text-xs font-medium mt-1 ${
          focused ? "text-blue-500" : "text-gray-500"
        }`}
        numberOfLines={1}
        style={{ fontSize: 10 }}
      >
        {title}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#6B7280",
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          height: 90,
          paddingBottom: 12,
          paddingTop: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
          elevation: 15,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="🏠"
              title="Home"
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="speech"
        options={{
          title: "Speech",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="🎤"
              title="Speech"
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="📄"
              title="History"
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              icon="👤"
              title="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}