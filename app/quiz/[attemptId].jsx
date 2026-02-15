import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AppState,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

const getParamValue = (value) => (Array.isArray(value) ? value[0] : value);

const normalizeSubject = (subjectValue) => {
  if (!subjectValue) return "Unknown Subject";
  if (typeof subjectValue === "string") return subjectValue;
  if (typeof subjectValue === "object") return String(subjectValue.name || "Unknown Subject");
  return String(subjectValue);
};

const toText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const preferred = value.text || value.label || value.name;
    if (preferred !== undefined && preferred !== null) return String(preferred);
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item, "").trim())
    .filter((item) => item.length > 0);
};

const normalizeQuestion = (question, index) => {
  const normalizedQuestion = toText(question?.question, `Question ${index + 1}`).trim();
  const normalizedAnswer = toText(question?.answer, "").trim();

  return {
    question: normalizedQuestion || `Question ${index + 1}`,
    answer: normalizedAnswer,
    options: normalizeStringArray(question?.options),
    hints: normalizeStringArray(question?.hints),
    explanation: toText(question?.explanation, "").trim(),
  };
};

export default function QuizScreen() {
  const params = useLocalSearchParams();
  const attemptId = getParamValue(params.attemptId);

  const router = useRouter();
  const { token } = useAuth();

  const [quiz, setQuiz] = useState(null);
  const [attemptData, setAttemptData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedback, setFeedback] = useState({});
  const [revealedHintIndex, setRevealedHintIndex] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);

  const hasAutoSubmitted = useRef(false);
  const isSavingProgressRef = useRef(false);

  useEffect(() => {
    setCurrentQuestion(0);
    setAnswers({});
    setFeedback({});
    setRevealedHintIndex({});
    setTimeLeft(null);
    setLoading(true);
    hasAutoSubmitted.current = false;
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId || !token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchAttemptAndQuiz = async () => {
      try {
        const attemptRes = await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const attemptJson = await attemptRes.json();
        const attemptPayload = attemptJson?.data || attemptJson;
        const quizId = attemptPayload?.quizId;

        if (!quizId) throw new Error("Attempt missing quizId");

        const quizRes = await fetch(`${API_BASE_URL}/v2/quiz/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        const quizJson = await quizRes.json();

        if (!isMounted) return;

        const rawQuiz = quizJson?.data || quizJson || {};
        const normalizedQuestions = Array.isArray(rawQuiz?.questions)
          ? rawQuiz.questions.map((question, index) => normalizeQuestion(question, index))
          : [];

        setAttemptData(attemptPayload || null);
        setQuiz({
          id: rawQuiz?.id || "",
          subject: rawQuiz?.subject || "",
          classLevel: rawQuiz?.classLevel || rawQuiz?.subject?.classLevel || "",
          topics: Array.isArray(rawQuiz?.topics) ? rawQuiz.topics : [],
          quizType: rawQuiz?.quizType || rawQuiz?.quiztype || rawQuiz?.questionType || rawQuiz?.type || "mcq",
          estimatedTime: rawQuiz?.estimatedTime || "",
          questions: normalizedQuestions,
        });

        if (attemptPayload?.quizMode === "exam") {
          const minutes = Number.parseInt(rawQuiz?.estimatedTime, 10);
          setTimeLeft(Number.isFinite(minutes) && minutes > 0 ? minutes * 60 : 15 * 60);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          Alert.alert("Error", "Failed to load quiz.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAttemptAndQuiz();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [attemptId, token]);

  const isExamMode = attemptData?.quizMode === "exam";
  const questions = useMemo(
    () => (Array.isArray(quiz?.questions) ? quiz.questions : []),
    [quiz?.questions]
  );

  const totalQuestions = questions.length;
  const currentQ = questions[currentQuestion];

  useEffect(() => {
    if (totalQuestions === 0) return;
    if (currentQuestion < totalQuestions) return;
    setCurrentQuestion(totalQuestions - 1);
  }, [currentQuestion, totalQuestions]);

  const quizType = String(quiz?.quizType || quiz?.quiztype || quiz?.questionType || quiz?.type || "mcq");
  const isQuizSAQ = quizType === "saq";
  const currentIsSAQ = isQuizSAQ || (currentQ && currentQ.options.length === 0);

  useEffect(() => {
    if (!isExamMode || timeLeft === null || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isExamMode, timeLeft]);

  const buildAnswersArray = useCallback(() => {
    return questions.map((q, index) => {
      const userAnswerRaw = answers[index] || "";
      const userAnswer = toText(userAnswerRaw, "");

      const normalizedUserAnswer = userAnswer.trim().toLowerCase();
      const normalizedCorrectAnswer = toText(q.answer, "").trim().toLowerCase();

      return {
        question: toText(q.question, `Question ${index + 1}`),
        answer: userAnswer,
        marksAwarded:
          normalizedUserAnswer && normalizedUserAnswer === normalizedCorrectAnswer ? 1 : 0,
      };
    });
  }, [answers, questions]);

  const handleSubmitQuiz = useCallback(async () => {
    if (!attemptId || !token || questions.length === 0) return;

    setSavingProgress(true);

    try {
      const answersArray = buildAnswersArray();
      const correctCount = answersArray.reduce((sum, answerItem) => sum + (answerItem.marksAwarded || 0), 0);

      const percentageScore =
        questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

      await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
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
          totalQuestions: questions.length,
        }),
      });

      Alert.alert("Success", `Quiz submitted! Score: ${percentageScore}%`);
      router.replace(`/quiz-results/${attemptId}`);
    } catch (_err) {
      Alert.alert("Error", "Failed to submit quiz.");
    } finally {
      setSavingProgress(false);
    }
  }, [attemptId, token, questions.length, buildAnswersArray, router]);

  useEffect(() => {
    if (!isExamMode || timeLeft === null || timeLeft > 0 || hasAutoSubmitted.current) return;

    hasAutoSubmitted.current = true;
    Alert.alert("Time up", "Quiz submitted automatically.");
    handleSubmitQuiz();
  }, [handleSubmitQuiz, isExamMode, timeLeft]);

  const handleAnswer = (answer) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion]: answer }));
  };

  const handleSubmitAnswer = () => {
    if (!currentQ) return;

    const userAnswer = toText(answers[currentQuestion], "").trim().toLowerCase();
    const correctAnswer = toText(currentQ.answer, "").trim().toLowerCase();

    setFeedback((prev) => ({
      ...prev,
      [currentQuestion]: { submitted: true, isCorrect: userAnswer === correctAnswer },
    }));
  };

  const saveProgress = useCallback(async () => {
    if (!attemptId || !token || questions.length === 0) return;
    if (isSavingProgressRef.current) return;

    isSavingProgressRef.current = true;

    try {
      const answersArray = buildAnswersArray();

      await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: answersArray, status: "in_progress" }),
      });
    } catch (err) {
      console.error("Save progress error:", err);
    } finally {
      isSavingProgressRef.current = false;
    }
  }, [attemptId, token, questions.length, buildAnswersArray]);

  useEffect(() => {
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        void saveProgress();
      }
    });

    return () => appStateSub.remove();
  }, [saveProgress]);

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      const nextQuestion = currentQuestion + 1;
      setCurrentQuestion(nextQuestion);

      const shouldSave = nextQuestion % 4 === 0 || nextQuestion === totalQuestions - 1;
      if (shouldSave) {
        void saveProgress();
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion((prev) => prev - 1);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Feather name="loader" size={48} color={colors.primaryDark} />
        <Text style={{ marginTop: 12 }}>Loading quiz...</Text>
      </View>
    );
  }

  if (!quiz || !currentQ || questions.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 12 }}>Quiz has no questions yet.</Text>
        <Pressable onPress={() => router.back()} style={styles.btnNav}>
          <Text style={styles.btn}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const subjectName = normalizeSubject(quiz.subject);
  const topicName = Array.isArray(quiz.topics) ? String(quiz.topics[0]?.name || "General") : "General";
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={{ flexDirection: "column", justifyContent: "space-between" }}>
        <Text style={styles.subtitle}>Quizzes / {subjectName} - {topicName}</Text>
        {isExamMode && timeLeft !== null && (
          <Text style={{ color: "red", fontWeight: "bold", marginBottom: 8 }}>
            Time left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={styles.headerProgress}>
          Question {currentQuestion + 1} of {totalQuestions}
        </Text>
        <Text>{Math.round(progress)}%</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>{currentQ.question}</Text>

        {!currentIsSAQ &&
          currentQ.options.map((opt, index) => {
            const isSelected = answers[currentQuestion] === opt;
            const submitted = feedback[currentQuestion]?.submitted;
            const isCorrectAnswer = opt === currentQ.answer;

            let bgColor = colors.white;
            if (!isExamMode && submitted) {
              if (isSelected && isCorrectAnswer) bgColor = "#d4edda";
              else if (isSelected && !isCorrectAnswer) bgColor = "#f8d7da";
              else if (!isSelected && isCorrectAnswer) bgColor = "#d4edda";
            } else if (isSelected) {
              bgColor = colors.secondary;
            }

            return (
              <Pressable
                key={`${currentQuestion}-${index}`}
                onPress={() => !submitted && handleAnswer(opt)}
                style={{
                  padding: 12,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.white : "#ccc",
                  backgroundColor: bgColor,
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                <Text>{opt}</Text>
              </Pressable>
            );
          })}

        {currentIsSAQ && (
          <View style={{ marginTop: 12 }}>
            <Text style={{ marginBottom: 6, fontWeight: "500" }}>Type your answer:</Text>

            <TextInput
              value={toText(answers[currentQuestion], "")}
              onChangeText={(text) => handleAnswer(text)}
              editable={!feedback[currentQuestion]?.submitted}
              multiline
              numberOfLines={5}
              placeholder="Write your answer here..."
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 10,
                padding: 12,
                minHeight: 120,
                textAlignVertical: "top",
                backgroundColor: colors.white,
              }}
            />
          </View>
        )}

        {!isExamMode && feedback[currentQuestion]?.submitted && (
          <View style={styles.feedbackContainer}>
            <View
              style={[
                styles.section,
                feedback[currentQuestion].isCorrect ? styles.correctBg : styles.incorrectBg,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  feedback[currentQuestion].isCorrect ? styles.correctText : styles.incorrectText,
                ]}
              >
                {feedback[currentQuestion].isCorrect ? "Correct!" : "Incorrect"}
              </Text>
            </View>

            <View style={[styles.section, styles.explanationBg]}>
              <Text style={styles.sectionTitle}>Explanation</Text>
              <Text style={styles.sectionText}>{currentQ.explanation || "No explanation available."}</Text>
            </View>

            {!feedback[currentQuestion].isCorrect && (
              <View style={[styles.section, styles.answerBg]}>
                <Text style={styles.sectionTitle}>Correct Answer</Text>
                <Text style={styles.sectionText}>{currentQ.answer || "No answer provided."}</Text>
              </View>
            )}
          </View>
        )}

        {!isExamMode && currentQ.hints.length > 0 && (() => {
          const currentHints = currentQ.hints;
          const revealedCount = revealedHintIndex[currentQuestion] || 0;

          return (
            <View style={{ marginTop: 12 }}>
              {currentHints.slice(0, revealedCount).map((hint, idx) => (
                <Text key={idx} style={{ color: colors.primaryDark, marginVertical: 4 }}>
                  {idx + 1}. {hint}
                </Text>
              ))}

              {revealedCount < currentHints.length && (
                <Pressable
                  onPress={() =>
                    setRevealedHintIndex((prev) => ({
                      ...prev,
                      [currentQuestion]: revealedCount + 1,
                    }))
                  }
                  style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: colors.white,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text
                    style={{
                      borderWidth: 1,
                      padding: 8,
                      borderColor: colors.secondaryLight,
                      borderRadius: 8,
                    }}
                  >
                    Need a hint?
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })()}
      </View>

      {!isExamMode && answers[currentQuestion] && !feedback[currentQuestion]?.submitted && (
        <Pressable
          onPress={handleSubmitAnswer}
          style={{ padding: 12, backgroundColor: colors.primaryDark, borderRadius: 8, marginTop: 8 }}
          disabled={savingProgress}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>Submit Answer</Text>
        </Pressable>
      )}

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Pressable
          onPress={handlePrevious}
          disabled={currentQuestion === 0}
          style={{
            padding: 12,
            backgroundColor: currentQuestion === 0 ? "#eee" : "#ccc",
            borderRadius: 8,
          }}
        >
          <Text>Previous</Text>
        </Pressable>

        <View
          style={{
            width: 120,
            height: 44,
            justifyContent: "center",
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              alignItems: "center",
              paddingHorizontal: 2,
            }}
          >
            {questions.map((_, index) => {
              const isActive = currentQuestion === index;
              return (
                <Pressable
                  key={index}
                  onPress={() => setCurrentQuestion(index)}
                  style={{
                    minWidth: 32,
                    height: 32,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: isActive ? colors.primaryDark : "#ccc",
                    backgroundColor: isActive ? colors.primaryDark : colors.white,
                    marginRight: index === questions.length - 1 ? 0 : 6,
                  }}
                >
                  <Text style={{ color: isActive ? colors.white : colors.black, fontWeight: "600" }}>
                    {index + 1}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {currentQuestion < totalQuestions - 1 ? (
          <Pressable onPress={handleNext} style={styles.btnNav}>
            <Text style={styles.btn}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={handleSubmitQuiz}
            style={{ padding: 12, backgroundColor: colors.primaryDark, borderRadius: 8 }}
            disabled={savingProgress}
          >
            <Text style={styles.btn}>Submit</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.white },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  btn: {
    color: colors.white,
  },
  subtitle: {
    fontSize: 12,
  },
  btnNav: { padding: 12, backgroundColor: colors.primaryDark, borderRadius: 8 },
  headerProgress: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    justifyContent: "space-between",
  },
  questionContainer: {
    marginTop: 30,
    borderWidth: 1,
    borderColor: colors.mutedBlack,
    padding: 16,
    borderRadius: 16,
    marginBottom: 23,
  },
  feedbackContainer: {
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden",
  },
  section: {
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  correctBg: {
    backgroundColor: "#d4edda",
  },
  incorrectBg: {
    backgroundColor: "#f8d7da",
  },
  explanationBg: {
    backgroundColor: "#e9ecef",
  },
  answerBg: {
    backgroundColor: "#d4edda",
  },
  statusText: {
    fontWeight: "bold",
    fontSize: 16,
  },
  correctText: {
    color: "green",
  },
  incorrectText: {
    color: "red",
  },
  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
