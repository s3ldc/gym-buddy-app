import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  // console.log("hasSeenWelcome:", hasSeenWelcome);


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
  );
}
