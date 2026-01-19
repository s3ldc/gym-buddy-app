import { View, Text, StyleSheet, Button } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { endMatch } from "../../services/pings";
import { useEffect, useState } from "react";
import { getMatchEvents } from "../../services/matchEvents";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView } from "react-native";
// import { addMatchEvent } from "../../services/matchEvents";
import { sendMatchEvent } from "../../services/matchEvents";
import { supabase } from "../../lib/supabase";
import type { MatchEventType } from "../../services/matchEvents";
import {
  getMatchMessages,
  sendMatchMessage,
} from "../../services/matchMessages";
import { TextInput } from "react-native";

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
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setMyUserId(data.session?.user.id ?? null);
    });
  }, []);

  const params = useLocalSearchParams<{ pingId: string | string[] }>();

  const pingId =
    typeof params.pingId === "string" ? params.pingId : params.pingId?.[0];

  const handleSendEvent = async (type: MatchEventType) => {
    if (!pingId) return;
    if (sendingEvent) return;

    try {
      setSendingEvent(type);

      // ✅ optimistic disable
      setSentEventTypes((prev) => {
        const next = new Set(prev);
        next.add(type);
        return next;
      });

      await sendMatchEvent(pingId, type);
    } catch (err) {
      console.error("FAILED TO ADD EVENT", err);

      // rollback
      setSentEventTypes((prev) => {
        const next = new Set(prev);
        next.delete(type);
        return next;
      });
    } finally {
      setSendingEvent(null);
    }
  };

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
  const loadMessages = async () => {
    if (!pingId) return;

    try {
      const data = await getMatchMessages(pingId);
      setMessages(data);
    } catch (err) {
      console.error("FAILED TO LOAD MESSAGES", err);
    }
  };

  const [sentEventTypes, setSentEventTypes] = useState<Set<string>>(new Set());

  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!pingId) return;

      loadEvents(); // initial load
      loadMessages();   // 🔥 THIS IS THE KEY FIX

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
          },
        )
        .subscribe();

      // 🔔 Chat realtime
      const chatChannel = supabase
        .channel(`match-chat-${pingId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "match_messages",
            filter: `ping_id=eq.${pingId}`,
          },
          (payload) => {
            setMessages((prev) => {
              if (prev.some((m) => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
        supabase.removeChannel(chatChannel);
      };
    }, [pingId])
  );

  // const handleOnTheWay = async () => {
  //   if (!pingId) return;
  //   if (hasSentOnTheWay) return;

  //   try {
  //     setSendingEvent("on_the_way");

  //     // ✅ optimistic update (THIS IS THE KEY)
  //     setSentEventTypes((prev) => new Set(prev).add("on_the_way"));

  //     await sendMatchEvent(pingId, "on_the_way");
  //   } catch (err) {
  //     console.error("FAILED TO ADD EVENT", err);

  //     // rollback if needed
  //     setSentEventTypes((prev) => {
  //       const next = new Set(prev);
  //       next.delete("on_the_way");
  //       return next;
  //     });
  //   } finally {
  //     setSendingEvent(null);
  //   }
  // };

  const hasSentOnTheWay =
    sentEventTypes.has("on_the_way") ||
    events.some((e) => e.event_type === "on_the_way");

  const hasSentAtGym =
    sentEventTypes.has("at_gym") ||
    events.some((e) => e.event_type === "at_gym");

  const hasSentRunningLate =
    sentEventTypes.has("running_late") ||
    events.some((e) => e.event_type === "running_late");

  const hasSentCantMakeIt =
    sentEventTypes.has("cant_make_it") ||
    events.some((e) => e.event_type === "cant_make_it");

  const canSendOnTheWay =
    !hasSentOnTheWay &&
    !hasSentRunningLate &&
    !hasSentAtGym &&
    !hasSentCantMakeIt;

  const canSendRunningLate =
    hasSentOnTheWay &&
    !hasSentRunningLate &&
    !hasSentAtGym &&
    !hasSentCantMakeIt;

  const canSendAtGym = hasSentOnTheWay && !hasSentAtGym && !hasSentCantMakeIt;

  const canSendCantMakeIt =
    hasSentOnTheWay && !hasSentAtGym && !hasSentCantMakeIt;

  //   console.log("HAS SENT ON_THE_WAY:", hasSentOnTheWay);

  //   console.log(
  //   "EVENT TYPES:",
  //   events.map((e) => e.event_type)
  // );

  const COLORS = {
    blue: "#007AFF",
    orange: "#FF9500",
    green: "#34C759",
    red: "#FF3B30",
    gray: "#C7C7CC",
  };

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

      <View style={{ marginTop: 24 }}>
        <Text style={{ fontWeight: "600", marginBottom: 8 }}>Chat</Text>

        {messages.length === 0 && (
          <Text style={{ color: "#777" }}>No messages yet.</Text>
        )}

        {messages.map((msg) => {
          const isMine = msg.from_user_id === myUserId;

          return (
            <View
              key={msg.id}
              style={{
                alignSelf: isMine ? "flex-end" : "flex-start",
                backgroundColor: isMine ? "#DCF8C6" : "#E5E5EA",
                padding: 10,
                borderRadius: 12,
                marginVertical: 4,
                maxWidth: "75%",
              }}
            >
              <Text style={{ fontSize: 15 }}>{msg.message}</Text>
              <Text
                style={{
                  fontSize: 10,
                  color: "#555",
                  marginTop: 4,
                  alignSelf: "flex-end",
                }}
              >
                {new Date(msg.created_at).toLocaleTimeString()}
              </Text>
            </View>
          );
        })}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 12,
          borderTopWidth: 1,
          borderColor: "#ddd",
          paddingTop: 8,
        }}
      >
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginRight: 8,
          }}
        />

        <Button
          title={sendingMessage ? "..." : "Send"}
          disabled={sendingMessage || newMessage.trim() === ""}
          color={hasSentAtGym ? COLORS.gray : COLORS.green}
          onPress={async () => {
            if (!pingId || !newMessage.trim()) return;

            try {
              setSendingMessage(true);
              await sendMatchMessage(pingId, newMessage.trim());
              setNewMessage("");
            } catch (err) {
              console.error("FAILED TO SEND MESSAGE", err);
            } finally {
              setSendingMessage(false);
            }
          }}
        />
      </View>

      <View style={{ marginTop: 16 }}>
        <Button
          title={hasSentOnTheWay ? "On the way ✓" : "On the way"}
          onPress={() => handleSendEvent("on_the_way")}
          disabled={!canSendOnTheWay || sendingEvent !== null}
          color={hasSentOnTheWay ? COLORS.gray : COLORS.blue}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <Button
          title={hasSentRunningLate ? "Running late ✓" : "Running late"}
          onPress={() => handleSendEvent("running_late")}
          disabled={!canSendRunningLate || sendingEvent !== null}
          color={hasSentRunningLate ? COLORS.gray : COLORS.orange}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <Button
          title={hasSentAtGym ? "At the gym ✓" : "At the gym"}
          onPress={() => handleSendEvent("at_gym")}
          disabled={!canSendAtGym || sendingEvent !== null}
          color={hasSentAtGym ? COLORS.gray : COLORS.green}
        />
      </View>

      <View style={{ marginTop: 12 }}>
        <Button
          title={hasSentCantMakeIt ? "Can't Make It ✓" : "Can't Make It"}
          onPress={() => handleSendEvent("cant_make_it")}
          disabled={!canSendCantMakeIt || sendingEvent !== null}
          color={hasSentCantMakeIt ? COLORS.gray : COLORS.red}
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
