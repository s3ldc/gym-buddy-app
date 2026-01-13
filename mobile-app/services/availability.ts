import { supabase } from "../lib/supabase";

export type AvailabilityRow = {
  user_id: string;
  status: boolean;
  available_at: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  expires_at: string;
  workout_type: string | null;
};

export async function upsertAvailability(payload: {
  status: boolean;
  available_at: string;
  latitude: number;
  longitude: number;
  radius_km: number;
  expires_at?: string;
  workout_type?: string;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error("No active session");
  }

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

/**
 * Read-only fetch.
 * ❗️This function MUST NOT write or mutate availability.
 */
export async function getMyAvailability(): Promise<AvailabilityRow | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  if (error || !data) return null;

  return data;
}
