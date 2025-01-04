import { useEffect } from "react";
import { Redirect, Stack } from "expo-router";
import { useGameStore } from "../src/store/gameStore";
import { supabase } from "../src/lib/supabase";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useColorScheme } from "../hooks/useColorScheme";

export default function RootLayout() {
  const { session, actions } = useGameStore();
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      actions.setSession(session);
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        {!session ? (
          <Stack.Screen name="(auth)" />
        ) : (
          <Stack.Screen name="(tabs)" />
        )}
      </Stack>
    </ThemeProvider>
  );
}
