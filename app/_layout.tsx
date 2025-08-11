import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import "./globals.css";

import { useSimpleAppStore } from "@/store/simpleStore";

export default function RootLayout() {
  const { setError, hasHydrated } = useSimpleAppStore();

  // Clear any startup errors only after store is hydrated
  useEffect(() => {
    if (hasHydrated && setError) {
      setError(null);
    }
  }, [hasHydrated, setError]);

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
