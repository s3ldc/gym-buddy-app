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
  const [workoutFilter, setWorkoutFilter] = useState<
    "all" | "strength" | "cardio" | "mixed"
  >("all");
  const filteredUsers =
    workoutFilter === "all"
      ? nearbyUsers
      : nearbyUsers.filter((u) => u.workout_type === workoutFilter);
  const [restoring, setRestoring] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<
    "strength" | "cardio" | "mixed"
  >("mixed");

  // Restore availability on app load
  useEffect(() => {
    if (!location) return;

    const restoreAvailability = async () => {
      try {
        const row = await getMyAvailability();

        if (!row) {
          setAvailable(false);
        } else {
          const isExpired = new Date(row.expires_at) < new Date();
          setAvailable(row.status && !isExpired);
        }
      } catch (err) {
        console.error("FAILED TO RESTORE AVAILABILITY", err);
      } finally {
        setRestoring(false);
      }
    };

    restoreAvailability();
  }, [location]);

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
      const expiresAt = value
        ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
        : new Date().toISOString();

      await upsertAvailability({
        status: value,
        available_at: value ? "now" : "off",
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: 3,
        workout_type: selectedWorkout, // ✅ use selector
        expires_at: expiresAt,
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

  if (restoring) {
    return (
      <View style={styles.container}>
        <Text>Restoring availability…</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>Home</Text>

      <Button title="Logout" onPress={handleLogout} />

      <Text style={{ marginTop: 16, fontWeight: "600" }}>Workout Type</Text>

      <View style={styles.selectorRow}>
        {["strength", "cardio", "mixed"].map((type) => (
          <Button
            key={type}
            title={type}
            onPress={() => setSelectedWorkout(type as any)}
            disabled={!available}
            color={selectedWorkout === type ? "#007AFF" : undefined}
          />
        ))}
      </View>

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
          <View style={styles.filterRow}>
            {["all", "strength", "cardio", "mixed"].map((type) => (
              <Button
                key={type}
                title={type}
                onPress={() => setWorkoutFilter(type as any)}
              />
            ))}
          </View>

          <Text style={styles.sectionTitle}>Nearby Gym Partners</Text>

          {loadingNearby && <Text>Finding partners...</Text>}

          {!loadingNearby && nearbyUsers.length === 0 && (
            <Text style={{ marginTop: 8 }}>No one nearby right now.</Text>
          )}

          {filteredUsers.map((user) => {
            console.log("NEARBY USER DATA:", user);

            return (
              <View key={user.user_id} style={styles.card}>
                <Text style={{ fontWeight: "600" }}>Available now</Text>
                <Text>{formatDistance(user.distanceKm)}</Text>

                {user.workout_type && <Text>Workout: {user.workout_type}</Text>}

                <Text>Radius: {user.radius_km} km</Text>
              </View>
            );
          })}
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
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  selectorRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
});
