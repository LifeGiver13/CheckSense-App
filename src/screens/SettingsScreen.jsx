import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors.jsx";
import SettingsCard from "../components/SettingsCard.jsx";

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account and security preferences</Text>
      </View>

      <SettingsCard
        icon={<Feather name="user" size={32} color={colors.white} />}
        title="Account Information"
        description="Manage your profile details"
        items={["Edit Profile Details", "Update Study Preferences", "Manage Contact Info"]}
        onPress={() => router.push("/settings/account")}
        colorBg={colors.primary}
        colorText={colors.white}
      />

      <SettingsCard
        icon={<Feather name="lock" size={32} color={colors.white} />}
        title="Change Password"
        description="Update your account security"
        items={["Secure Password Update", "Password Strength Validation", "Enhanced Account Security"]}
        onPress={() => router.push("/settings/password")}
        colorBg={colors.secondary}
        colorText={colors.white}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.white,
    height: '100%'
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.mutedBlack,
  },
 
});