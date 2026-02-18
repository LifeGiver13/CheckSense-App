import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, StyleSheet, Text, View } from "react-native";

import { useQuizGeneration } from "../contexts/QuizgenerationContext";
import { colors } from "../theme/colors";

const encouragingMessages = [
  { icon: "activity", text: "Crafting challenging questions for you..." },
  { icon: "book-open", text: "Selecting the best content from your topics..." },
  { icon: "award", text: "Fine-tuning quiz quality..." },
  { icon: "coffee", text: "Almost done. Preparing the final quiz..." },
];

const capitalize = (value = "") =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

export default function QuizGenerating() {
  const { currentQuizConfig, createQuiz } = useQuizGeneration();
  const [displayConfig, setDisplayConfig] = useState(currentQuizConfig || null);
  const lastProcessedConfigKeyRef = useRef("");
  const inFlightConfigKeyRef = useRef("");
  const attemptsByConfigRef = useRef({});

  useEffect(() => {
    if (currentQuizConfig) {
      setDisplayConfig(currentQuizConfig);
    }
  }, [currentQuizConfig]);

  const {
    subject = "Subject",
    topic = "Topic",
    duration = "",
    quizType = "",
    difficulty = "",
  } = displayConfig || {};

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const configKey = useMemo(() => {
    if (!currentQuizConfig) return "";

    return JSON.stringify({
      subject: currentQuizConfig.subject,
      classLevel: currentQuizConfig.classLevel,
      topic: currentQuizConfig.topic,
      difficulty: currentQuizConfig.difficulty,
      quizType: currentQuizConfig.quizType,
      duration: currentQuizConfig.duration,
      topics: Array.isArray(currentQuizConfig.topics)
        ? currentQuizConfig.topics.map((topic) => ({
            name: topic?.name || "",
            subCount: Array.isArray(topic?.subtopic)
              ? topic.subtopic.length
              : Array.isArray(topic?.subtopics)
                ? topic.subtopics.length
                : 0,
          }))
        : [],
    });
  }, [currentQuizConfig]);

  useFocusEffect(
    useCallback(() => {
      if (!currentQuizConfig || !configKey) return undefined;

      if (lastProcessedConfigKeyRef.current === configKey) {
        return undefined;
      }

      if (inFlightConfigKeyRef.current === configKey) {
        return undefined;
      }

      inFlightConfigKeyRef.current = configKey;

      (async () => {
        const attempts = attemptsByConfigRef.current[configKey] || 0;
        let quizId = null;
        let currentAttempts = attempts;

        while (currentAttempts < 3 && !quizId) {
          quizId = await createQuiz();
          if (quizId) break;

          currentAttempts += 1;
          attemptsByConfigRef.current[configKey] = currentAttempts;
          if (currentAttempts < 3) {
            await new Promise((resolve) => setTimeout(resolve, 900));
          }
        }

        if (quizId) {
          lastProcessedConfigKeyRef.current = configKey;
          attemptsByConfigRef.current[configKey] = 0;
        } else if (currentAttempts >= 3) {
          Alert.alert("Error", "Failed to generate quiz. Please try again.");
        }
        inFlightConfigKeyRef.current = "";
      })();

      return undefined;
    }, [currentQuizConfig, configKey, createQuiz])
  );

  const resetState = useCallback(() => {
    setProgress(0);
    setMessageIndex(0);
    setElapsedTime(0);
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetState();

      const messageInterval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % encouragingMessages.length);
      }, 6500);

      return () => clearInterval(messageInterval);
    }, [resetState])
  );

  useFocusEffect(
    useCallback(() => {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          if (prev < 40) return prev + 2.2;
          if (prev < 75) return prev + 1.1;
          return prev + 0.6;
        });
      }, 1200);

      return () => clearInterval(progressInterval);
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        setElapsedTime((time) => time + 1);
      }, 1000);

      return () => clearInterval(timer);
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        console.log("App backgrounded, polling continues in context");
      }
    });

    return () => sub.remove();
  }, []);

  const currentMessage = encouragingMessages[messageIndex];
  const roundedProgress = Math.min(99, Math.round(progress));

  const chips = useMemo(
    () =>
      [
        difficulty ? `${capitalize(difficulty)} level` : "",
        quizType ? `${quizType.toUpperCase()}` : "",
        duration ? `${capitalize(duration)} duration` : "",
      ].filter(Boolean),
    [difficulty, quizType, duration]
  );

  return (
    <View style={styles.screen}>
      <View style={styles.bgTop} />
      <View style={styles.bgBottom} />

      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Feather name="loader" size={28} color={colors.white} />
        </View>

        <Text style={styles.title}>Creating Your Quiz</Text>
        <Text style={styles.subtitle}>
          {subject} - {topic}
        </Text>

        {chips.length > 0 && (
          <View style={styles.chipRow}>
            {chips.map((chip) => (
              <View key={chip} style={styles.chip}>
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressPercent}>{roundedProgress}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${roundedProgress}%` }]} />
        </View>

        <View style={styles.messageBox}>
          <Feather
            name={currentMessage.icon}
            size={18}
            color={colors.primaryDark}
            style={styles.messageIcon}
          />
          <Text style={styles.messageText}>{currentMessage.text}</Text>
        </View>

        <Text style={styles.timer}>{elapsedTime}s elapsed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    padding: 22,
    backgroundColor: "#eef4ff",
  },
  bgTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "#d8e7ff",
  },
  bgBottom: {
    position: "absolute",
    bottom: -130,
    left: -90,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#dff6ff",
  },
  card: {
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#d9e4ff",
    shadowColor: "#1f3a8a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 4,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
    marginBottom: 14,
  },
  title: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    color: colors.black,
  },
  subtitle: {
    textAlign: "center",
    marginTop: 6,
    marginBottom: 14,
    color: colors.mutedBlack,
    fontSize: 15,
  },
  chipRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#f3f7ff",
    borderWidth: 1,
    borderColor: "#d8e5ff",
    marginHorizontal: 4,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primaryDark,
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: colors.mutedBlack,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  progressTrack: {
    width: "100%",
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e6ecfa",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#3e7bfa",
  },
  messageBox: {
    marginTop: 18,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#f5f8ff",
    borderWidth: 1,
    borderColor: "#dce7ff",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  messageIcon: {
    marginTop: 1,
    marginRight: 8,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: colors.mutedBlack,
    lineHeight: 20,
  },
  timer: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    color: colors.mutedBlack,
  },
});
