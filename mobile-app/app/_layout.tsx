import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenWelcome").then(value => {
      setHasSeenWelcome(value === "true");
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (hasSeenWelcome === null) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!hasSeenWelcome && <Stack.Screen name="welcome" />}
      {hasSeenWelcome && !session && <Stack.Screen name="login" />}
      {hasSeenWelcome && session && <Stack.Screen name="(tabs)" />}
    </Stack>
  );
}
