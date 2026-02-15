import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import QuizAction from "../../src/components/QuizAction";
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

const getParamValue = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeSubject = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return String(value.name || "");
  return String(value);
};

const normalizeDifficulty = (value, fallback = "easy") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "easy" || normalized === "medium" || normalized === "hard") {
    return normalized;
  }
  return fallback;
};

const normalizeQuizType = (value, fallback = "mcq") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "saq" || normalized === "short_answer" || normalized === "short-answer") {
    return "saq";
  }
  if (normalized === "mcq" || normalized === "multiple_choice" || normalized === "multiple-choice") {
    return "mcq";
  }
  return fallback;
};

const inferQuizTypeFromQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) return "mcq";

  const hasAnyOptions = questions.some(
    (question) => Array.isArray(question?.options) && question.options.length > 0
  );

  return hasAnyOptions ? "mcq" : "saq";
};

const difficultyFromQuestionCount = (count) => {
  const total = Number(count || 0);
  if (total >= 20) return "hard";
  if (total >= 15) return "medium";
  return "easy";
};

const PROGRESSION_STEPS = [
  { quizType: "mcq", difficulty: "easy", duration: "short", label: "MCQ Easy" },
  { quizType: "mcq", difficulty: "medium", duration: "medium", label: "MCQ Medium" },
  { quizType: "mcq", difficulty: "hard", duration: "long", label: "MCQ Hard" },
  { quizType: "saq", difficulty: "easy", duration: "short", label: "Short Answers Easy" },
  { quizType: "saq", difficulty: "medium", duration: "medium", label: "Short Answers Medium" },
  { quizType: "saq", difficulty: "hard", duration: "long", label: "Short Answers Hard" },
];

