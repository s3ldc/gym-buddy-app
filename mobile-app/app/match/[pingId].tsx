import { View, Text, StyleSheet, Button } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { endMatch } from "../../services/pings";
import { useState } from "react";

export default function MatchDetailScreen() {
  const params = useLocalSearchParams<{ pingId: string | string[] }>();

  const pingId =
    typeof params.pingId === "string" ? params.pingId : params.pingId?.[0];

  const [ending, setEnding] = useState(false);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Match</Text>

      <Text style={styles.info}>You’re matched and ready to work out.</Text>

      <View style={{ marginTop: 24 }}>
        <Button
          title={ending ? "Ending Match..." : "End Match"}
          onPress={handleEndMatch}
          disabled={ending}
        />
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
  info: {
    marginTop: 32,
    fontSize: 16,
    textAlign: "center",
  },
});
