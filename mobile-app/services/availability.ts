import { supabase } from "../lib/supabase";

type AvailabilityPayload = {
  status: boolean;
  available_at: string;
  latitude: number;
  longitude: number;
  radius_km: number;
};

const EXPIRY_MINUTES = 30;

export async function upsertAvailability(payload: AvailabilityPayload) {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session?.user) {
    throw new Error("User not authenticated");
  }

  const expiresAt =
    payload.status
      ? new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString()
      : null;

  const { error } = await supabase
    .from("availability")
    .upsert(
      {
        user_id: sessionData.session.user.id,
        status: payload.status,
        available_at: payload.available_at,
        latitude: payload.latitude,
        longitude: payload.longitude,
        radius_km: payload.radius_km,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw error;
  }
}

export async function getMyAvailability() {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session?.user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("availability")
    .select("status, expires_at")
    .eq("user_id", sessionData.session.user.id)
    .eq("status", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return data ?? null;
}

