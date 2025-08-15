import { Stack } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import "./globals.css";

import { useSimpleAppStore } from "@/store/simpleStore";
import { LanguageProvider } from "@/contexts/LanguageProvider";
import { ThemeProvider } from "@/src/contexts/ThemeContext";
import "@/src/locales/i18n"; // Initialize i18n

export default function RootLayout() {
  const { setError, hasHydrated } = useSimpleAppStore();

  // Clear any startup errors only after store is hydrated
  useEffect(() => {
    if (hasHydrated && setError) {
      setError(null);
    }
  }, [hasHydrated, setError]);

  return (
    <ThemeProvider>
      <LanguageProvider>
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
      </LanguageProvider>
    </ThemeProvider>
  );
}
