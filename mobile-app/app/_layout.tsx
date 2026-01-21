import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const [session, setSession] = useState<any>(undefined); // undefined = not loaded yet
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const seen = await AsyncStorage.getItem("hasSeenWelcome");
      setHasSeenWelcome(seen === "true");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔒 CRITICAL: block rendering until BOTH are ready
  if (loading || hasSeenWelcome === null) {
    return null; // or splash loader
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Welcome: only if first time */}
        <Stack.Screen
          name="welcome"
          redirect={hasSeenWelcome}
        />

        {/* Login: only if seen welcome AND not logged in */}
        <Stack.Screen
          name="login"
          redirect={!hasSeenWelcome || !!session}
        />

        {/* App: only if logged in */}
        <Stack.Screen
          name="(tabs)"
          redirect={!session}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
