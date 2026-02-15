import { useRouter } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { API_BASE_URL } from "../theme/constants";
import { useAuth } from "./AuthContext";

const QuizGenerationContext = createContext(null);
const POLLING_INTERVAL_MS = 8000;
const POLLING_TIMEOUT_MS = 10 * 60 * 1000;

export const useQuizGeneration = () => {
  const context = useContext(QuizGenerationContext);
  if (!context) {
    throw new Error("useQuizGeneration must be used within QuizGenerationProvider");
  }
  return context;
};

export function QuizGenerationProvider({ children }) {
  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const pollingIntervals = useRef({});
  const router = useRouter();
  const { token } = useAuth();

  const removePendingQuiz = useCallback((quizId) => {
    if (!quizId) return;

    setPendingQuizzes((prev) => prev.filter((q) => q.id !== quizId));

    if (pollingIntervals.current[quizId]) {
      clearInterval(pollingIntervals.current[quizId]);
      delete pollingIntervals.current[quizId];
    }
  }, []);

  const pollQuizStatus = useCallback(
    async (quiz) => {
      if (!quiz?.id) return;

      try {
        const response = await fetch(`${API_BASE_URL}/v2/quiz/${quiz.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            removePendingQuiz(quiz.id);
          }
          return;
        }

        const result = await response.json();
        const data = result?.data || result;

        if (data?.status === "published") {
          Alert.alert("Quiz Ready", `${quiz.subject} - ${quiz.topic}`, [
            {
              text: "Start Quiz",
              onPress: () => router.push(`/choose-quiz-type/${quiz.id}`),
            },
          ]);
          removePendingQuiz(quiz.id);
        }

        if (data?.status === "failed") {
          Alert.alert("Quiz Failed", `${quiz.subject} - ${quiz.topic}`);
          removePendingQuiz(quiz.id);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    },
    [removePendingQuiz, router, token]
  );

  const addPendingQuiz = useCallback(
    (quiz) => {
      if (!quiz?.id) return;

      const newQuiz = { ...quiz, status: "draft" };

      setPendingQuizzes((prev) => {
        const exists = prev.some((q) => q.id === newQuiz.id);
        if (exists) return prev;
        return [...prev, newQuiz];
      });

      if (pollingIntervals.current[newQuiz.id]) {
        clearInterval(pollingIntervals.current[newQuiz.id]);
      }

      const interval = setInterval(() => {
        pollQuizStatus(newQuiz);
      }, POLLING_INTERVAL_MS);

      pollingIntervals.current[newQuiz.id] = interval;

      pollQuizStatus(newQuiz);

      setTimeout(() => {
        if (pollingIntervals.current[newQuiz.id]) {
          clearInterval(pollingIntervals.current[newQuiz.id]);
          delete pollingIntervals.current[newQuiz.id];
          Alert.alert(
            "Still generating",
            "Your quiz is taking longer than expected. You can check again from Quizzes shortly."
          );
        }
      }, POLLING_TIMEOUT_MS);
    },
    [pollQuizStatus]
  );

  useEffect(() => {
    const intervalsRef = pollingIntervals.current;
    return () => {
      Object.values(intervalsRef).forEach(clearInterval);
    };
  }, []);

  return (
    <QuizGenerationContext.Provider
      value={{ pendingQuizzes, addPendingQuiz, removePendingQuiz }}
    >
      {children}
    </QuizGenerationContext.Provider>
  );
}
