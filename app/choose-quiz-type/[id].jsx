import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { useQuizSession } from "../../contexts/QuizSessionContext";
import { colors } from "../../theme/colors";

const getSubjectName = (subject) => {
  if (typeof subject === "string") return subject;
  if (subject && typeof subject === "object") return String(subject.name || "").trim();
  return "";
};

export default function ChooseQuizType() {
  const { id: quizId } = useLocalSearchParams();
  const resolvedQuizId = Array.isArray(quizId) ? quizId[0] : quizId;
  const router = useRouter();
  const { user } = useAuth();
  const { fetchQuizById, startAttempt } = useQuizSession();

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState("practice");
  const [starting, setStarting] = useState(false);
  const isStartingRef = useRef(false);

  useEffect(() => {
    async function fetchQuiz() {
      if (!resolvedQuizId) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchQuizById(resolvedQuizId);
        setQuizData(data);
      } catch (_err) {
        Alert.alert("Error", "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [resolvedQuizId, fetchQuizById]);

  const handleStartQuiz = async () => {
    if (starting || isStartingRef.current) return;
    if (!resolvedQuizId || !quizData) return;

    isStartingRef.current = true;
    setStarting(true);

    try {
      const attemptId = await startAttempt({
        quizId: resolvedQuizId,
        quizMode: selectedMode,
        userId: user?.id || user?.uid,
        quizData,
      });

      if (!attemptId) return;

      router.replace(`/quiz/${attemptId}`);
    } catch (_err) {
      Alert.alert("Error", "Failed to start quiz");
    } finally {
      isStartingRef.current = false;
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!quizData) {
    return (
      <View style={styles.center}>
        <Text>Quiz not found</Text>
      </View>
    );
  }

  const subjectName = getSubjectName(quizData.subject);
  const classLevel =
    quizData.classLevel ||
    (quizData.subject && typeof quizData.subject === "object"
      ? quizData.subject.classLevel
      : "") ||
    "--";
  const topicName = quizData.topics?.[0]?.name || "--";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose Quiz Mode</Text>

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quiz Settings</Text>

        {/* <View>
        <Text>Subject</Text>
        <Text>{quizData.subject}</Text>
        </View> */}
        <View style={styles.textholder}>
        <Text style={styles.subtitle}>ClassLevel</Text>
        <Text>{classLevel}</Text>
        </View>
        <View style={styles.textholder}>
        <Text style={styles.subtitle}>Subject & Topic</Text>
        <Text>{subjectName || "--"} - {topicName}</Text>
        </View>
        <View style={styles.textholder}>
        <Text style={styles.subtitle}>Question Type</Text>
        <Text>
          {(quizData.quizType || quizData.type || "").toLowerCase() === "mcq"
            ? "Multiple Choice"
            : "Structural Questions"}
        </Text>
        </View>
      </View>

      {/* Mode selection */}
      <Pressable
        style={[
          styles.modeCard,
          selectedMode === "practice" && styles.active,
        ]}
        onPress={() => setSelectedMode("practice")}
      >
        <Feather name="book" size={24} />
        <Text style={styles.modeTitle}>Practice Mode</Text>
        <Text>No timer, hints allowed</Text>
      </Pressable>

      <Pressable
        style={[
          styles.modeCard,
          selectedMode === "exam" && styles.active,
        ]}
        onPress={() => setSelectedMode("exam")}
      >
        <Feather name="award" size={24} />
        <Text style={styles.modeTitle}>Exam Mode</Text>
        <Text>Timed, no hints</Text>
      </Pressable>

      {/* Start */}
      <Pressable
        style={styles.startBtn}
        onPress={handleStartQuiz}
        disabled={starting || !resolvedQuizId || !quizData}
      >
        {starting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.startText}>Start Quiz</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.replace('/arrange-quiz')}>
        <Text style={styles.back}>Change Settings</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    padding: 16,
    backgroundColor: colors.white,
    width: '100%'
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    color: colors.mutedWhite,
    display: 'flex',
    flexDirection: 'column'
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 15
  },
  modeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  active: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.gray
  },
  modeTitle: {
    fontWeight: "bold",
    marginTop: 6,
  },
  startBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: "center",
  },
  startText: {
    color: colors.white,
    fontWeight: "bold",
  },
  back: {
    textAlign: "center",
    marginTop: 16,
    color: colors.secondary,
  },
  textholder:{
    textAlign: 'left',
    marginBottom:5,
  },
  subtitle:{
    color: colors.mutedBlack,
    fontSize: 11
  }
});
