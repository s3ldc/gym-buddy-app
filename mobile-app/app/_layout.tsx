import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  const [session, setSession] = useState<any>(undefined);
  const [hasSeenWelcome, setHasSeenWelcome] = useState<boolean | null>(null);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const seen = await AsyncStorage.getItem("hasSeenWelcome");
      setHasSeenWelcome(seen === "true");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, age_range")
          .eq("id", session.user.id)
          .single();

        const complete = !!profile?.full_name && !!profile?.age_range;
        setProfileComplete(complete);
      } else {
        setProfileComplete(null);
      }

      setLoading(false);
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, age_range")
          .eq("id", session.user.id)
          .single();

        const complete = !!profile?.full_name && !!profile?.age_range;
        setProfileComplete(complete);
      } else {
        setProfileComplete(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 🔒 Block rendering until all gates are ready
  if (loading || hasSeenWelcome === null || session === undefined) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        {/* 1. Welcome */}
        <Stack.Screen
          name="welcome"
          redirect={hasSeenWelcome}
        />

        {/* 2. Login */}
        <Stack.Screen
          name="login"
          redirect={!hasSeenWelcome || !!session}
        />

        {/* 3. Profile Setup */}
        <Stack.Screen
          name="profile_setup"
          redirect={!session || profileComplete === true}
        />

        {/* 4. Main App */}
        <Stack.Screen
          name="(tabs)"
          redirect={!session || profileComplete === false}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
