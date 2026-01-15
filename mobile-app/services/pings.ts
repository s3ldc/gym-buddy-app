import { supabase } from "../lib/supabase";

/**
 * Send a ping to another user
 */
export async function sendPing(toUserId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const fromUserId = session.user.id;

  if (fromUserId === toUserId) {
    throw new Error("Cannot ping yourself");
  }

  const { error } = await supabase.from("pings").insert({
    from_user_id: fromUserId,
    to_user_id: toUserId,
    status: "pending",
  });

  if (error) {
    throw error;
  }
}

/**
 * Fetch pings sent TO the current user
 */
export async function getIncomingPings() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  const { data, error } = await supabase
    .from("pings")
    .select("*")
    .eq("to_user_id", session.user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data;
}

/**
 * Accept or reject a ping
 */
export async function respondToPing(
  pingId: string,
  action: "accept" | "reject"
) {
  const status = action === "accept" ? "accepted" : "rejected";

  const { error } = await supabase
    .from("pings")
    .update({ status })
    .eq("id", pingId);

  if (error) {
    throw error;
  }
}
