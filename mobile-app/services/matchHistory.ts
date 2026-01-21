import { supabase } from "../lib/supabase";

export async function getMyPastMatches() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const userId = session.user.id;

  const { data, error } = await supabase
    .from("pings")
    .select(
      `
      id,
      from_user_id,
      to_user_id,
      status,
      ended_at
    `,
    )
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq("status", "ended")
    .order("ended_at", { ascending: false });

  if (error) throw error;

  return data ?? [];
}
