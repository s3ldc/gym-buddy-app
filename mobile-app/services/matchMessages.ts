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

export async function markMessagesSeen(pingId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return;

  const myId = session.user.id;

  // console.log("MARKING SEEN AS USER:", myId);

  const { data, error } = await supabase
    .from("match_messages")
    .update({ seen_at: new Date().toISOString() })
    .eq("ping_id", pingId)
    .is("seen_at", null)
    .neq("from_user_id", myId);

  // console.log("SEEN UPDATE RESULT:", { data, error });
}
