import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../../contexts/AuthContext";
import { colors } from "../../../theme/colors";
import { API_BASE_URL } from "../../../theme/constants";

export default function QuizResults() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { id } = useLocalSearchParams();
  const attemptId = Array.isArray(id) ? id[0] : id;

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

    const fetchData = async () => {
      try {
        const attemptRes = await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const attemptJson = await attemptRes.json();
        const attemptData = attemptJson?.data || attemptJson;

        if (!attemptData?.quizId) throw new Error("Attempt missing quizId");

        const quizRes = await fetch(`${API_BASE_URL}/v2/quiz/${attemptData.quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        const quizJson = await quizRes.json();

        if (!isMounted) return;

        setAttempt(attemptData || null);
        setQuiz(quizJson?.data || quizJson || null);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [attemptId, token]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryDark} />
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

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  const totalQuestions = attempt.totalQuestions || questions.length || 0;
  const correctAnswers = attempt.correctAnswers || 0;

  const formatTime = (sec) => {
    const m = Math.floor(Number(sec || 0) / 60);
    const s = Number(sec || 0) % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Feather name="award" size={48} color={colors.primaryDark} />
        <Text style={styles.title}>Quiz Complete</Text>
        <Text style={styles.subtitle}>Don&apos;t Give Up! {user?.firstName || "champ"}!</Text>
      </View>

      <View style={styles.stats}>
        <Stat label="Score" value={`${attempt.score}%`} />
        <Stat label="Correct" value={`${correctAnswers}/${totalQuestions}`} />
        <Stat label="Time" value={attempt.timeTaken ? formatTime(attempt.timeTaken) : "--"} />
      </View>

      <Text style={styles.reviewTitle}>Review Answers</Text>

      {questions.map((q, index) => {
        const userAnswer = attempt.answers?.[index]?.answer || "No answer";
        const isCorrect =
          String(userAnswer).trim().toLowerCase() ===
          String(q.answer || "").trim().toLowerCase();

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
              Your answer: <Text style={{ color: isCorrect ? "green" : "red" }}>{userAnswer}</Text>
            </Text>
            {!isCorrect && (
              <Text style={{ marginTop: 4 }}>
                Correct answer: <Text style={{ color: "green" }}>{q.answer}</Text>
              </Text>
            )}
            {q.explanation && (
              <Text style={{ marginTop: 6, opacity: 0.7 }}>Explanation: {q.explanation}</Text>
            )}
          </View>
        );
      })}

      <Pressable onPress={() => router.replace("/quizzes")} style={styles.actionBtn2}>
        <Text style={{ textAlign: "center", opacity: 0.6 }}>Back to Quizzes</Text>
      </Pressable>
      <Pressable onPress={() => router.replace("/arrange-quiz")} style={styles.actionBtn}>
        <Text style={styles.actionBtnText}>Take Another Quiz</Text>
      </Pressable>
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
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 8 },
  subtitle: { opacity: 0.6 },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  reviewTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  questionCard: { padding: 12, borderRadius: 10, marginBottom: 10 },
  question: { fontWeight: "bold" },
  actionBtn: { padding: 14, backgroundColor: colors.primaryDark, borderRadius: 10, marginTop: 16 },
  actionBtn2: {
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: 10,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.mutedBlack,
  },
  actionBtnText: { color: "#fff", textAlign: "center" },
});
