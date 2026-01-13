import { View, Text, StyleSheet, Button } from "react-native";
import { useEffect, useState } from "react";
import AvailabilityToggle from "../../components/AvailabilityToggle";
import { useLocation } from "../../hooks/useLocation";
import {
  upsertAvailability,
  getMyAvailability,
  
} from "../../services/availability";
import { supabase } from "../../lib/supabase";
import { getNearbyAvailabilities } from "../../services/discovery";

export default function HomeScreen() {
  const [available, setAvailable] = useState(false);
  const { location, loading, error } = useLocation();

  // Restore availability on app load
  useEffect(() => {
    const restoreAvailability = async () => {
      try {
        const activeAvailability = await getMyAvailability();
        setAvailable(!!activeAvailability);
      } catch (err) {
        console.error("FAILED TO RESTORE AVAILABILITY", err);
      }
    };

    restoreAvailability();
  }, []);

useEffect(() => {
  if (!location) return;

  const fetchNearby = async () => {
    const users = await getNearbyAvailabilities(
      location.latitude,
      location.longitude
    );

    console.log("NEARBY MATCHES:", users);
  };

  fetchNearby();
}, [location]);



  // Toggle availability
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

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Home</Text>

      <Button title="Logout" onPress={handleLogout} />

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
