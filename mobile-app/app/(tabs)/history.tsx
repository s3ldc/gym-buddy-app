import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { getMyPastMatches } from "../../services/pings";

export default function HistoryScreen() {
  const [matches, setMatches] = useState<any[]>([]);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      setMyUserId(session.user.id);

      try {
        const data = await getMyPastMatches();
        setMatches(data);
      } catch (err) {
        console.error("FAILED TO LOAD HISTORY", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading history...</Text>
      </View>
    );
  }

  if (matches.length === 0) {
    return (
      <View style={styles.container}>
        <Text>No past matches yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Past Matches</Text>

      {matches.map((row) => {
        if (!myUserId) return null;

        const partnerId =
          row.from_user_id === myUserId ? row.to_user_id : row.from_user_id;

        const shortPartnerId = partnerId.slice(-6);

        return (
          <View key={row.id} style={styles.card}>
            <Text style={styles.partner}>
              Partner: ...{shortPartnerId}
            </Text>

            <Text style={styles.meta}>
              Ended at:{" "}
              {row.ended_at
                ? new Date(row.ended_at).toLocaleString()
                : "Unknown"}
            </Text>
          </View>
        );
      })}
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
    padding: 14,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 12,
  },
  partner: {
    fontSize: 16,
    fontWeight: "500",
  },
  meta: {
    marginTop: 6,
    fontSize: 12,
    color: "#666",
  },
});
