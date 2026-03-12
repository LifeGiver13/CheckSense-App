import {
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { colors } from "../../theme/colors.jsx";

export default  function WelcomeStep({ onNext }) {
  return (
    <View style={styles.stepContainer}>

      <View style={styles.iconWrap}>
        <Feather name="book-open" size={64} color={colors.white} />
      </View>

      <Text style={styles.title}>Welcome to CheckSense</Text>

      <Text style={styles.description}>
        CheckSense is your intelligent study companion designed to help you excel in your exams.
      </Text>

      <View style={styles.feature}>
        <Feather name="zap" size={20} color={colors.primaryDark} />
        <Text style={styles.featureText}>
          Generate personalized quizzes based on your syllabus
        </Text>
      </View>

      <View style={styles.feature}>
        <Feather name="bar-chart-2" size={20} color={colors.primaryDark} />
        <Text style={styles.featureText}>
          Track your progress and identify areas for improvement
        </Text>
      </View>

      <View style={styles.feature}>
        <Feather name="check-circle" size={20} color={colors.primaryDark} />
        <Text style={styles.featureText}>
          Practice with instant feedback and explanations
        </Text>
      </View>

      <Pressable style={styles.button} onPress={onNext}>
        <Text style={styles.buttonText}>Get Started</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: colors.primaryDark,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.black,
    textAlign: "center",
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedBlack,
    textAlign: "center",
    marginBottom: 18,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    flex: 1,
    color: colors.black,
  },
  button: {
    marginTop: 18,
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
});
