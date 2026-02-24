import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";
import { API_BASE_URL } from "../theme/constants";
import { useAuth } from "./AuthContext";

const QuizSessionContext = createContext(null);

const normalizeTopics = (topics = []) => {
  if (!Array.isArray(topics)) return [];

  return topics
    .map((topic) => {
      if (typeof topic === "string") {
        return { name: topic, description: "", subtopic: [] };
      }

      const rawSubtopics = topic?.subtopic || topic?.subtopics || [];
      const subtopic = Array.isArray(rawSubtopics)
        ? rawSubtopics
            .map((st) =>
              typeof st === "string"
                ? { name: st, description: "" }
                : {
                    name: st?.name || "",
                    description: st?.description || "",
                  }
            )
            .filter((st) => st.name)
        : [];

      return {
        name: topic?.name || "",
        description: topic?.description || "",
        subtopic,
      };
    })
    .filter((topic) => topic.name);
};

const inferDuration = (questionCount) => {
  if (questionCount >= 18) return "long";
  if (questionCount >= 10) return "medium";
  return "short";
};

const normalizeText = (value) =>
  String(value ?? "").trim().toLowerCase();

const toPlainText = (value) => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object") {
    return String(
      value.text || value.label || value.name || value.value || value.answer || ""
    ).trim();
  }
  return "";
};

const getQuestionText = (question = {}) =>
  toPlainText(question?.question || question?.prompt || question?.text);

const getQuestionAnswer = (question = {}) =>
  toPlainText(
    question?.answer ??
      question?.correctAnswer ??
      question?.correct_option ??
      question?.correct
  );

const getSubjectName = (subject) => {
  if (typeof subject === "string") return subject;
  if (subject && typeof subject === "object") {
    return String(subject.name || "").trim();
  }
  return "";
};

const getClassLevel = ({ classLevel, subject } = {}) => {
  const direct = String(classLevel || "").trim();
  if (direct) return direct;

  if (subject && typeof subject === "object") {
    return String(subject.classLevel || "").trim();
  }

  return "";
};

const normalizeDifficulty = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return ["easy", "medium", "hard"].includes(normalized) ? normalized : "";
};

const parseMetaObject = (value) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_err) {
    return null;
  }
};

export const useQuizSession = () => {
  const context = useContext(QuizSessionContext);
  if (!context) {
    throw new Error("useQuizSession must be used inside QuizSessionProvider");
  }
  return context;
};

