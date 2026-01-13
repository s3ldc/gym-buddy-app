import { supabase } from "../lib/supabase";
import { getDistanceKm } from "../utils/distance";

export async function getNearbyAvailabilities(
  myLat: number,
  myLng: number,
  myRadiusKm: number = 3 // default for now
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
    .neq("user_id", myUserId);

  if (error || !data) return [];

  return data
    .map(item => {
      const distanceKm = getDistanceKm(
        myLat,
        myLng,
        item.latitude,
        item.longitude
      );

      return {
        ...item,
        distanceKm,
      };
    })
    .filter(item => {
      const effectiveRadius = Math.min(
        myRadiusKm,
        item.radius_km
      );

      return item.distanceKm <= effectiveRadius;
    });
}
