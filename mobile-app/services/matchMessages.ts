import { supabase } from "../lib/supabase";

export async function sendMatchMessage(pingId: string, message: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error("Not authenticated");

  const { error } = await supabase.from("match_messages").insert({
    ping_id: pingId,
    from_user_id: session.user.id,
    message,
  });

  if (error) throw error;
}

export async function getMatchMessages(pingId: string) {
  const { data, error } = await supabase
    .from("match_messages")
    .select("*")
    .eq("ping_id", pingId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data ?? [];
}
