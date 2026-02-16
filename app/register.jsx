import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors.jsx";

export default function RegisterPlaceholder() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registration Coming Soon</Text>
      <Text style={styles.subtitle}>
        This screen is not ready yet. Use login for now.
      </Text>
      <Pressable style={styles.button} onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Go to Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedBlack,
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryDark,
  },
  buttonText: {
    color: colors.white,
    fontWeight: "600",
  },
});