export function QuizSessionProvider({ children }) {
  const { token, user } = useAuth();

  const [attempt, setAttempt] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [revealedHints, setRevealedHints] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const attemptCacheRef = useRef({});
  const quizCacheRef = useRef({});
  const hasAutoSubmitted = useRef(false);
  const activeLoadRequestRef = useRef(0);

  const isExamMode = attempt?.quizMode === "exam";

  const fetchAttemptById = useCallback(
    async (attemptId, options = {}) => {
      const { force = false } = options;
      if (!attemptId || !token) return null;

      if (!force && attemptCacheRef.current[attemptId]) {
        return attemptCacheRef.current[attemptId];
      }

      const res = await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch attempt");
      }

      const json = await res.json();
      const data = json?.data || null;

      if (data?.id) {
        attemptCacheRef.current[data.id] = data;
      }

      return data;
    },
    [token]
  );

  const fetchQuizById = useCallback(
    async (quizId, options = {}) => {
      const { force = false } = options;
      if (!quizId || !token) return null;

      if (!force && quizCacheRef.current[quizId]) {
        return quizCacheRef.current[quizId];
      }

      const res = await fetch(`${API_BASE_URL}/v2/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch quiz");
      }

      const json = await res.json();
      const data = json?.data || null;

      if (data?.id) {
        quizCacheRef.current[data.id] = data;
      }

      return data;
    },
    [token]
  );

  const startAttempt = useCallback(
    async ({ quizId, quizMode = "practice", userId, quizData } = {}) => {
      if (!quizId || !token) return null;

      const ownerId = userId || user?.id || user?.uid;
      if (!ownerId) return null;

      setSaving(true);
      try {
        const sourceQuiz = quizData || (await fetchQuizById(quizId));
        if (!sourceQuiz) {
          throw new Error("Quiz not available");
        }
        const sourceMeta = parseMetaObject(sourceQuiz.meta);

        const sourceSubject = getSubjectName(sourceQuiz.subject);
        const sourceClassLevel = getClassLevel({
          classLevel: sourceQuiz.classLevel,
          subject: sourceQuiz.subject,
        });

        const topicPayload = normalizeTopics(
          sourceQuiz.topics || sourceQuiz.topic || []
        );
        const quizType = String(
          sourceQuiz.quizType || sourceQuiz.type || "mcq"
        ).toLowerCase();
        const sourceDifficulty =
          normalizeDifficulty(sourceQuiz.difficulty) ||
          normalizeDifficulty(sourceMeta?.difficulty);

        const res = await fetch(`${API_BASE_URL}/v2/quiz-attempt`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quizId,
            userId: ownerId,
            classLevel: sourceClassLevel,
            subject: sourceSubject,
            topic: topicPayload,
            quizMode,
            quizType,
          }),
        });

        if (!res.ok) {
          const errorJson = await res.json().catch(() => ({}));
          const message = errorJson?.message || "Failed to start attempt";
          throw new Error(message);
        }

        const json = await res.json();
        const attemptId = json?.data?.id || json?.id || null;
        const attemptDataRaw = json?.data || null;
        const attemptData =
          attemptDataRaw && typeof attemptDataRaw === "object"
            ? {
                ...attemptDataRaw,
                ...(sourceDifficulty && !attemptDataRaw?.difficulty
                  ? { difficulty: sourceDifficulty }
                  : {}),
              }
            : attemptDataRaw;

        if (attemptData?.id) {
          attemptCacheRef.current[attemptData.id] = attemptData;
        }

        return attemptId;
      } catch (err) {
        Alert.alert("Error", err?.message || "Failed to start quiz");
        return null;
      } finally {
        setSaving(false);
      }
    },
    [token, user, fetchQuizById]
  );

  const loadSession = useCallback(
    async (attemptId) => {
      if (!attemptId || !token) return;

      const requestId = activeLoadRequestRef.current + 1;
      activeLoadRequestRef.current = requestId;
      setLoading(true);
      hasAutoSubmitted.current = false;
      setAttempt(null);
      setQuiz(null);
      setAnswers({});
      setFeedback({});
      setRevealedHints({});
      setCurrentQuestion(0);
      setTimeLeft(null);

      try {
        const attemptData = await fetchAttemptById(attemptId);
        if (!attemptData) throw new Error("Attempt not found");
        if (activeLoadRequestRef.current !== requestId) return;

        const quizData = await fetchQuizById(attemptData.quizId);
        if (!quizData) throw new Error("Quiz not found");
        if (activeLoadRequestRef.current !== requestId) return;

        setAttempt(attemptData);
        setQuiz(quizData);

        const hydratedAnswers = (attemptData.answers || []).reduce(
          (acc, answerItem, index) => {
            acc[index] = answerItem?.answer || "";
            return acc;
          },
          {}
        );

        setAnswers(hydratedAnswers);
        setFeedback({});
        setRevealedHints({});
        setCurrentQuestion(0);

        if (attemptData.quizMode === "exam") {
          const minutes = parseInt(quizData.estimatedTime, 10) || 15;
          setTimeLeft(minutes * 60);
        } else {
          setTimeLeft(null);
        }
      } catch (_err) {
        if (activeLoadRequestRef.current === requestId) {
          Alert.alert("Error", "Failed to load quiz.");
        }
      } finally {
        if (activeLoadRequestRef.current === requestId) {
          setLoading(false);
        }
      }
    },
    [token, fetchAttemptById, fetchQuizById]
  );

  const setAnswer = useCallback(
    (value) => {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion]: value,
      }));
    },
    [currentQuestion]
  );

  const submitAnswer = useCallback(() => {
    if (!quiz || !Array.isArray(quiz.questions)) return;

    const q = quiz.questions[currentQuestion];
    if (!q) return;

    const userAnswer = normalizeText(toPlainText(answers[currentQuestion]));
    const correctAnswer = normalizeText(getQuestionAnswer(q));

    setFeedback((prev) => ({
      ...prev,
      [currentQuestion]: {
        submitted: true,
        isCorrect: userAnswer === correctAnswer,
      },
    }));
  }, [quiz, currentQuestion, answers]);

  const revealHint = useCallback(() => {
    if (!quiz) return;

    setRevealedHints((prev) => ({
      ...prev,
      [currentQuestion]: (prev[currentQuestion] || 0) + 1,
    }));
  }, [quiz, currentQuestion]);

  const nextQuestion = useCallback(() => {
    if (!quiz) return;
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    }
  }, [quiz, currentQuestion]);

  const previousQuestion = useCallback(() => {
    if (currentQuestion > 0) {
      setCurrentQuestion((q) => q - 1);
    }
  }, [currentQuestion]);

  const saveProgress = useCallback(async () => {
    if (!attempt || !quiz) return;

    setSaving(true);

    try {
      const questionList = Array.isArray(quiz.questions) ? quiz.questions : [];
      const answersArray = questionList.map((q, index) => ({
        question: getQuestionText(q),
        answer: toPlainText(answers[index]),
        marksAwarded:
          normalizeText(toPlainText(answers[index])) ===
          normalizeText(getQuestionAnswer(q))
            ? 1
            : 0,
      }));

      const res = await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attempt.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: answersArray,
          status: "in_progress",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to save progress");
      }
    } finally {
      setSaving(false);
    }
  }, [attempt, quiz, answers, token]);

  const submitQuiz = useCallback(async () => {
    if (!quiz || !attempt) return false;

    setSaving(true);

    try {
      const questionList = Array.isArray(quiz.questions) ? quiz.questions : [];
      const totalQuestions = questionList.length;

      const correctCount = questionList.reduce((count, q, index) => {
        const userAnswer = normalizeText(toPlainText(answers[index]));
        const correctAnswer = normalizeText(getQuestionAnswer(q));
        return userAnswer === correctAnswer ? count + 1 : count;
      }, 0);

      const percentageScore =
        totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;

      const answersArray = questionList.map((q, index) => ({
        question: getQuestionText(q),
        answer: toPlainText(answers[index]),
        marksAwarded:
          normalizeText(toPlainText(answers[index])) ===
          normalizeText(getQuestionAnswer(q))
            ? 1
            : 0,
      }));

      const res = await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attempt.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: answersArray,
          status: "completed",
          score: percentageScore,
          correctAnswers: correctCount,
          totalQuestions,
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        throw new Error(errorJson?.message || "Failed to submit quiz");
      }

      const updatedAttempt = {
        ...attempt,
        score: percentageScore,
        correctAnswers: correctCount,
        totalQuestions,
        answers: answersArray,
        status: "completed",
      };

      setAttempt(updatedAttempt);
      attemptCacheRef.current[updatedAttempt.id] = updatedAttempt;
      return true;
    } catch (_err) {
      Alert.alert("Error", "Failed to submit quiz.");
      return false;
    } finally {
      setSaving(false);
    }
  }, [quiz, attempt, answers, token]);

  useEffect(() => {
    if (!isExamMode) return;
    if (timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isExamMode]);

  useEffect(() => {
    if (!isExamMode) return;
    if (timeLeft !== 0) return;
    if (hasAutoSubmitted.current) return;

    hasAutoSubmitted.current = true;
    submitQuiz();
  }, [timeLeft, isExamMode, submitQuiz]);

  const currentConfig = useMemo(() => {
    if (!attempt && !quiz) return null;
    const attemptMeta = parseMetaObject(attempt?.meta);
    const quizMeta = parseMetaObject(quiz?.meta);

    const topicPayload = normalizeTopics(
      quiz?.topics || attempt?.topic || attempt?.topics || []
    );
    const totalQuestions = quiz?.questions?.length || attempt?.totalQuestions || 0;
    const subjectName =
      getSubjectName(quiz?.subject) || getSubjectName(attempt?.subject);
    const classLevel =
      getClassLevel({ classLevel: quiz?.classLevel, subject: quiz?.subject }) ||
      getClassLevel({
        classLevel: attempt?.classLevel,
        subject: attempt?.subject,
      });

    return {
      classLevel,
      subject: subjectName,
      topic: topicPayload[0]?.name || "",
      topics: topicPayload,
      difficulty:
        normalizeDifficulty(attempt?.difficulty) ||
        normalizeDifficulty(attemptMeta?.difficulty) ||
        normalizeDifficulty(quiz?.difficulty) ||
        normalizeDifficulty(quizMeta?.difficulty) ||
        "",
      quizType: attempt?.quizType || quiz?.quizType || quiz?.type || "mcq",
      duration: attempt?.duration || inferDuration(totalQuestions),
    };
  }, [attempt, quiz]);

  return (
    <QuizSessionContext.Provider
      value={{
        attempt,
        quiz,
        answers,
        feedback,
        revealedHints,
        currentQuestion,
        timeLeft,
        loading,
        saving,
        isExamMode,
        currentConfig,
        loadSession,
        fetchAttemptById,
        fetchQuizById,
        startAttempt,
        setAnswer,
        submitAnswer,
        revealHint,
        nextQuestion,
        previousQuestion,
        saveProgress,
        submitQuiz,
        setCurrentQuestion,
      }}
    >
      {children}
    </QuizSessionContext.Provider>
  );
}
