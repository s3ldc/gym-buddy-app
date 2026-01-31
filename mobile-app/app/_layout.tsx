import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const [session, setSession] = useState<any | null>(null);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const checkProfile = async (session: any) => {
    if (!session) {
      setProfileComplete(null);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, age_range")
      .eq("id", session.user.id)
      .single();

    if (error || !data) {
      setProfileComplete(false);
    } else {
      const completed = !!(data.full_name && data.age_range);
      setProfileComplete(completed);
    }
  };

  useEffect(() => {
    const init = async () => {
      const seen = await AsyncStorage.getItem("hasSeenWelcome");
      setHasSeenWelcome(seen === "true");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      await checkProfile(session);

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      await checkProfile(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔒 Hard gate
  if (
    loading ||
    hasSeenWelcome === null ||
    (session && profileComplete === null)
  ) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Welcome: only if first time */}
        <Stack.Screen name="welcome" redirect={hasSeenWelcome} />

        {/* Login: only if seen welcome AND not logged in */}
        <Stack.Screen name="login" redirect={!hasSeenWelcome || !!session} />

        {/* Profile setup: only if logged in but profile NOT completed */}
        <Stack.Screen
          name="profile_setup"
          redirect={!session || profileComplete === true}
        />

        {/* Main app: only if logged in AND profile completed */}
        <Stack.Screen
          name="(tabs)"
          redirect={!session || profileComplete === false}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
