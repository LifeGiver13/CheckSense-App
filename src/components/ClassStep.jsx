import { Picker } from "@react-native-picker/picker";
import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { colors } from "../../theme/colors.jsx";

export default function ClassStep({
  selectedClass,
  setSelectedClass,
  onNext,
  onBack
}) {

  return (
    <View style={styles.stepContainer}>

      <Text style={styles.title}>What class are you in?</Text>
      <Text style={styles.subtitle}>
        This helps us personalize subjects and quizzes for you.
      </Text>

      <Picker
        selectedValue={selectedClass}
        onValueChange={setSelectedClass}
        style={styles.picker}
      >
        <Picker.Item label="Choose your class" value="" />
        <Picker.Item label="Form 1" value="Form 1" />
        <Picker.Item label="Form 2" value="Form 2" />
        <Picker.Item label="Form 3" value="Form 3" />
        <Picker.Item label="Form 4" value="Form 4" />
        <Picker.Item label="Form 5" value="Form 5" />
        <Picker.Item label="Lower Sixth" value="Lower Sixth" />
        <Picker.Item label="Upper Sixth" value="Upper Sixth" />
      </Picker>

      <View style={styles.actions}>
        <Pressable onPress={onBack} style={[styles.actionBtn, styles.backBtn]}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!selectedClass}
          style={[styles.actionBtn, !selectedClass && { opacity: 0.6 }]}
        >
          <Text style={styles.nextText}>Continue</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
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
  picker: {
    backgroundColor: colors.white,
    color: colors.black,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    minWidth: 120,
    alignItems: "center",
  },
  backBtn: {
    backgroundColor: colors.secondaryLight,
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
