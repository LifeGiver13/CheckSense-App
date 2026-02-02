import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { colors } from "../../theme/colors.jsx";
import { API_BASE_URL } from "../../theme/constants.jsx";

// Reusable validation item
const ValidationItem = ({ met, text }) => (
  <View style={styles.validationItem}>
    {met ? (
      <Text style={[styles.validationIcon, { color: colors.success }]}>✓</Text>
    ) : (
      <Text style={[styles.validationIcon, { color: colors.mutedBlack }]}>✕</Text>
    )}
    <Text style={[styles.validationText, { color: met ? colors.success : colors.mutedBlack }]}>
      {text}
    </Text>
  </View>
);

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Password validation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  const handleUpdatePassword = async () => {
    if (!isPasswordValid) {
      Alert.alert("Invalid Password", "Your password does not meet all requirements.");
      return;
    }
    if (!token) {
      Alert.alert("Error", "You must be logged in to update your password.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v2/password/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Success", data.message || "Password updated successfully.");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        throw new Error(data.message || "Failed to update password.");
      }
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update password.");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Breadcrumb / Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/settings')}>
        <Feather name="chevron-left" size={24} color={colors.black} />
        <Text style={styles.backText}>Back to Settings</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Change Password</Text>
      <Text style={styles.subtitle}>Update your password and account security</Text>

      <View style={styles.card}>
        {/* New Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
            />
            <TouchableOpacity
              onPress={() => setShowNewPassword(!showNewPassword)}
              style={styles.eyeIcon}
            >
              <Feather name={showNewPassword ? "eye-off" : "eye"} size={20} color={colors.mutedBlack} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={colors.mutedBlack} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Validation */}
        {(newPassword || confirmPassword) && (
          <View style={styles.validationContainer}>
            <Text style={styles.validationTitle}>Password Requirements</Text>
            <ValidationItem met={hasMinLength} text="At least 8 characters" />
            <ValidationItem met={hasUppercase} text="Contains uppercase letter" />
            <ValidationItem met={hasLowercase} text="Contains lowercase letter" />
            <ValidationItem met={hasNumber} text="Contains a number" />
            {confirmPassword && <ValidationItem met={passwordsMatch} text="Passwords match" />}
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.updateBtn, !isPasswordValid && { opacity: 0.5 }]}
          disabled={!isPasswordValid || isUpdating}
          onPress={handleUpdatePassword}
        >
          <Text style={styles.updateBtnText}>{isUpdating ? "Updating..." : "Update Password"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.white, flexGrow: 1 },
  backBtn: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backText: { marginLeft: 8, color: colors.black, fontSize: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: colors.black, marginBottom: 4 },
  subtitle: { fontSize: 16, color: colors.mutedBlack, marginBottom: 16 },
  card: { padding: 16, backgroundColor: colors.white, borderRadius: 12, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  inputGroup: { marginBottom: 16 },
  label: { marginBottom: 8, color: colors.mutedBlack, fontWeight: "500" },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.mutedBlack, borderRadius: 8 },
  input: { flex: 1, padding: 12, color: colors.black },
  eyeIcon: { padding: 8 },
  validationContainer: { marginTop: 12, backgroundColor: colors.mutedBlack + "20", padding: 12, borderRadius: 8 },
  validationTitle: { fontWeight: "600", marginBottom: 8, color: colors.black },
  validationItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  validationIcon: { marginRight: 8 },
  validationText: { fontSize: 14 },
  updateBtn: { marginTop: 16, backgroundColor: colors.primary, padding: 14, borderRadius: 8, alignItems: "center" },
  updateBtnText: { color: colors.white, fontWeight: "bold", fontSize: 16 },
});
