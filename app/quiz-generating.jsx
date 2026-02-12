import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, StyleSheet, Text, View } from "react-native";

import { useQuizGeneration } from "../contexts/QuizgenerationContext";
import { colors } from "../theme/colors";
import { API_BASE_URL } from "../theme/constants";

const encouragingMessages = [
  { icon: "activity", text: "Crafting challenging questions just for you..." },
  { icon: "book-open", text: "Selecting the best content from your topics..." },
  { icon: "award", text: "Adding a touch of magic to your quiz..." },
  { icon: "coffee", text: "Great things take time. Almost there..." },
];

export default function QuizGenerating() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addPendingQuiz } = useQuizGeneration();

  const {
    subject,
    topic,
    subTopics,
    duration = "short",
    quizType = "mcq",
    classLevel,
  } = params;

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userId, setUserId] = useState(null);

  const durationMap = { short: 7, medium: 15, long: 20 };
  const totalQuestions = durationMap[duration] || 7;

  const [quizCreated, setQuizCreated] = useState(false);

  //   for reset
    const resetState = () => {
    setProgress(0);
    setMessageIndex(0);
    setElapsedTime(0);
    };

  /* Rotate messages */
    useFocusEffect(
    useCallback(() => {
        resetState();

        const messageInterval = setInterval(() => {
        setMessageIndex((p) => (p + 1) % encouragingMessages.length);
        }, 8000);

        return () => clearInterval(messageInterval);
    }, [])
    );


  /* Fake progress */
    useFocusEffect(
    useCallback(() => {
        const progressInterval = setInterval(() => {
        setProgress((p) =>
            p >= 95 ? p : p + (p < 50 ? 2 : p < 80 ? 1 : 0.5)
        );
        }, 1500);

        return () => clearInterval(progressInterval);
    }, [])
    );


  /* Timer */
    useFocusEffect(
    useCallback(() => {
        const timer = setInterval(() => {
        setElapsedTime((t) => t + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [])
    );


  /* Load user */
  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("auth_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserId(parsed.uid || parsed.userId);
      }
    })();
  }, []);

  useEffect(() => {
  if (!subject || !topic || !subTopics || !userId || quizCreated) return;

  (async () => {
    try {
      const payload = {
        subject: { name: subject, classLevel },
        topics: JSON.parse(subTopics),
        totalQuestions,
        meta: { difficulty: 'easy', userId },
        quizType,
      };

      const res = await fetch(`${API_BASE_URL}/v2/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok && json?.id) {
        addPendingQuiz({ id: json.id, subject, topic });
        setQuizCreated(true); 
      }
    } catch (err) {
      console.error("Quiz creation error:", err);
    }
  })();
}, [subject, topic, subTopics, userId, quizCreated]);

  /* Background handling */
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        console.log("App backgrounded, polling continues in context");
      }
    });

    return () => sub.remove();
  }, []);

  const currentMessage = encouragingMessages[messageIndex];



  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.white }}>
      <View style={{ backgroundColor: "#fff", borderRadius: 12, padding: 24, alignItems: "center", borderWidth: 2, borderColor: colors.primaryDark }}>
        <Feather name="loader" size={48} color="#0a84ff" />
        <Feather name={currentMessage.icon} size={32} color="#0a84ff" style={{ marginVertical: 8 }} />

        <Text style={{ fontSize: 22 }}>Creating Your Quiz</Text>
        <Text style={{ opacity: 0.6, marginBottom: 12 }}>
          {subject} — {topic}
        </Text>

        <Text>{Math.round(progress)}% complete</Text>
        <Text style={{ textAlign: "center", marginVertical: 8 }}>
          {currentMessage.text}
        </Text>

        <Text style={{ fontSize: 12, opacity: 0.6 }}>
          {elapsedTime}s elapsed
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: colors.white },
  info: {
    flexDirection: 'column',
  },
  avatar: {
    backgroundColor: colors.secondary,
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
  },
})