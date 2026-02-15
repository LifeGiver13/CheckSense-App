import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

const getParamValue = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeSubject = (subjectValue) => {
  if (!subjectValue) return "";
  if (typeof subjectValue === "string") return subjectValue;
  if (typeof subjectValue === "object") return String(subjectValue.name || "");
  return String(subjectValue);
};

const safeParseJSON = (value, fallback = null) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeQuizType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "saq" ? "saq" : "mcq";
};

export default function ChooseQuizType() {
  const params = useLocalSearchParams();
  const quizId = getParamValue(params.id);
  const router = useRouter();
  const { token, user } = useAuth();

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState("practice");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!quizId || !token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    async function fetchQuiz() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/v2/quiz/${quizId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          }
        );

        if (!res.ok) throw new Error("Fetch failed");

        const result = await res.json();

        if (isMounted) {
          setQuizData(result?.data || result);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          Alert.alert("Error", "Failed to load quiz");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchQuiz();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [quizId, token]);


  const normalizedQuizType = normalizeQuizType(
    quizData?.quizType || quizData?.quiztype || quizData?.type || "mcq"
  );

  const summary = useMemo(() => {
    const topics = Array.isArray(quizData?.topics) ? quizData.topics : [];
    return {
      subject: normalizeSubject(quizData?.subject) || "Unknown Subject",
      classLevel: String(quizData?.classLevel || quizData?.subject?.classLevel || "Unknown Class"),
      topic: String(topics[0]?.name || "General"),
      quizType: normalizedQuizType,
    };
  }, [normalizedQuizType, quizData]);

  const handleStartQuiz = async () => {
    if (starting) return;

    const userId = user?.uid || user?.id;

    if (!token || !quizId || !quizData || !userId) {
      Alert.alert("Error", "Missing required quiz data. Please try again.");
      return;
    }

    setStarting(true);

    try {
      const requestPayload = {
        quizId: String(quizId),
        userId: String(userId),
        classLevel: summary.classLevel,
        subject: summary.subject,
        topic: [{ name: summary.topic }],
        quizMode: selectedMode === "exam" ? "exam" : "practice",
        quizType: normalizedQuizType,
      };

      console.log("quiz-attempt request payload:", requestPayload);

      const res = await fetch(`${API_BASE_URL}/v2/quiz-attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const rawResponse = await res.text();
      const result = safeParseJSON(rawResponse, {});

      console.log("quiz-attempt response status:", res.status);
      console.log("quiz-attempt response body:", result);

      if (!res.ok) {
        throw new Error(
          result?.message ||
            result?.error ||
            `Attempt failed (${res.status})`
        );
      }

      const attemptId =
        result?.data?.id ||
        result?.data?._id ||
        result?.data?.attemptId ||
        result?.id ||
        result?._id;

      if (!attemptId) throw new Error("Attempt ID missing from response");

      router.push({
        pathname: "/quiz/[attemptId]",
        params: { attemptId: String(attemptId) },
      });
    } catch (err) {
      Alert.alert("Error", err?.message || "Failed to start quiz");
    } finally {
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose Quiz Mode</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quiz Settings</Text>

        <View style={styles.textholder}>
          <Text style={styles.subtitle}>Class Level</Text>
          <Text>{summary.classLevel}</Text>
        </View>

        <View style={styles.textholder}>
          <Text style={styles.subtitle}>Subject and Topic</Text>
          <Text>
            {summary.subject} - {summary.topic}
          </Text>
        </View>

        <View style={styles.textholder}>
          <Text style={styles.subtitle}>Question Type</Text>
          <Text>{summary.quizType === "mcq" ? "Multiple Choice" : "Structural Questions"}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.modeCard, selectedMode === "practice" && styles.active]}
        onPress={() => setSelectedMode("practice")}
      >
        <Feather name="book" size={24} />
        <Text style={styles.modeTitle}>Practice Mode</Text>
        <Text>No timer, hints allowed</Text>
      </Pressable>

      <Pressable
        style={[styles.modeCard, selectedMode === "exam" && styles.active]}
        onPress={() => setSelectedMode("exam")}
      >
        <Feather name="award" size={24} />
        <Text style={styles.modeTitle}>Exam Mode</Text>
        <Text>Timed, no hints</Text>
      </Pressable>

      <Pressable style={styles.startBtn} onPress={handleStartQuiz} disabled={starting}>
        {starting ? <ActivityIndicator color="#fff" /> : <Text style={styles.startText}>Start Quiz</Text>}
      </Pressable>

      <Pressable onPress={() => router.push("/arrange-quiz")}>
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
    width: "100%",
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
    display: "flex",
    flexDirection: "column",
  },
  cardTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 15,
  },
  modeCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  active: {
    borderColor: colors.primaryDark,
    backgroundColor: colors.gray,
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
  textholder: {
    textAlign: "left",
    marginBottom: 5,
  },
  subtitle: {
    color: colors.mutedBlack,
    fontSize: 11,
  },
});
