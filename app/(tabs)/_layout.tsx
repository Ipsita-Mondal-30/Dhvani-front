import { Stack } from "expo-router";

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="speech" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="sos" />
      <Stack.Screen name="currency" />
      <Stack.Screen name="profile" />
    </Stack>
  );
}