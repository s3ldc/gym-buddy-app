import { supabase } from "../lib/supabase";

type AvailabilityPayload = {
  status: boolean;
  available_at: string;
  latitude: number;
  longitude: number;
  radius_km: number;
};

export async function upsertAvailability(
  payload: AvailabilityPayload
) {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session?.user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("availability")
    .upsert(
      {
        user_id: sessionData.session.user.id,
        ...payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    throw error;
  }
}
