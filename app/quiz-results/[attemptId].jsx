import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useLevelProgress } from "../../contexts/LevelProgressContext";
import { useQuizSession } from "../../contexts/QuizSessionContext";
import QuizAction from "../../src/components/QuizAction";
import { colors } from "../../theme/colors";

const getSubjectName = (subject) => {
  if (typeof subject === "string") return subject;
  if (subject && typeof subject === "object") return String(subject.name || "").trim();
  return "";
};

export default function QuizResults() {
  const router = useRouter();
  const { attemptId } = useLocalSearchParams();
  const resolvedAttemptId = Array.isArray(attemptId) ? attemptId[0] : attemptId;
  const { user } = useAuth();
  const { isLevelingUp, continueLevelUp, getNextLevelFromSession } = useLevelProgress();
  const { attempt, quiz, loading, loadSession, currentConfig } = useQuizSession();

  useEffect(() => {
    if (!resolvedAttemptId) return;

    const needsLoad = !attempt || String(attempt.id) !== String(resolvedAttemptId);
    if (needsLoad) {
      loadSession(resolvedAttemptId);
    }
  }, [resolvedAttemptId, attempt, loadSession]);

  const isCurrentAttemptLoaded =
    !!attempt && String(attempt.id) === String(resolvedAttemptId);

  if (loading || !attempt || !quiz || !isCurrentAttemptLoaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
        <Text style={{ marginTop: 12 }}>Loading results...</Text>
      </View>
    );
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const totalQuestions = attempt.totalQuestions || questions.length || 0;
  const correctAnswers = attempt.correctAnswers || 0;
  const passed = Number(attempt.score) >= 50;
  const nextConfig = getNextLevelFromSession({
    attempt,
    quiz,
    currentConfig,
    passed,
  });

  const subjectName = getSubjectName(quiz.subject) || getSubjectName(attempt.subject) || "";
  const classLevel =
    quiz.classLevel ||
    (quiz.subject && typeof quiz.subject === "object" ? quiz.subject.classLevel : "") ||
    attempt.classLevel ||
    "";

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
  };

  const handleLevelUp = async () => {
    if (!nextConfig) return;

    const result = await continueLevelUp({
      attempt,
      quiz,
      currentConfig,
      passed,
    });

    if (result.ok) {
      router.push("/quiz-generating");
      return;
    }

    if (result.error) {
      Alert.alert("Error", result.error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Feather name="award" size={48} color={colors.primaryDark} />
        <Text style={styles.title}>Quiz Complete</Text>
        <Text style={styles.subtitle}>
          Well done {user?.firstName || "champ"}!
        </Text>
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
      {questions.map((q, index) => {
        const userAnswer = attempt.answers?.[index]?.answer || "No answer";
        const isCorrect =
          String(userAnswer).trim().toLowerCase() ===
          String(q.answer).trim().toLowerCase();

        return (
          <View
            key={index}
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
              Q{index + 1}. {q.question}
            </Text>

            <Text style={{ marginTop: 6 }}>
              Your answer:{" "}
              <Text style={{ color: isCorrect ? "green" : "red" }}>
                {userAnswer}
              </Text>
            </Text>

            {!isCorrect && (
              <Text style={{ marginTop: 4 }}>
                Correct answer: <Text style={{ color: "green" }}>{q.answer}</Text>
              </Text>
            )}

            {q.explanation && (
              <Text style={{ marginTop: 6, opacity: 0.7 }}>
                Explanation: {q.explanation}
              </Text>
            )}
          </View>
        );
      })}

      {questions.length === 0 && (
        <View style={styles.questionCard}>
          <Text>No question review is available for this quiz.</Text>
        </View>
      )}

      <View style={styles.actions}>
        {!passed && (
          <Pressable
            onPress={() => router.push(`/choose-quiz-type/${attempt.quizId}`)}
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
          onPress={() =>
            router.push({
              pathname: "/subject-topics",
              params: {
                subject: subjectName,
                classLevel,
              },
            })
          }
          style={styles.actionBtn2}
        >
          <QuizAction
            icon={<Feather name="compass" size={28} color={colors.white} />}
            title="Explore Other Topics"
            description="Discover more topics."
          />
        </Pressable>
      </View>
    </ScrollView>
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
