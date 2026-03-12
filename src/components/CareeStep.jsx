import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

import { colors } from "../../theme/colors.jsx";


export default function CareerStep({
  careerGoal,
  setCareerGoal,
  onBack,
  onComplete
}) {

  return (
    <View style={styles.container}>

      <Text style={styles.title}>What would you like to be in the future?</Text>
      <Text style={styles.subtitle}>
        This is optional, but helps us tailor your learning path.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Doctor, Engineer, Teacher..."
        placeholderTextColor={colors.mutedBlack}
        value={careerGoal}
        onChangeText={setCareerGoal}
      />

      <View style={styles.actions}>
        <Pressable onPress={onBack} style={[styles.actionBtn, styles.backBtn]}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable onPress={onComplete} style={styles.actionBtn}>
          <Text style={styles.nextText}>Complete Setup</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.white,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.mutedBlack,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    color: colors.black,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    minWidth: 140,
    alignItems: "center",
  },
  backBtn: {
    backgroundColor: colors.secondaryLight,
    minWidth: 120,
  },
  backText: {
    color: colors.black,
    fontWeight: "700",
  },
  nextText: {
    color: colors.white,
    fontWeight: "700",
  },
});
