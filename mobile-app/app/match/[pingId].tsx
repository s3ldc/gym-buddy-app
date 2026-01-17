import { View, Text, StyleSheet, Button } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { endMatch } from "../../services/pings";
import { useState } from "react";
import { getMatchEvents } from "../../services/matchEvents";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView } from "react-native";
// import { addMatchEvent } from "../../services/matchEvents";
import { sendMatchEvent } from "../../services/matchEvents";
import { supabase } from "../../lib/supabase";

export default function MatchDetailScreen() {
  function formatEvent(type: string) {
    switch (type) {
      case "on_the_way":
        return "On the way 🚶";
      case "running_late":
        return "Running late ⏱️";
      case "at_gym":
        return "At the gym 💪";
      case "cant_make_it":
        return "Can’t make it ❌";
      default:
        return type;
    }
  }

  const params = useLocalSearchParams<{ pingId: string | string[] }>();

  const pingId =
    typeof params.pingId === "string" ? params.pingId : params.pingId?.[0];

  const [ending, setEnding] = useState(false);
  const [sendingEvent, setSendingEvent] = useState<string | null>(null);

  const handleEndMatch = async () => {
    if (!pingId || ending) return;

    try {
      setEnding(true);
      await endMatch(pingId);
      router.replace({
        pathname: "/",
        params: { refresh: Date.now().toString() },
      });
    } catch (err) {
      console.error("FAILED TO END MATCH", err);
      setEnding(false);
    }
  };
  const [events, setEvents] = useState<any[]>([]);

  const loadEvents = async () => {
    try {
      const data = await getMatchEvents(pingId as string);
      setEvents(data);
    } catch (err) {
      console.error("FAILED TO LOAD MATCH EVENTS", err);
    }
  };
  const [sentEventTypes, setSentEventTypes] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      if (!pingId) return;

      loadEvents(); // initial load

      const channel = supabase
        .channel(`match-events-${pingId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "match_events",
            filter: `ping_id=eq.${pingId}`,
          },
          (payload) => {
            setEvents((prev) => {
              // prevent duplicates
              if (prev.some((e) => e.id === payload.new.id)) {
                return prev;
              }
              return [...prev, payload.new];
            });
            setSentEventTypes((prev) => {
              const next = new Set(prev);
              next.add(payload.new.event_type);
              return next;
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [pingId])
  );

  const handleOnTheWay = async () => {
    if (!pingId) return;
    if (hasSentOnTheWay) return;

    try {
      setSendingEvent("on_the_way");

      // ✅ optimistic update (THIS IS THE KEY)
      setSentEventTypes((prev) => new Set(prev).add("on_the_way"));

      await sendMatchEvent(pingId, "on_the_way");
    } catch (err) {
      console.error("FAILED TO ADD EVENT", err);

      // rollback if needed
      setSentEventTypes((prev) => {
        const next = new Set(prev);
        next.delete("on_the_way");
        return next;
      });
    } finally {
      setSendingEvent(null);
    }
  };

  const hasSentOnTheWay =
    sentEventTypes.has("on_the_way") ||
    events.some((e) => e.event_type === "on_the_way");

  //   console.log("HAS SENT ON_THE_WAY:", hasSentOnTheWay);

  //   console.log(
  //   "EVENT TYPES:",
  //   events.map((e) => e.event_type)
  // );
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Workout Match</Text>

      <Text style={styles.info}>You’re matched and ready to work out.</Text>

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>
          Match Timeline
        </Text>

        {events.length === 0 && (
          <Text style={{ color: "#777" }}>No updates yet.</Text>
        )}

        {events.map((event) => (
          <View
            key={event.id}
            style={{
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderColor: "#eee",
            }}
          >
            <Text style={{ fontWeight: "500" }}>
              {formatEvent(event.event_type)}
            </Text>
            <Text style={{ fontSize: 12, color: "#777" }}>
              {new Date(event.created_at).toLocaleTimeString()}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ marginTop: 16 }}>
        <Button
          title={
            hasSentOnTheWay
              ? "On the way ✓"
              : sendingEvent === "on_the_way"
              ? "Sending..."
              : "On the way"
          }
          onPress={handleOnTheWay}
          disabled={hasSentOnTheWay || sendingEvent !== null}
        />
      </View>

      <View style={{ marginTop: 24 }}>
        <Button
          title={ending ? "Ending Match..." : "End Match"}
          onPress={handleEndMatch}
          disabled={ending || sendingEvent !== null}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    // justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  info: {
    marginTop: 32,
    fontSize: 16,
    textAlign: "center",
  },
});
