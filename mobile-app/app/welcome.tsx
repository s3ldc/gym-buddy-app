import { View, Text, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

export default function WelcomeScreen() {
  const handleGetStarted = async () => {
    await AsyncStorage.setItem("hasSeenWelcome", "true");
    router.replace("/login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headline}>
        Find a gym partner when yours cancels.
      </Text>

      <Button title="Get Started" onPress={handleGetStarted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  headline: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 32,
  },
});
