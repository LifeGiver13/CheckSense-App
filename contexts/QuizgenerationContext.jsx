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

const QuizGenerationContext = createContext(null);

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

  const removePendingQuiz = useCallback((id) => {
    setPendingQuizzes((prev) => prev.filter((q) => q.id !== id));

    if (pollingIntervals.current[id]) {
      clearInterval(pollingIntervals.current[id]);
      delete pollingIntervals.current[id];
    }
  }, []);

  const pollQuizStatus = useCallback(
    async (quiz) => {
      try {
        const response = await fetch(`${API_BASE_URL}/v2/quiz/${quiz.id}`);
        if (!response.ok) return;

        const result = await response.json();
        const data = result.data || result;

        if (data.status === "published") {
          Alert.alert(
            "Quiz Ready 🎉",
            `${quiz.subject} - ${quiz.topic}`,
            [
              {
                text: "Start Quiz",
                onPress: () =>
                  router.push(`/choose-quiz-type/${quiz.id}`),
              },
            ]
          );
          removePendingQuiz(quiz.id);
        }

        if (data.status === "failed") {
          Alert.alert(
            "Quiz Failed ❌",
            `${quiz.subject} - ${quiz.topic}`
          );
          removePendingQuiz(quiz.id);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    },
    [removePendingQuiz, router]
  );

  const addPendingQuiz = useCallback(
    (quiz) => {
      const newQuiz = { ...quiz, status: "draft" };
      setPendingQuizzes((prev) => [...prev, newQuiz]);

      const interval = setInterval(() => {
        pollQuizStatus(newQuiz);
      }, 5000);

      pollingIntervals.current[quiz.id] = interval;

      setTimeout(() => {
        if (pollingIntervals.current[quiz.id]) {
          clearInterval(pollingIntervals.current[quiz.id]);
          delete pollingIntervals.current[quiz.id];
        }
      }, 180000);
    },
    [pollQuizStatus]
  );

  useEffect(() => {
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval);
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
