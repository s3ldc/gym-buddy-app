import { View, Text, StyleSheet } from "react-native";
import { useState } from "react";
import AvailabilityToggle from "../../components/AvailabilityToggle";
import { useLocation } from "../../hooks/useLocation";
import { upsertAvailability } from "../../services/availability";
import { getMyAvailability } from "../../services/availability";
import { useEffect } from "react";

export default function HomeScreen() {
  const [available, setAvailable] = useState(false);
  const { location, loading, error } = useLocation();

  useEffect(() => {
    const restoreAvailability = async () => {
      try {
        const activeAvailability = await getMyAvailability();

        if (activeAvailability) {
          setAvailable(true);
          console.log("RESTORED AVAILABILITY");
        } else {
          setAvailable(false);
          console.log("NO ACTIVE AVAILABILITY");
        }
      } catch (err) {
        console.error("FAILED TO RESTORE AVAILABILITY", err);
      }
    };

    restoreAvailability();
  }, []);

  const handleAvailabilityChange = async (value: boolean) => {
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
          {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}
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
