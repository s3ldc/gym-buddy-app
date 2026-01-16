import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function MatchDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout Match</Text>

      <Text style={styles.label}>Matched User ID</Text>
      <Text style={styles.value}>{userId}</Text>

      <Text style={styles.info}>
        You’ve both agreed to work out together.
      </Text>

      <Text style={styles.hint}>
        Coordinate your workout using your preferred method.
      </Text>
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
