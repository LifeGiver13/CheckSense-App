import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { useLevelProgress } from "../../contexts/LevelProgressContext";
import { useQuizSession } from "../../contexts/QuizSessionContext";
import QuizAction from "../../src/components/QuizAction";
import { colors } from "../../theme/colors";

const toPlainText = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    return String(
      value.text || value.label || value.name || value.value || value.answer || ""
    ).trim();
  }
  return "";
};

const getQuestionText = (question = {}) =>
  toPlainText(question?.question || question?.prompt || question?.text);

const getQuestionAnswer = (question = {}) =>
  toPlainText(
    question?.answer ??
      question?.correctAnswer ??
      question?.correct_option ??
      question?.correct
  );

const getQuestionExplanation = (question = {}) =>
  toPlainText(question?.explanation || question?.reason);

export default function QuizResults() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams();
  const resolvedAttemptId = Array.isArray(attemptId) ? attemptId[0] : attemptId;
  const { user } = useAuth();
  const { isLevelingUp, continueLevelUp, getNextLevelFromSession } = useLevelProgress();
  const { attempt, quiz, loading, loadSession, currentConfig } = useQuizSession();
  const isNavigatingRef = useRef(false);
  const navigationLockTimeoutRef = useRef(null);

  const releaseNavigationLock = useCallback(() => {
    if (navigationLockTimeoutRef.current) {
      clearTimeout(navigationLockTimeoutRef.current);
      navigationLockTimeoutRef.current = null;
    }
    isNavigatingRef.current = false;
  }, []);

  const acquireNavigationLock = useCallback(() => {
    if (isNavigatingRef.current) return false;
    isNavigatingRef.current = true;
    navigationLockTimeoutRef.current = setTimeout(() => {
      isNavigatingRef.current = false;
      navigationLockTimeoutRef.current = null;
    }, 1500);
    return true;
  }, []);

  useFocusEffect(
    useCallback(() => {
      releaseNavigationLock();
      return () => {
        releaseNavigationLock();
      };
    }, [releaseNavigationLock])
  );

  useFocusEffect(
    useCallback(() => {
      if (resolvedAttemptId) {
        loadSession(resolvedAttemptId);
      }
    }, [resolvedAttemptId, loadSession])
  );

  const isCurrentAttemptLoaded =
    !!attempt && String(attempt.id) === String(resolvedAttemptId);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={{ marginTop: 12 }}>Loading results...</Text>
      </View>
    );
  }

  if (!resolvedAttemptId || !attempt || !quiz || !isCurrentAttemptLoaded) {
    return (
      <View style={styles.center}>
        <Text>Failed to load quiz results.</Text>
        <Pressable
          style={[styles.actionBtn2, { marginTop: 12, padding: 12 }]}
          onPress={() => resolvedAttemptId && loadSession(resolvedAttemptId)}
        >
          <Text style={{ color: colors.white, textAlign: "center", fontWeight: "600" }}>
            Retry
          </Text>
        </Pressable>
      </View>
    );
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const questionItems = questions.map((question, index) => ({
    question,
    index,
    key: `${question?.id || "q"}-${index}`,
  }));
  const totalQuestions = attempt.totalQuestions || questions.length || 0;
  const correctAnswers = attempt.correctAnswers || 0;
  const passed = Number(attempt.score) >= 50;
  const nextConfig = getNextLevelFromSession({
    attempt,
    quiz,
    currentConfig,
    passed,
  });

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
  };

  const handleLevelUp = async () => {
    if (!nextConfig || isLevelingUp) return;
    if (!acquireNavigationLock()) return;

    const result = await continueLevelUp({
      attempt,
      quiz,
      currentConfig,
      passed,
    });

    if (result.ok) {
      try {
        router.replace("/quiz-generating");
      } catch (_err) {
        releaseNavigationLock();
        Alert.alert("Error", "Failed to open quiz generation.");
      }
      return;
    }

    releaseNavigationLock();
    if (result.error) {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <FlatList
      data={questionItems}
      keyExtractor={(item) => item.key}
      contentContainerStyle={styles.container}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={7}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Feather name="award" size={48} color={colors.primaryDark} />
            <Text style={styles.title}>Quiz Complete</Text>
            <Text style={styles.subtitle}>Well done {user?.firstName || "champ"}!</Text>
          </View>

          <View style={styles.stats}>
            <Stat label="Score" value={`${attempt.score}%`} />
            <Stat label="Correct" value={`${correctAnswers}/${totalQuestions}`} />
            <Stat
              label="Time"
              value={attempt.timeTaken ? formatTime(attempt.timeTaken) : "--"}
            />
          </View>

          <Text style={styles.reviewTitle}>Review Answers</Text>
        </>
      }
      ListEmptyComponent={
        <View style={styles.questionCard}>
          <Text>No question review is available for this quiz.</Text>
        </View>
      }
      renderItem={({ item }) => {
        const questionText = getQuestionText(item.question) || "Question";
        const correctAnswer = getQuestionAnswer(item.question);
        const explanation = getQuestionExplanation(item.question);
        const userAnswer = toPlainText(attempt.answers?.[item.index]?.answer) || "No answer";
        const isCorrect =
          String(userAnswer).trim().toLowerCase() ===
          String(correctAnswer).trim().toLowerCase();

        return (
          <View
            style={[
              styles.questionCard,
              {
                backgroundColor: isCorrect ? "#e6fffa" : "#fdecea",
                borderLeftColor: isCorrect ? "#84cc16" : "red",
                borderLeftWidth: 2,
              },
            ]}
          >
            <Text style={styles.question}>
              Q{item.index + 1}. {questionText}
            </Text>

            <Text style={{ marginTop: 6 }}>
              Your answer:{" "}
              <Text style={{ color: isCorrect ? "green" : "red" }}>{userAnswer}</Text>
            </Text>

            {!isCorrect && (
              <Text style={{ marginTop: 4 }}>
                Correct answer: <Text style={{ color: "green" }}>{correctAnswer || "--"}</Text>
              </Text>
            )}

            {explanation && (
              <Text style={{ marginTop: 6, opacity: 0.7 }}>Explanation: {explanation}</Text>
            )}
          </View>
        );
      }}
      ListFooterComponent={
        <View style={styles.actions}>
          {!passed && (
            <Pressable
              onPress={() => {
                if (!acquireNavigationLock()) return;
                const quizId = String(attempt?.quizId || quiz?.id || "").trim();
                if (!quizId) {
                  releaseNavigationLock();
                  Alert.alert("Error", "This quiz cannot be retaken right now.");
                  return;
                }

                try {
                  router.push(`/choose-quiz-type/${quizId}`);
                } catch (_err) {
                  releaseNavigationLock();
                  Alert.alert("Error", "Failed to open quiz type.");
                }
              }}
              style={styles.actionBtn2}
            >
              <QuizAction
                icon={<Feather name="rotate-ccw" size={28} color={colors.white} />}
                title="Practice makes Perfect"
                description="Revise the topic and try again to build your confidence."
              />
            </Pressable>
          )}

          {passed && nextConfig && (
            <Pressable
              onPress={handleLevelUp}
              disabled={isLevelingUp}
              style={[styles.actionBtn2, isLevelingUp && { opacity: 0.7 }]}
            >
              <QuizAction
                icon={<Feather name="arrow-up-circle" size={28} color={colors.white} />}
                title="Continue Practicing"
                description={`Level up to ${nextConfig.difficulty.toUpperCase()}!`}
              />
            </Pressable>
          )}

          {passed && !nextConfig && (
            <View style={{ marginTop: 16 }}>
              <QuizAction
                icon={<Feather name="check-circle" size={28} color={colors.white} />}
                title="Mastery Achieved"
                description="You've completed all levels for this topic!"
              />
            </View>
          )}

          <Pressable
            onPress={() => {
              if (!acquireNavigationLock()) return;
              const subjectId = String(
                quiz?.subjectId ||
                  attempt?.subjectId ||
                  quiz?.subject?.id ||
                  attempt?.subject?.id ||
                  ""
              ).trim();
              const attemptIdValue = String(resolvedAttemptId || attempt?.id || "").trim();

              try {
                router.push({
                  pathname: "/subject-topics",
                  params: {
                    ...(subjectId ? { subjectId } : {}),
                    ...(attemptIdValue ? { attemptId: attemptIdValue } : {}),
                  },
                });
              } catch (_err) {
                releaseNavigationLock();
                Alert.alert("Error", "Failed to open topics.");
              }
            }}
            style={styles.actionBtn2}
          >
            <QuizAction
              icon={<Feather name="compass" size={28} color={colors.white} />}
              title="Explore Other Topics"
              description="Discover more topics."
            />
          </Pressable>
        </View>
      }
    />
  );
}

function Stat({ label, value }) {
  return (
    <View style={{ alignItems: "center" }}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>{value}</Text>
      <Text style={{ opacity: 0.6 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.white },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  actions: { flexDirection: "column" },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 8 },
  subtitle: { opacity: 0.6 },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  reviewTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  questionCard: { padding: 12, borderRadius: 10, marginBottom: 10 },
  question: { fontWeight: "bold" },
  actionBtn2: { backgroundColor: colors.secondary, borderRadius: 10, marginTop: 16 },
});
