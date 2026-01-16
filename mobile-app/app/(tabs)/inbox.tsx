import { View, Text, StyleSheet, Button, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { getIncomingPings, respondToPing } from "../../services/pings";
import { router } from "expo-router";

export default function InboxScreen() {
  const [pings, setPings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchPings = async () => {
    try {
      setLoading(true);
      const data = await getIncomingPings();
      setPings(data);
    } catch (err) {
      console.error("FAILED TO LOAD PINGS", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPings();
  }, []);

  const handleRespond = async (pingId: string, action: "accept" | "reject") => {
    try {
      setRespondingId(pingId);
      await respondToPing(pingId, action);
      setPings((prev) => prev.filter((p) => p.id !== pingId));

      if (action === "accept") {
        router.replace({
          pathname: "/",
          params: { refresh: Date.now().toString() },
        });
      }
    } catch (err) {
      console.error("FAILED TO RESPOND TO PING", err);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Incoming Pings</Text>

      <Button title="Refresh" onPress={fetchPings} />

      {loading && <Text>Loading...</Text>}

      {!loading && pings.length === 0 && (
        <Text style={{ marginTop: 20 }}>No incoming pings right now.</Text>
      )}

      {pings.map((ping) => (
        <View key={ping.id} style={styles.card}>
          <Text style={{ fontWeight: "600" }}>
            Someone wants to work out with you
          </Text>

          <View style={styles.actionRow}>
            <Button
              title="Accept"
              onPress={() => handleRespond(ping.id, "accept")}
              disabled={respondingId === ping.id}
            />

            <Button
              title="Reject"
              onPress={() => handleRespond(ping.id, "reject")}
              disabled={respondingId === ping.id}
            />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  card: {
    marginTop: 16,
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
});
