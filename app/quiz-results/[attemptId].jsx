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
import { useAuth } from "../../contexts/AuthContext";
import QuizAction from "../../src/components/QuizAction";
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

export default function QuizResults() {
  const { attemptId } = useLocalSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();

  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!attemptId || !token) return;

    (async () => {
      try {
        const attemptRes = await fetch(
          `${API_BASE_URL}/v2/quiz-attempt/${attemptId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const attemptJson = await attemptRes.json();
        const attemptData = attemptJson.data;

        const quizRes = await fetch(
          `${API_BASE_URL}/v2/quiz/${attemptData.quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const quizJson = await quizRes.json();

        setAttempt(attemptData);
        setQuiz(quizJson.data);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId, token]);

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

  const totalQuestions = attempt.totalQuestions;
  const correctAnswers = attempt.correctAnswers;
  const passed = Number(attempt.score) >= 50;
  const difficulty = quiz?.meta?.difficulty || "easy";
  const quizType = quiz?.quizType || "mcq";

  const getNextConfig = () => {
    if (!passed) return null;

    if (difficulty === "easy") {
      return { difficulty: "medium", quizType: "mcq", duration: "medium" };
    }

    if (difficulty === "medium") {
      return { difficulty: "hard", quizType: "mcq", duration: "long" };
    }

    if (difficulty === "hard" && quizType === "mcq") {
      return { difficulty: "easy", quizType: "saq", duration: "short" };
    }

    if (difficulty === "easy" && quizType === "saq") {
      return { difficulty: "medium", quizType: "saq", duration: "medium" };

    } if (difficulty === "medium" && quizType === "saq") {
      return { difficulty: "hard", quizType: "saq", duration: "long" };
    }

    return null;
  };

  const nextConfig = getNextConfig();



  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Feather name="award" size={48} color={colors.primaryDark} />
        <Text style={styles.title}>Quiz Complete 🎉</Text>
        <Text style={styles.subtitle}>
          Well done {user?.firstName || "champ"}!
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <Stat label="Score" value={`${attempt.score}%`} />
        <Stat label="Correct" value={`${correctAnswers}/${totalQuestions}`} />
        <Stat
          label="Time"
          value={attempt.timeTaken ? formatTime(attempt.timeTaken) : "--"}
        />
      </View>

      {/* Review */}
      <Text style={styles.reviewTitle}>Review Answers</Text>

      {quiz.questions?.map((q, index) => {
        const userAnswer = attempt.answers?.[index]?.answer || "No answer";
        const isCorrect =
          String(userAnswer).trim().toLowerCase() ===
          String(q.answer).trim().toLowerCase();

        return (
          <View
            key={index}
            style={[styles.questionCard, { backgroundColor: isCorrect ? "#e6fffa" : "#fdecea", borderLeftColor: isCorrect ? "#84cc16" : "red", borderLeftWidth: 2 }]}
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

      {/* Actions */}



      <View style={styles.actions}>

        {!passed && (
          <Pressable
            onPress={() => router.push(`/choose-quiz-type/${attempt.quizId}`)}
            style={styles.actionBtn2}
          >
            <QuizAction
              icon={<Feather name='rotate-ccw' size={28} color={colors.white} />}
              title="Practice makes Perfect"
              description="Revise the topic and try again to build your confidence."
            />
          </Pressable>
        )}

        {passed && nextConfig && (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/quiz-generating",
                params: {
                  subject: quiz.subject,
                  topic: quiz.topics?.[0]?.name,
                  subTopics: JSON.stringify(quiz.topics || []),
                  classLevel: quiz.classLevel,
                  quizType: nextConfig.quizType,
                  difficulty: nextConfig.difficulty,
                  duration: nextConfig.duration

                },
              })
            }
            style={styles.actionBtn2}
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
              title="Mastery Achieved 🎉"
              description="You've completed all levels for this topic!"
            />
          </View>
        )}


        <Pressable
          onPress={() =>
            router.push({
              pathname: "/subject-topics",
              params: {
                subject: quiz.subject,
                classLevel: quiz.classLevel,
              },
            })
          }
          style={styles.actionBtn2}
        >
          <QuizAction
            icon={<Feather name='compass' size={28} color={colors.white} />}
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
  actions: { display: 'flex', flexDirection: 'column', height: '5.5%', },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 8 },
  subtitle: { opacity: 0.6 },
  stats: { flexDirection: "row", justifyContent: "space-around", marginBottom: 20 },
  reviewTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  questionCard: { padding: 12, borderRadius: 10, marginBottom: 10 },
  question: { fontWeight: "bold" },
  // actionBtn: { padding: 14, backgroundColor: colors.primaryDark, borderRadius: 10, marginTop: 16 },
  actionBtnText: { color: "#fff", textAlign: "center" },
  actionBtn2: { backgroundColor: colors.secondary, borderRadius: 10, marginTop: 16 },
});
