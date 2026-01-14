import { supabase } from "../lib/supabase";
import { getDistanceKm } from "../utils/distance";

export async function getNearbyAvailabilities(
  myLat: number,
  myLng: number,
  myRadiusKm: number = 3
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  const myUserId = session.user.id;
  const now = new Date().toISOString();

  // ✅ STEP 1: CLEAN UP EXPIRED AVAILABILITY (CRITICAL)
  await supabase
    .from("availability")
    .update({ status: false })
    .eq("status", true)
    .lt("expires_at", now);

  // ✅ STEP 2: FETCH ACTIVE AVAILABILITY
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("status", true)
    .gt("expires_at", now)
    .neq("user_id", myUserId);

  if (error || !data) return [];

  // ✅ STEP 3: DISTANCE + MUTUAL RADIUS FILTER
  return data
    .map((item) => {
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
    .filter((item) => {
      const effectiveRadius = Math.min(
        myRadiusKm,
        item.radius_km
      );

      return item.distanceKm <= effectiveRadius;
    });
}
