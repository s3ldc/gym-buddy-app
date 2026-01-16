import { View, Text, Switch, StyleSheet } from "react-native";

type Props = {
  value: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
};

export default function AvailabilityToggle({
  value,
  onChange,
  disabled = false,
}: Props) {
  return (
    <View style={[styles.container, disabled && { opacity: 0.4 }]}>
      <Text style={styles.label}>I want to go to the gym</Text>
      <Switch
        value={value}
        onValueChange={(val) => {
          if (disabled) return;
          onChange(val);
        }}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 16,
  },
});
