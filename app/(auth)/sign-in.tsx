import { View, StyleSheet, TouchableOpacity } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ThemedText } from "@/components/ThemedText";
import { supabase } from "@/src/lib/supabase";
import { useGameStore } from "@/src/store/gameStore";
import { useRouter } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const { actions } = useGameStore();
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "yourscheme://auth-callback",
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          "yourscheme://auth-callback"
        );

        if (result.type === "success") {
          const { url } = result;
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.setSession({
            access_token: url.split("access_token=")[1].split("&")[0],
            refresh_token: url.split("refresh_token=")[1].split("&")[0],
          });

          if (sessionError) throw sessionError;
          if (session) {
            actions.setSession(session);
            router.replace("/(tabs)");
          }
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText type="title">Card Strategy Game</ThemedText>
      <TouchableOpacity style={styles.button} onPress={signInWithGoogle}>
        <ThemedText>Sign in with Google</ThemedText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#0a7ea4",
    borderRadius: 8,
  },
});
