import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useGameStore } from "../src/store/gameStore";
import { supabase } from "../src/lib/supabase";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ColorSchemeName } from "react-native";

// This component handles authentication state and protected routes
function InitialLayout({
  colorScheme,
}: {
  colorScheme: ColorSchemeName | null;
}) {
  const { session, actions } = useGameStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      actions.setSession(session);

      // Check if we're on an auth screen
      const inAuthGroup = segments[0] === "(auth)";

      if (session && inAuthGroup) {
        // Redirect to home page if user is signed in and on an auth screen
        router.replace("/(tabs)");
      } else if (!session && !inAuthGroup) {
        // Redirect to sign-in page if user is not signed in and not on an auth screen
        router.replace("/sign-in");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session, segments]);

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <InitialLayout colorScheme={colorScheme} />
    </ThemeProvider>
  );
}
