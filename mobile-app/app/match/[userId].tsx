import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Button } from "react-native";
import { router } from "expo-router";
import { getMatchWithUser, endMatch } from "../../services/pings";
import { useEffect, useState } from "react";

export default function MatchDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [pingId, setPingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMatch = async () => {
      const match = await getMatchWithUser(userId);
      if (match) {
        setPingId(match.id);
      }
      setLoading(false);
    };

    loadMatch();
  }, [userId]);

  const handleEndMatch = async () => {
    if (!pingId) return;

    try {
      await endMatch(pingId);
      router.replace("/"); // back to home
    } catch (err) {
      console.error("FAILED TO END MATCH", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading match...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Match</Text>

      <Text style={styles.info}>You’re matched and ready to work out.</Text>

      <View style={{ marginTop: 24 }}>
        <Button title="End Match" onPress={handleEndMatch} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  label: {
    fontSize: 12,
    color: "#777",
    marginTop: 16,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
  info: {
    marginTop: 32,
    fontSize: 16,
    textAlign: "center",
  },
  hint: {
    marginTop: 12,
    fontSize: 12,
    color: "#777",
    textAlign: "center",
  },
});
