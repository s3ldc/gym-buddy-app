import { supabase } from "../lib/supabase";

export type MatchEventType =
  | "on_the_way"
  | "running_late"
  | "at_gym"
  | "cant_make_it";

/**
 * Add a new event to a match timeline
 */
export async function sendMatchEvent(
  pingId: string,
  eventType: MatchEventType
) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("match_events").insert({
    ping_id: pingId,
    from_user_id: session.user.id,
    event_type: eventType,
  });

  if (error) {
    throw error;
  }
}

/**
 * Fetch all events for a match (ordered)
 */
export async function getMatchEvents(pingId: string) {
  const { data, error } = await supabase
    .from("match_events")
    .select("*")
    .eq("ping_id", pingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}
