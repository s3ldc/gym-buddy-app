import { View, Text, StyleSheet } from "react-native";
import { useState } from "react";
import AvailabilityToggle from "../../components/AvailabilityToggle";
import { useLocation } from "../../hooks/useLocation";
import { upsertAvailability } from "../../services/availability";

export default function HomeScreen() {
  const [available, setAvailable] = useState(false);
  const { location, loading, error } = useLocation();

  const handleAvailabilityChange = async (value: boolean) => {
  console.log("TOGGLE:", value);
  setAvailable(value);

  if (!location) {
    console.log("NO LOCATION — aborting");
    return;
  }

  try {
    await upsertAvailability({
      status: value,
      available_at: "now",
      latitude: location.latitude,
      longitude: location.longitude,
      radius_km: 3,
    });

    console.log("AVAILABILITY SAVED");
  } catch (err) {
    console.error("FAILED TO SAVE AVAILABILITY:", err);
  }
};


  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>

      <AvailabilityToggle
        value={available}
        onChange={handleAvailabilityChange}
      />

      <Text>Status: {available ? "Available" : "Not available"}</Text>

      {loading && <Text>Getting location…</Text>}
      {error && <Text style={{ color: "red" }}>{error}</Text>}
      {location && (
        <Text>
          {location.latitude.toFixed(3)},{" "}
          {location.longitude.toFixed(3)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 8,
  },
});
