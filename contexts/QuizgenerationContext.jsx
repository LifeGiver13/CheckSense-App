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
const MAX_SUBTOPICS_PER_TOPIC = 30;

export const useQuizGeneration = () => {
  const context = useContext(QuizGenerationContext);
  if (!context) {
    throw new Error("useQuizGeneration must be used within QuizGenerationProvider");
  }
  return context;
};

export function QuizGenerationProvider({ children }) {
  const { user } = useAuth();
  const router = useRouter();

  const [pendingQuizzes, setPendingQuizzes] = useState([]);
  const [currentQuizConfig, setCurrentQuizConfig] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const pollingIntervals = useRef({});
  const isCreatingRef = useRef(false);

  const setQuizConfig = useCallback((config) => {
    setCurrentQuizConfig(config);
  }, []);

  const clearQuizConfig = useCallback(() => {
    setCurrentQuizConfig(null);
  }, []);

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
          Alert.alert("Quiz Ready", `${quiz.subject} - ${quiz.topic}`, [
            {
              text: "Start Quiz",
              onPress: () => router.replace(`/choose-quiz-type/${quiz.id}`),
            },
          ]);
          removePendingQuiz(quiz.id);
        }

        if (data.status === "failed") {
          Alert.alert("Quiz Failed", `${quiz.subject} - ${quiz.topic}`);
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

  const normalizeTopics = useCallback((topics = []) => {
    return topics
      .map((topic) => {
        const rawSubtopics = Array.isArray(topic?.subtopic)
          ? topic.subtopic
          : Array.isArray(topic?.subtopics)
            ? topic.subtopics
            : [];

        const subtopic = rawSubtopics
          .map((subtopic) =>
            typeof subtopic === "string"
              ? { name: subtopic, description: "" }
              : {
                  name: subtopic?.name || "",
                  description: subtopic?.description || "",
                }
          )
          .filter((item) => item.name)
          .slice(0, MAX_SUBTOPICS_PER_TOPIC);

        return {
          name: String(topic?.name || "").trim(),
          description: String(topic?.description || "").trim(),
          subtopic,
        };
      })
      .filter((topic) => topic.name);
  }, []);

  const normalizeSubjectName = useCallback((subject) => {
    if (typeof subject === "string") return subject.trim();
    if (subject && typeof subject === "object") {
      return String(subject.name || "").trim();
    }
    return "";
  }, []);

  const normalizeClassLevel = useCallback((classLevel, subject) => {
    const direct = String(classLevel || "").trim();
    if (direct) return direct;

    if (subject && typeof subject === "object") {
      return String(subject.classLevel || "").trim();
    }

    return "";
  }, []);

  const createQuiz = useCallback(async () => {
    if (isCreatingRef.current || !currentQuizConfig) return null;

    const userId = user?.id || user?.uid;
    if (!userId) return null;

    isCreatingRef.current = true;
    setIsCreating(true);

    try {
      const {
        subject,
        topic,
        topics = [],
        duration = "short",
        quizType = "mcq",
        classLevel,
        difficulty = "easy",
      } = currentQuizConfig;
      const topicList = Array.isArray(topics) ? topics : [];
      const subjectName = normalizeSubjectName(subject);
      const resolvedClassLevel = normalizeClassLevel(classLevel, subject);

      if (!subjectName || !resolvedClassLevel || topicList.length === 0) {
        return null;
      }

      const durationMap = { short: 7, medium: 15, long: 20 };
      const totalQuestions = durationMap[duration] || 7;

      const payload = {
        subject: { name: subjectName, classLevel: resolvedClassLevel },
        topics: normalizeTopics(topicList),
        totalQuestions,
        meta: { difficulty, userId },
        quizType,
      };

      if (payload.topics.length === 0) {
        return null;
      }

      const res = await fetch(`${API_BASE_URL}/v2/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      const quizId = json?.id || json?.data?.id;

      if (res.ok && quizId) {
        addPendingQuiz({
          id: quizId,
          subject: subjectName,
          topic:
            (typeof topic === "string" ? topic : topic?.name) ||
            payload.topics[0]?.name ||
            subjectName,
        });
        clearQuizConfig();
        return quizId;
      }

      return null;
    } catch (err) {
      console.error("Quiz creation error:", err);
      return null;
    } finally {
      isCreatingRef.current = false;
      setIsCreating(false);
    }
  }, [
    currentQuizConfig,
    user,
    addPendingQuiz,
    clearQuizConfig,
    normalizeTopics,
    normalizeSubjectName,
    normalizeClassLevel,
  ]);

  useEffect(() => {
    return () => {
      Object.values(pollingIntervals.current).forEach(clearInterval);
    };
  }, []);

  return (
    <QuizGenerationContext.Provider
      value={{
        pendingQuizzes,
        currentQuizConfig,
        createQuiz,
        isCreating,
        setQuizConfig,
        clearQuizConfig,
        addPendingQuiz,
        removePendingQuiz,
      }}
    >
      {children}
    </QuizGenerationContext.Provider>
  );
}
