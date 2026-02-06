import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

export default function ChooseQuizType() {
  const { id: quizId } = useLocalSearchParams();
  const router = useRouter();
  const { token, user } = useAuth();

  const [quizData, setQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState("practice");
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function fetchQuiz() {
      if (!quizId || !token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/v2/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Fetch failed");

        const result = await res.json();
        setQuizData(result.data);
      } catch (err) {
        Alert.alert("Error", "Failed to load quiz");
      } finally {
        setLoading(false);
      }
    }

    fetchQuiz();
  }, [quizId, token]);

  const handleStartQuiz = async () => {
    setStarting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/v2/quiz-attempt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizId,
          userId: user.uid,
          classLevel: quizData.classLevel,
          subject: quizData.subject,
          topic: quizData.topics,
          quizMode: selectedMode,
          quizType: quizData.type === "mcq" ? "mcq" : "saq",
        }),
      });

      if (!res.ok) throw new Error("Attempt failed");

      const result = await res.json();
      const attemptId = result.data?.id || result.id;

      router.push(`/quiz/${attemptId}`);
    } catch (err) {
      Alert.alert("Error", "Failed to start quiz");
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

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quiz Settings</Text>

        {/* <View>
        <Text>Subject</Text>
        <Text>{quizData.subject}</Text>
        </View> */}
        <View style={styles.textholder}>
        <Text style={styles.subtitle}>ClassLevel</Text>
        <Text>{quizData.classLevel}</Text>
        </View>
        <View style={styles.textholder}>
        <Text style={styles.subtitle}>Subject & Topic</Text>
        <Text>{quizData.subject} - {quizData.topics[0]?.name} </Text>
        </View>
        <View style={styles.textholder}>
        <Text style={styles.subtitle}>Question Type</Text>
        <Text>
          {quizData.quiztype === "mcq"
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
        disabled={starting}
      >
        {starting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.startText}>Start Quiz</Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/arrange-quiz')}>
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
