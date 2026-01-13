import { View, Text, StyleSheet, Button, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import AvailabilityToggle from "../../components/AvailabilityToggle";
import { useLocation } from "../../hooks/useLocation";
import {
  upsertAvailability,
  getMyAvailability,
} from "../../services/availability";
import { supabase } from "../../lib/supabase";
import { getNearbyAvailabilities } from "../../services/discovery";
import { formatDistance } from "../../utils/distance";


export default function HomeScreen() {
  const [available, setAvailable] = useState(false);
  const { location, loading, error } = useLocation();
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Restore availability on app load
  useEffect(() => {
    const restoreAvailability = async () => {
      try {
        const activeAvailability = await getMyAvailability();

        if (activeAvailability) {
          setAvailable(true);
        } else {
          setAvailable(false);

          // 🔴 FORCE CLEANUP OF STALE TRUE STATUS
          await upsertAvailability({
            status: false,
            available_at: "expired",
            latitude: location?.latitude ?? 0,
            longitude: location?.longitude ?? 0,
            radius_km: 3,
            expires_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("FAILED TO RESTORE AVAILABILITY", err);
      }
    };

    restoreAvailability();
  }, []);

  // Fetch nearby users
  const fetchNearby = async () => {
    if (!location) return;

    try {
      setLoadingNearby(true);

      const users = await getNearbyAvailabilities(
        location.latitude,
        location.longitude,
        3 // your current radius
      );

      setNearbyUsers(users);
    } catch (err) {
      console.error("FAILED TO FETCH NEARBY USERS", err);
    } finally {
      setLoadingNearby(false);
    }
  };

  // Fetch when location changes
  useEffect(() => {
    fetchNearby();
  }, [location]);

  // Toggle availability
  const handleAvailabilityChange = async (value: boolean) => {
    setAvailable(value);

    if (!location) return;

    try {
      await upsertAvailability({
        status: value,
        available_at: value ? "now" : "off",
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: 3,
        expires_at: value
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString() // +30 min
          : new Date().toISOString(), // expire immediately
      });

      if (value) {
        fetchNearby();
      } else {
        setNearbyUsers([]);
      }
    } catch (err) {
      console.error("FAILED TO SAVE AVAILABILITY:", err);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
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

      {/* ✅ SHOW DISCOVERY ONLY WHEN AVAILABLE */}
      {available && (
        <>
          <Text style={styles.sectionTitle}>Nearby Gym Partners</Text>

          {loadingNearby && <Text>Finding partners...</Text>}

          {!loadingNearby && nearbyUsers.length === 0 && (
            <Text style={{ marginTop: 8 }}>No one nearby right now.</Text>
          )}

          {nearbyUsers.map((user) => (
            <View key={user.user_id} style={styles.card}>
              <Text style={{ fontWeight: "600" }}>Available now</Text>
              <Text>{formatDistance(user.distanceKm)}</Text>
              <Text>Radius: {user.radius_km} km</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: "600",
  },
  card: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    width: "100%",
  },
});
