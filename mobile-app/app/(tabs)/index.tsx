import { View, Text, StyleSheet } from "react-native";
import { useState } from "react";
import AvailabilityToggle from "../../components/AvailabilityToggle";

export default function HomeScreen() {
  const [available, setAvailable] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      <AvailabilityToggle
        value={available}
        onChange={setAvailable}
      />

      <Text style={styles.status}>
        Status: {available ? "Available" : "Not available"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff"
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24
  },
  status: {
    marginTop: 16,
    fontSize: 16
  }
});
