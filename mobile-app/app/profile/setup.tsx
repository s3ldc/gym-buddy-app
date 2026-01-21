import { View, Text, StyleSheet, TextInput, Button, Image } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../../lib/supabase";
import { router } from "expo-router";
import Slider from "@react-native-community/slider";

export default function ProfileSetupScreen() {
  const [fullName, setFullName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(35);
  const [gender, setGender] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      alert("Please enter your name");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    try {
      setSaving(true);

      let avatarUrl: string | null = null;

      // 🔹 Upload avatar if selected
      if (avatar) {
        const fileExt = avatar.split(".").pop();
        const fileName = `${session.user.id}.${fileExt}`;

        const response = await fetch(avatar);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, blob, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        avatarUrl = data.publicUrl;
      }

      // 🔹 Save profile
      const { error } = await supabase.from("profiles").upsert({
        id: session.user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        age_min: ageMin,
        age_max: ageMax,
        gender,
      });

      if (error) throw error;

      router.replace("/(tabs)");
    } catch (err) {
      console.error("FAILED TO SAVE PROFILE", err);
      alert("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>

      {/* Photo */}
      <View style={{ alignItems: "center", marginBottom: 20 }}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text>No photo</Text>
          </View>
        )}

        <Button title="Choose Photo" onPress={pickImage} />
      </View>

      {/* Name */}
      <TextInput
        placeholder="Your name"
        value={fullName}
        onChangeText={setFullName}
        style={styles.input}
      />

      {/* Age Range */}
      <Text style={styles.label}>Preferred Age Range</Text>
      <Text style={{ marginBottom: 6 }}>
        {ageMin} - {ageMax}
      </Text>

      <Text>Min Age</Text>
      <Slider minimumValue={18} maximumValue={60} step={1} value={ageMin} onValueChange={setAgeMin} />

      <Text>Max Age</Text>
      <Slider minimumValue={18} maximumValue={60} step={1} value={ageMax} onValueChange={setAgeMax} />

      {/* Gender */}
      <Text style={styles.label}>Gender (optional)</Text>

      <View style={styles.genderRow}>
        {["male", "female", "other"].map((g) => (
          <Text
            key={g}
            onPress={() => setGender(g)}
            style={[
              styles.genderChip,
              gender === g && styles.genderChipSelected,
            ]}
          >
            {g.toUpperCase()}
          </Text>
        ))}
      </View>

      <View style={{ marginTop: 30 }}>
        <Button
          title={saving ? "Saving..." : "Save Profile"}
          disabled={saving}
          onPress={handleSave}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  label: {
    fontWeight: "600",
    marginTop: 16,
  },
  genderRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  genderChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  genderChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
    color: "#fff",
  },
});
