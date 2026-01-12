import { View, Text, TextInput, Button } from "react-native";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

const signIn = async () => {
  setLoading(true);
  console.log("LOGIN ATTEMPT", email);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log("LOGIN RESULT:", { data, error });

  if (error) {
    alert(error.message);
  }

  setLoading(false);
};

  const signUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Account created. Please log in.");
    }
    setLoading(false);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email</Text>
      <TextInput
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />

      <Text>Password</Text>
      <TextInput
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, padding: 10, marginVertical: 10 }}
      />

      <Button title="Login" onPress={signIn} disabled={loading} />
      <View style={{ height: 10 }} />
      <Button title="Sign Up" onPress={signUp} disabled={loading} />
    </View>
  );
}
