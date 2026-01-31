import { View, Text, StyleSheet, TextInput, Button, Image } from "react-native";
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { router } from "expo-router";

const AGE_RANGES = ["18-25", "26-35", "36-45", "46+"];

export default function ProfileSetupScreen() {
  const [fullName, setFullName] = useState("");
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ FIXED
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!fullName || !ageRange) {
      alert("Please enter name and select age range");
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    try {
      setSaving(true);

      let avatarUrl: string | null = null;

      // 🔹 Upload photo if selected
      if (image) {
        const response = await fetch(image);
        const arrayBuffer = await response.arrayBuffer();

        const fileExt = image.split(".").pop() || "jpg";
        const filePath = `${session.user.id}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, arrayBuffer, {
            contentType: "image/jpeg",
            upsert: true,
          });

        if (uploadError) {
          console.error("UPLOAD ERROR:", uploadError);
          alert("Failed to upload image");
          return;
        }

        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        avatarUrl = data.publicUrl;
      }

      // 🔹 Save profile row
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          age_range: ageRange,
          gender,
          avatar_url: avatarUrl,
        })
        .eq("id", session.user.id);

      if (error) {
        console.error(error);
        alert("Failed to save profile");
        return;
      }

      router.replace({
        pathname: "/",
        params: { refresh: Date.now().toString() },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your profile</Text>

      {/* Photo */}
      <View style={styles.photoContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text>No Photo</Text>
          </View>
        )}

        <Button title="Upload Photo" onPress={pickImage} />
      </View>

      {/* Name */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter your name"
        style={styles.input}
      />

      {/* Age Range */}
      <Text style={styles.label}>Age Range</Text>
      <View style={styles.row}>
        {AGE_RANGES.map((range) => (
          <Text
            key={range}
            onPress={() => setAgeRange(range)}
            style={[styles.chip, ageRange === range && styles.chipSelected]}
          >
            {range}
          </Text>
        ))}
      </View>

      {/* Gender */}
      <Text style={styles.label}>Gender (optional)</Text>
      <View style={styles.row}>
        {["Male", "Female", "Other"].map((g) => (
          <Text
            key={g}
            onPress={() => setGender(g)}
            style={[styles.chip, gender === g && styles.chipSelected]}
          >
            {g}
          </Text>
        ))}
      </View>

      <View style={{ marginTop: 32 }}>
        <Button
          title={saving ? "Saving..." : "Continue"}
          disabled={saving}
          onPress={handleSaveProfile}
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
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 24,
    textAlign: "center",
  },
  photoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 6,
  },
  chipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
    color: "#fff",
  },
});