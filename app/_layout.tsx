import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import "./globals.css";

import { useAppStore } from "@/store/useAppStore";

export default function RootLayout() {
  const { setError } = useAppStore();

  // Clear any startup errors
  useEffect(() => {
    setError(null);
  }, []);

  return (
    <>
      <StatusBar hidden={true} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </>
  );
}
