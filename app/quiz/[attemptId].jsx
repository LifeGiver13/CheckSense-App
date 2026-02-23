import { Feather } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View
} from "react-native";
import { useQuizSession } from "../../contexts/QuizSessionContext";
import { colors } from "../../theme/colors";

const getSubjectName = (subject) => {
  if (typeof subject === "string") return subject;
  if (subject && typeof subject === "object") return String(subject.name || "").trim();
  return "";
};

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

const getQuestionExplanation = (question = {}) =>
  toPlainText(question?.explanation || question?.reason);

const getQuestionHints = (question = {}) =>
  Array.isArray(question?.hints) ? question.hints.map(toPlainText).filter(Boolean) : [];

const getQuestionOptions = (question = {}) =>
  Array.isArray(question?.options) ? question.options.map(toPlainText).filter(Boolean) : [];

export default function QuizScreen() {
  const { attemptId } = useLocalSearchParams();
  const resolvedAttemptId = Array.isArray(attemptId) ? attemptId[0] : attemptId;
  const router = useRouter();

  const {
    attempt,
    loadSession,
    quiz,
    answers,
    feedback,
    revealedHints,
    currentQuestion,
    setAnswer,
    submitAnswer,
    revealHint,
    nextQuestion,
    previousQuestion,
    submitQuiz,
    setCurrentQuestion,
    timeLeft,
    isExamMode,
    loading,
    saving,
  } = useQuizSession();

  useFocusEffect(
    useCallback(() => {
      if (resolvedAttemptId) {
        loadSession(resolvedAttemptId);
      }
    }, [resolvedAttemptId, loadSession])
  );

  const isCurrentAttemptLoaded =
    !!attempt && String(attempt.id) === String(resolvedAttemptId);

  if (loading) {
    return (
      <View style={styles.center}>
        <Feather name="loader" size={48} color={colors.primaryDark} />
        <Text style={{ marginTop: 12 }}>Loading quiz...</Text>
      </View>
    );
  }

  if (!resolvedAttemptId || !attempt || !quiz || !isCurrentAttemptLoaded) {
    return (
      <View style={styles.center}>
        <Text>Failed to load quiz session.</Text>
        <Pressable
          style={[styles.btnNav, { marginTop: 12 }]}
          onPress={() => resolvedAttemptId && loadSession(resolvedAttemptId)}
        >
          <Text style={styles.btn}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
  if (!questions.length) {
    return (
      <View style={styles.center}>
        <Text>No questions available for this quiz.</Text>
      </View>
    );
  }

  const totalQuestions = questions.length;
  const normalizedQuestionIndex = Number(currentQuestion);
  const safeCurrentQuestion = Number.isFinite(normalizedQuestionIndex)
    ? Math.min(totalQuestions - 1, Math.max(0, normalizedQuestionIndex))
    : 0;
  const currentQ = questions[safeCurrentQuestion] || questions[0];
  const progress = ((safeCurrentQuestion + 1) / totalQuestions) * 100;
  const isSAQ = String(quiz.quizType || quiz.type || "").toLowerCase() === "saq";
  const subjectName = getSubjectName(quiz.subject) || "--";
  const topicName = quiz.topics?.[0]?.name || "--";
  const resolvedTimeLeft = Number.isFinite(timeLeft) ? timeLeft : 0;
  const questionText = getQuestionText(currentQ);
  const questionAnswer = getQuestionAnswer(currentQ);
  const questionExplanation = getQuestionExplanation(currentQ);
  const questionHints = getQuestionHints(currentQ);
  const questionOptions = getQuestionOptions(currentQ);
  const currentAnswer = answers[safeCurrentQuestion] || "";
  const currentFeedback = feedback[safeCurrentQuestion];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Subject & Topic */}
      <Text style={styles.subtitle}>
        {subjectName} - {topicName}
      </Text>

      {/* Timer */}
      {isExamMode && (
        <Text style={{ color: "red", fontWeight: "bold", marginTop: 4 }}>
          Time left: {Math.floor(resolvedTimeLeft / 60)}:
          {String(resolvedTimeLeft % 60).padStart(2, "0")}
        </Text>
      )}

      {/* Progress */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.headerProgress}>
        Question {safeCurrentQuestion + 1} of {totalQuestions} ({Math.round(progress)}%)
      </Text>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={{ fontSize: 18, marginBottom: 12 }}>{questionText}</Text>

        {/* MCQ Options */}
        {!isSAQ &&
          questionOptions.map((opt, index) => {
            const isSelected = currentAnswer === opt;
            const submitted = currentFeedback?.submitted;
            const isCorrectAnswer = opt === questionAnswer;

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
                key={index}
                onPress={() => !submitted && setAnswer(opt)}
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

        {/* SAQ */}
        {isSAQ && (
          <TextInput
            value={currentAnswer}
            onChangeText={setAnswer}
            editable={!currentFeedback?.submitted}
            multiline
            numberOfLines={5}
            placeholder="Write your answer here..."
            style={styles.input}
          />
        )}

        {/* Feedback */}
        {!isExamMode && currentFeedback?.submitted && (
          <View style={styles.feedbackContainer}>
            <View
              style={[
                styles.section,
                currentFeedback.isCorrect
                  ? styles.correctBg
                  : styles.incorrectBg,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  currentFeedback.isCorrect
                    ? styles.correctText
                    : styles.incorrectText,
                ]}
              >
                {currentFeedback.isCorrect ? "Correct!" : "Incorrect"}
              </Text>
            </View>

            <View style={[styles.section, styles.explanationBg]}>
              <Text style={styles.sectionTitle}>Explanation</Text>
              <Text style={styles.sectionText}>{questionExplanation || "--"}</Text>
            </View>

            {!currentFeedback.isCorrect && (
              <View style={[styles.section, styles.answerBg]}>
                <Text style={styles.sectionTitle}>Correct Answer</Text>
                <Text style={styles.sectionText}>{questionAnswer || "--"}</Text>
              </View>
            )}
          </View>
        )}

        {/* Hints */}
        {!isExamMode && questionHints.length > 0 && (
          <View style={{ marginTop: 12 }}>
            {questionHints.slice(0, revealedHints[safeCurrentQuestion] || 0).map((hint, idx) => (
              <Text key={idx} style={{ color: colors.primaryDark, marginVertical: 4 }}>
                {idx + 1}. {hint}
              </Text>
            ))}

            {(revealedHints[safeCurrentQuestion] || 0) < questionHints.length && (
              <Pressable
                onPress={revealHint}
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
                  💡 Need a hint?
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Submit Answer button */}
      {!isExamMode &&
        currentAnswer &&
        !currentFeedback?.submitted && (
          <Pressable onPress={submitAnswer} disabled={saving} style={[styles.btnNav, saving && { opacity: 0.7 }]}>
            <Text style={styles.btn}>Submit Answer</Text>
          </Pressable>
        )}

      {/* Navigation */}
      <View style={styles.navRow}>
        <Pressable
          onPress={previousQuestion}
          disabled={safeCurrentQuestion === 0}
          style={{
            padding: 12,
            backgroundColor: safeCurrentQuestion === 0 ? "#eee" : "#ccc",
            borderRadius: 8,
          }}
        >
          <Text>Previous</Text>
        </Pressable>

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={safeCurrentQuestion}
            onValueChange={(value) => {
              const nextIndex = Number(value);
              setCurrentQuestion(Number.isFinite(nextIndex) ? nextIndex : 0);
            }}
            mode="dropdown"
          >
            {questions.map((_, index) => (
              <Picker.Item
                key={index}
                label={`Question ${index + 1}`}
                value={index}
              />
            ))}
          </Picker>
        </View>

        {safeCurrentQuestion < totalQuestions - 1 ? (
          <Pressable onPress={nextQuestion} style={styles.btnNav}>
            <Text style={styles.btn}>Next</Text>
          </Pressable>
        ) : (
          <Pressable
            disabled={saving}
            onPress={async () => {
              const submitted = await submitQuiz();
              if (submitted) {
                const targetAttemptId = String(resolvedAttemptId || attempt?.id || "").trim();
                if (targetAttemptId) {
                  router.replace(`/quiz-results/${targetAttemptId}`);
                }
              }
            }}
            style={[styles.btnNav, saving && { opacity: 0.7 }]}
          >
            <Text style={styles.btn}>{saving ? "Submitting..." : "Submit"}</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.white },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerProgress: { fontSize: 20, fontWeight: "bold", marginVertical: 8 },
  subtitle: { fontSize: 14 },
  questionContainer: {
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.mutedBlack,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    backgroundColor: colors.white,
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
  correctBg: { backgroundColor: "#d4edda" },
  incorrectBg: { backgroundColor: "#f8d7da" },
  explanationBg: { backgroundColor: "#e9ecef" },
  answerBg: { backgroundColor: "#d4edda" },
  statusText: { fontWeight: "bold", fontSize: 16 },
  correctText: { color: "green" },
  incorrectText: { color: "red" },
  sectionTitle: { fontWeight: "bold", marginBottom: 4 },
  sectionText: { fontSize: 14, lineHeight: 20 },
  btnNav: { padding: 12, backgroundColor: colors.primaryDark, borderRadius: 8 },
  btn: { color: "#fff", textAlign: "center" },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  progressBarBackground: {
    height: 8,
    width: "100%",
    backgroundColor: "#eee",
    borderRadius: 4,
    marginTop: 12,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.primaryDark,
    borderRadius: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden",
    width: 120,
    height: 44,
    justifyContent: "center",
  },
});
