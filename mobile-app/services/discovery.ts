import { supabase } from "../lib/supabase";
import { getDistanceKm } from "../utils/distance";

export async function getNearbyAvailabilities(
  myLat: number,
  myLng: number
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  const myUserId = session.user.id;

  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("status", true)
    .gt("expires_at", new Date().toISOString())
    .neq("user_id", myUserId); // ✅ exclude self at DB level

  if (error) throw error;

  if (!data) return [];

  return data.filter(item => {
    const distance = getDistanceKm(
      myLat,
      myLng,
      item.latitude,
      item.longitude
    );

    return distance <= item.radius_km;
  });
}
