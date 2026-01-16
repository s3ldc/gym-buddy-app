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
import Slider from "@react-native-community/slider";
import { ActivityIndicator } from "react-native";
import { sendPing } from "../../services/pings";
import { getMyAcceptedPings } from "../../services/pings";
import { getMySentPendingPings } from "../../services/pings";
import { router } from "expo-router";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";

type WorkoutType = "strength" | "cardio" | "mixed";
type WorkoutFilter = "all" | WorkoutType;

const WORKOUT_TYPES: WorkoutType[] = ["strength", "cardio", "mixed"];
const WORKOUT_FILTERS: WorkoutFilter[] = ["all", "strength", "cardio", "mixed"];

export default function HomeScreen() {
  const [available, setAvailable] = useState(false);
  const { location, loading, error } = useLocation();
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);
  const [workoutFilter, setWorkoutFilter] = useState<WorkoutFilter>("all");
  const filteredUsers =
    workoutFilter === "all"
      ? nearbyUsers
      : nearbyUsers.filter((u) => u.workout_type === workoutFilter);
  const [restoring, setRestoring] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutType>("mixed");
  const [radiusKm, setRadiusKm] = useState(3);
  const [sentPings, setSentPings] = useState<Set<string>>(new Set());
  const [pingingUserId, setPingingUserId] = useState<string | null>(null);
  const [matchedUserIds, setMatchedUserIds] = useState<Set<string>>(new Set());
  const [matchByUserId, setMatchByUserId] = useState<Record<string, string>>(
    {}
  );
  const params = useLocalSearchParams();
  const hasActiveMatch = Object.keys(matchByUserId).length > 0;

  const restoreSentPings = async () => {
    try {
      const sent = await getMySentPendingPings();
      setSentPings(new Set(sent));
    } catch (err) {
      console.error("FAILED TO RESTORE SENT PINGS", err);
    }
  };

  const loadMatches = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    try {
      const matches = await getMyAcceptedPings();
      const map: Record<string, string> = {};
      const matchedSet = new Set<string>();

      matches.forEach((ping) => {
        const otherId =
          ping.from_user_id === session.user.id
            ? ping.to_user_id
            : ping.from_user_id;

        map[otherId] = ping.id;
        matchedSet.add(otherId);
      });

      setMatchByUserId(map);
      setMatchedUserIds(matchedSet);
    } catch (err) {
      console.error("FAILED TO LOAD MATCHES", err);
    }
  };

  const handleSendPing = async (toUserId: string) => {
    if (!available) return;
    if (sentPings.has(toUserId)) return; // 🔒 HARD GUARD

    try {
      setPingingUserId(toUserId);
      await sendPing(toUserId);
      setSentPings((prev) => new Set(prev).add(toUserId));
    } catch (err: any) {
      if (err.message?.includes("duplicate key")) {
        // graceful fallback
        setSentPings((prev) => new Set(prev).add(toUserId));
        return;
      }

      console.error("FAILED TO SEND PING", err.message);
      alert("Could not send ping");
    } finally {
      setPingingUserId(null);
    }
  };

  useEffect(() => {
    if (!available) return;

    loadMatches();
    restoreSentPings();
  }, [available, params?.refresh]);

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

          // ✅ restore saved radius
          if (row.radius_km) {
            setRadiusKm(row.radius_km);
          }

          if (row?.workout_type) {
            setSelectedWorkout(row.workout_type);
          }
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
        radiusKm
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
        radius_km: radiusKm,
        ...(value && { workout_type: selectedWorkout }),
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

  useFocusEffect(
    useCallback(() => {
      if (!available) return;

      loadMatches();
      restoreSentPings();

      return () => {};
    }, [available])
  );

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (restoring) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.text}>Home</Text>

      {hasActiveMatch && (
        <View
          style={{
            marginVertical: 12,
            padding: 12,
            backgroundColor: "#E8F5E9",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#34C759",
            width: "100%",
          }}
        >
          <Text style={{ fontWeight: "600", color: "#1B5E20" }}>
            You’re currently matched with a gym partner
          </Text>
          <Text style={{ marginTop: 4, fontSize: 12, color: "#1B5E20" }}>
            End the match to change availability or settings.
          </Text>
        </View>
      )}

      <Button title="Logout" onPress={handleLogout} />
      <Text style={styles.selectorTitle}>Workout Type</Text>

      <View style={styles.selectorRow}>
        {WORKOUT_TYPES.map((type) => {
          const selected = selectedWorkout === type;
          const locked = available || hasActiveMatch; // 🔒 lock when ON or matched

          return (
            <Text
              key={type}
              onPress={() => {
                if (!locked) {
                  setSelectedWorkout(type);
                }
              }}
              style={[
                styles.selectorChip,
                selected && styles.selectorChipSelected,
                locked && !selected && styles.selectorChipDisabled,
              ]}
            >
              {type.toUpperCase()}
            </Text>
          );
        })}
      </View>

      <Text style={styles.selectorTitle}>Search Radius</Text>

      <View style={styles.radiusRow}>
        <Text style={{ opacity: available ? 0.5 : 1 }}>{radiusKm} km</Text>
      </View>

      <View style={{ width: "100%", paddingHorizontal: 8 }}>
        <Slider
          value={radiusKm}
          minimumValue={1}
          maximumValue={10}
          step={1}
          onValueChange={setRadiusKm}
          disabled={available || hasActiveMatch} // 🔒 lock when ON
          minimumTrackTintColor="#007AFF"
          maximumTrackTintColor="#ccc"
          style={{ width: "100%", height: 40 }}
        />
      </View>

      <AvailabilityToggle
        value={available}
        onChange={handleAvailabilityChange}
        disabled={hasActiveMatch}
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
          <Text style={styles.selectorTitle}>Filter by Workout</Text>

          <View style={styles.filterRow}>
            {WORKOUT_FILTERS.map((type) => {
              const selected = workoutFilter === type;

              return (
                <Text
                  key={type}
                  onPress={() => setWorkoutFilter(type)}
                  style={[
                    styles.filterChip,
                    selected && styles.filterChipSelected,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>Nearby Gym Partners</Text>

          {loadingNearby && <Text>Finding partners...</Text>}

          {!loadingNearby && nearbyUsers.length === 0 && (
            <Text style={{ marginTop: 8 }}>
              No gym partners nearby at the moment. Check back soon or increase
              your radius.
            </Text>
          )}

          {filteredUsers.map((user) => {
            const isMatched = matchedUserIds.has(user.user_id);
            const hasSentPing = sentPings.has(user.user_id);
            const isSending = pingingUserId === user.user_id;

            let buttonTitle = "Ping Gym Partner";

            if (isMatched) {
              buttonTitle = "View Match";
            } else if (hasActiveMatch) {
              buttonTitle = "Currently Matched";
            } else if (isSending) {
              buttonTitle = "Sending...";
            } else if (hasSentPing) {
              buttonTitle = "Ping Sent";
            }

            return (
              <View key={user.user_id} style={styles.card}>
                <Text style={{ fontWeight: "600" }}>Available now</Text>

                <Text>{formatDistance(user.distanceKm)}</Text>

                {user.workout_type && <Text>Workout: {user.workout_type}</Text>}

                <Text>Radius: {user.radius_km} km</Text>

                <View style={{ marginTop: 10 }}>
                  <Button
                    title={buttonTitle}
                    onPress={() => {
                      if (isMatched) {
                        const pingId = matchByUserId[user.user_id];
                        if (pingId) {
                          router.push({
                            pathname: "/match/[pingId]",
                            params: { pingId },
                          });
                        }
                        return;
                      }

                      if (hasActiveMatch) {
                        return; // 🔒 read-only mode
                      }

                      handleSendPing(user.user_id);
                    }}
                    disabled={
                      (hasActiveMatch && !isMatched) ||
                      !available ||
                      hasSentPing ||
                      isSending
                    }
                  />
                </View>
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
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#333",
    overflow: "hidden",
  },

  filterChipSelected: {
    backgroundColor: "#34C759", // green to differentiate from selector
    borderColor: "#34C759",
    color: "#fff",
  },

  selectorTitle: {
    marginTop: 16,
    fontWeight: "600",
  },

  selectorRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 10,
  },

  selectorChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#333",
    overflow: "hidden",
  },

  selectorChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
    color: "#fff",
  },

  selectorChipDisabled: {
    opacity: 0.35,
  },
  radiusRow: {
    marginVertical: 8,
  },
});
