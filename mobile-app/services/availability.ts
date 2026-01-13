import { supabase } from "../lib/supabase";


type AvailabilityPayload = {
  status: boolean;
  available_at: string;
  latitude: number;
  longitude: number;
  radius_km: number;
};

const EXPIRY_MINUTES = 30;

export async function upsertAvailability(payload: {
  status: boolean;
  available_at: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  expires_at: string;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("No active session");
  }

  // console.log("UPSERT CALLED");
  // console.log("UPSERT USER:", session.user.id);

  const { error } = await supabase
    .from("availability")
    .upsert(
      {
        user_id: session.user.id,
        ...payload,
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) throw error;
}


export async function getMyAvailability() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("status", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  return data ?? null;
}
