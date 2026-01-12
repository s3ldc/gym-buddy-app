import { View, Text, StyleSheet } from "react-native";
import { useState } from "react";
import AvailabilityToggle from "../../components/AvailabilityToggle";
import { useLocation } from "../../hooks/useLocation";

export default function HomeScreen() {
  const [available, setAvailable] = useState(false);
  const { location, error, loading } = useLocation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>

      <AvailabilityToggle value={available} onChange={setAvailable} />

      <Text style={styles.status}>
        Status: {available ? "Available" : "Not available"}
      </Text>

      {loading && <Text>Getting location...</Text>}

      {error && <Text style={{ color: "red" }}>{error}</Text>}

      {location && (
        <Text>
          Lat: {location.latitude.toFixed(4)}, Lng:{" "}
          {location.longitude.toFixed(4)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24,
  },
  status: {
    marginTop: 16,
    fontSize: 16,
  },
});