export default function QuizResults() {
  const params = useLocalSearchParams();
  const attemptId = getParamValue(params.attemptId);

  const router = useRouter();
  const { token, user } = useAuth();

  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId || !token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchResults = async () => {
      try {
        const attemptRes = await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const attemptJson = await attemptRes.json();
        const attemptData = attemptJson?.data || attemptJson;
        const currentQuizId = attemptData?.quizId;

        if (!currentQuizId) throw new Error("Attempt is missing quizId");

        const quizRes = await fetch(`${API_BASE_URL}/v2/quiz/${currentQuizId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const quizJson = await quizRes.json();

        if (!isMounted) return;

        setAttempt(attemptData || null);
        setQuiz(quizJson?.data || quizJson || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log("Results fetch error:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchResults();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [attemptId, token]);

  const questions = Array.isArray(quiz?.questions) ? quiz.questions : [];
  const totalQuestions = Number(attempt?.totalQuestions || questions.length || 0);
  const correctAnswers = Number(attempt?.correctAnswers || 0);
  const score = Number(attempt?.score || 0);
  const passed = score >= 50;

  const currentQuizId = String(attempt?.quizId || "");
  const classLevel = String(quiz?.classLevel || quiz?.subject?.classLevel || "");
  const subjectName = normalizeSubject(quiz?.subject);

  const inferredDifficulty = difficultyFromQuestionCount(totalQuestions);
  const difficulty = normalizeDifficulty(
    quiz?.meta?.difficulty || quiz?.difficulty || attempt?.meta?.difficulty || attempt?.difficulty,
    inferredDifficulty
  );
  const inferredQuizType = inferQuizTypeFromQuestions(questions);
  const quizType = normalizeQuizType(
    quiz?.quizType ||
      quiz?.quiztype ||
      quiz?.type ||
      quiz?.questionType ||
      quiz?.meta?.quizType ||
      attempt?.quizType ||
      attempt?.type ||
      attempt?.questionType,
    inferredQuizType
  );
  const currentStepIndex = useMemo(() => {
    return PROGRESSION_STEPS.findIndex(
      (step) => step.quizType === quizType && step.difficulty === difficulty
    );
  }, [difficulty, quizType]);
  const normalizedCurrentStepIndex =
    currentStepIndex >= 0 ? currentStepIndex : quizType === "saq" ? 3 : 0;

  const currentStep = useMemo(() => {
    const step = PROGRESSION_STEPS[normalizedCurrentStepIndex];
    if (!step) return null;
    return { ...step, index: normalizedCurrentStepIndex };
  }, [normalizedCurrentStepIndex]);

  const nextConfig = useMemo(() => {
    if (!passed) return null;
    if (!currentStep) return null;

    const nextStep = PROGRESSION_STEPS[currentStep.index + 1];
    if (!nextStep) return null;

    return { ...nextStep, index: currentStep.index + 1 };
  }, [currentStep, passed]);

  const currentStepLabel = currentStep
    ? `${currentStep.label} (Step ${currentStep.index + 1}/${PROGRESSION_STEPS.length})`
    : `${quizType.toUpperCase()} ${difficulty.toUpperCase()}`;

  const nextStepLabel = nextConfig
    ? `${nextConfig.label} (Step ${nextConfig.index + 1}/${PROGRESSION_STEPS.length})`
    : "";

  const formatTime = (sec) => {
    const total = Number(sec || 0);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
  };

  const renderQuestionItem = ({ item, index }) => {
    const userAnswer = attempt?.answers?.[index]?.answer || "No answer";

    const isCorrect =
      String(userAnswer).trim().toLowerCase() ===
      String(item.answer || "").trim().toLowerCase();

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
          Q{index + 1}. {item.question}
        </Text>

        <Text style={{ marginTop: 6 }}>
          Your answer: <Text style={{ color: isCorrect ? "green" : "red" }}>{userAnswer}</Text>
        </Text>

        {!isCorrect && (
          <Text style={{ marginTop: 4 }}>
            Correct answer: <Text style={{ color: "green" }}>{item.answer}</Text>
          </Text>
        )}

        {item.explanation && (
          <Text style={{ marginTop: 6, opacity: 0.7 }}>Explanation: {item.explanation}</Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!attempt || !quiz) {
    return (
      <View style={styles.center}>
        <Text>Results not available</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={questions}
      keyExtractor={(_, index) => index.toString()}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Feather name="award" size={48} color={colors.primaryDark} />
            <Text style={styles.title}>Quiz Complete</Text>
            <Text style={styles.subtitle}>Well done {user?.firstName || "champ"}!</Text>
          </View>

          <View style={styles.stats}>
            <Stat label="Score" value={`${score}%`} />
            <Stat label="Correct" value={`${correctAnswers}/${totalQuestions}`} />
            <Stat label="Time" value={attempt.timeTaken ? formatTime(attempt.timeTaken) : "--"} />
          </View>

          <Text style={styles.reviewTitle}>Review Answers</Text>
        </>
      }
      renderItem={renderQuestionItem}
      ListFooterComponent={
        <View style={styles.actions}>
          {!passed && (
            <Pressable
              onPress={() => currentQuizId && router.push(`/choose-quiz-type/${currentQuizId}`)}
              style={styles.actionBtn2}
              disabled={!currentQuizId}
            >
              <QuizAction
                icon={<Feather name="rotate-ccw" size={28} color={colors.white} />}
                title="Practice makes Perfect"
                description={`${currentStepLabel}. Revise and try again to move forward.`}
              />
            </Pressable>
          )}

          {passed && nextConfig && (
            <Pressable
              onPress={() =>
                currentQuizId &&
                router.push({
                  pathname: "/quiz-generating",
                  params: {
                    fromQuizId: currentQuizId,
                    quizType: nextConfig.index >= 3 ? "saq" : nextConfig.quizType,
                    difficulty: nextConfig.difficulty,
                    duration: nextConfig.duration,
                    progressionStep: String(nextConfig.index + 1),
                  },
                })
              }
              style={styles.actionBtn2}
              disabled={!currentQuizId}
            >
              <QuizAction
                icon={<Feather name="arrow-up-circle" size={28} color={colors.white} />}
                title="Continue Practicing"
                description={`${currentStepLabel}. Next: ${nextStepLabel}.`}
              />
            </Pressable>
          )}

          {passed && !nextConfig && (
            <View style={{ marginTop: 16 }}>
              <QuizAction
                icon={<Feather name="check-circle" size={28} color={colors.white} />}
                title="Mastery Achieved"
                description={`${currentStepLabel}. You completed all levels for this topic.`}
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
            disabled={!subjectName || !classLevel}
          >
            <QuizAction
              icon={<Feather name="compass" size={28} color={colors.white} />}
              title="Explore Other Topics"
              description="Discover more topics."
            />
          </Pressable>
        </View>
      }
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews
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
  actions: { marginTop: 10 },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 8 },
  subtitle: { opacity: 0.6 },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  reviewTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  questionCard: { padding: 12, borderRadius: 10, marginBottom: 10 },
  question: { fontWeight: "bold" },
  actionBtn2: { backgroundColor: colors.secondary, borderRadius: 10, marginTop: 16 },
});
