import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getMatchEvents } from "../../services/matchEvents";
import { getMatchMessages } from "../../services/matchMessages";

export default function PastMatchDetailScreen() {
  const params = useLocalSearchParams<{ pingId: string }>();
  const pingId = params.pingId;

  const [events, setEvents] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!pingId) return;

      try {
        const [ev, msg] = await Promise.all([
          getMatchEvents(pingId),
          getMatchMessages(pingId),
        ]);

        setEvents(ev);
        setMessages(msg);
      } catch (err) {
        console.error("FAILED TO LOAD PAST MATCH", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [pingId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading match history...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Past Match</Text>

      {/* Timeline */}
      <View style={{ marginTop: 16 }}>
        <Text style={styles.section}>Timeline</Text>

        {events.length === 0 && (
          <Text style={{ color: "#777" }}>No events.</Text>
        )}

        {events.map((event) => (
          <View key={event.id} style={styles.row}>
            <Text style={{ fontWeight: "500" }}>
              {event.event_type}
            </Text>
            <Text style={styles.time}>
              {new Date(event.created_at).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      {/* Chat */}
      <View style={{ marginTop: 24 }}>
        <Text style={styles.section}>Chat</Text>

        {messages.length === 0 && (
          <Text style={{ color: "#777" }}>No messages.</Text>
        )}

        {messages.map((msg) => (
          <View key={msg.id} style={styles.chatBubble}>
            <Text>{msg.message}</Text>
            <Text style={styles.time}>
              {new Date(msg.created_at).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  section: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  row: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  chatBubble: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#F2F2F2",
    marginVertical: 6,
  },
  time: {
    fontSize: 11,
    color: "#777",
    marginTop: 4,
  },
});
