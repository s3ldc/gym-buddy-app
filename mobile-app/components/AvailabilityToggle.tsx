import { View, Text, Switch, StyleSheet } from "react-native";

type Props = {
  value: boolean;
  onChange: (val: boolean) => void;
};

export default function AvailabilityToggle({ value, onChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>I want to go to the gym</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  label: {
    fontSize: 16
  }
});
