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

export async function getMyAcceptedPings() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  const userId = session.user.id;

  const { data, error } = await supabase
    .from("pings")
    .select("*")
    .eq("status", "accepted")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);

  if (error || !data) return [];

  return data;
}

export async function getMySentPendingPings() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return [];

  const { data, error } = await supabase
    .from("pings")
    .select("to_user_id")
    .eq("from_user_id", session.user.id)
    .eq("status", "pending");

  if (error || !data) return [];

  return data.map((row) => row.to_user_id);
}

export async function endMatch(pingId: string) {

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("No session");
  }

  const { data, error } = await supabase
    .from("pings")
    .update({ status: "ended" })
    .eq("id", pingId)
    .or(`from_user_id.eq.${session.user.id},to_user_id.eq.${session.user.id}`)
    .select();


  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("No match row updated");
  }

  return data[0];
}

export async function getMatchWithUser(otherUserId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const userId = session.user.id;

  const { data, error } = await supabase
    .from("pings")
    .select("*")
    .eq("status", "accepted")
    .or(
      `and(from_user_id.eq.${userId},to_user_id.eq.${otherUserId}),
       and(from_user_id.eq.${otherUserId},to_user_id.eq.${userId})`
    );

  if (error || !data || data.length === 0) return null;

  return data[0]; // <-- important
}

export async function getPingById(pingId: string) {
  const { data, error } = await supabase
    .from("pings")
    .select("*")
    .eq("id", pingId)
    .single();

  if (error || !data) return null;
  return data;
}
