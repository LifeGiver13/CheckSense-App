import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

import { Picker } from "@react-native-picker/picker";


export default function QuizScreen() {
    const { attemptId } = useLocalSearchParams();
    const router = useRouter();
    const { token, user } = useAuth();

    const [quiz, setQuiz] = useState(null);
    const [attemptData, setAttemptData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [feedback, setFeedback] = useState({});
    const [revealedHintIndex, setRevealedHintIndex] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [savingProgress, setSavingProgress] = useState(false);
    const hasAutoSubmitted = useRef(false);

    useEffect(() => {
        // Reset everything when a NEW attempt starts
        setCurrentQuestion(0);
        setAnswers({});
        setFeedback({});
        setRevealedHintIndex({});
        setTimeLeft(null);
        setLoading(true);
        hasAutoSubmitted.current = false;
    }, [attemptId]);

    // Fetch attempt data
    useEffect(() => {
        if (!attemptId || !token) return;

        const fetchAttempt = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const result = await res.json();
                setAttemptData(result.data);

                // Fetch quiz using quizId
                const quizRes = await fetch(`${API_BASE_URL}/v2/quiz/${result.data.quizId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const quizResult = await quizRes.json();
                setQuiz(quizResult.data);

                // Timer setup if exam mode
                if (result.data.quizMode === "exam") {
                    const minutes = parseInt(quizResult.data.estimatedTime) || 15;
                    setTimeLeft(minutes * 60);
                }
            } catch (err) {
                Alert.alert("Error", "Failed to load quiz.");
            } finally {
                setLoading(false);
            }
        };

        fetchAttempt();
    }, [attemptId, token]);
    const isExamMode = attemptData?.quizMode === "exam";

    // Timer countdown
    useEffect(() => {
        if (!isExamMode) return;
        if (timeLeft === null) return;
        if (timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft(t => t - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isExamMode]);

    useEffect(() => {
        if (!isExamMode) return;
        if (timeLeft === null) return;
        if (timeLeft > 0) return;
        if (hasAutoSubmitted.current) return;

        hasAutoSubmitted.current = true;

        Alert.alert("Time up", "Quiz submitted automatically.");
        handleSubmitQuiz();
    }, [timeLeft, isExamMode]);


    const currentQ = quiz?.questions?.[currentQuestion];
    const isSAQ = quiz?.quizType === "saq" || quiz?.questionType === "saq";


    const handleAnswer = (answer) => {
        setAnswers({ ...answers, [currentQuestion]: answer });
    };

    const handleSubmitAnswer = () => {
        if (!currentQ) return;
        const userAnswer = answers[currentQuestion]?.trim().toLowerCase();
        const correctAnswer = currentQ.answer?.trim().toLowerCase();
        setFeedback({
            ...feedback,
            [currentQuestion]: { submitted: true, isCorrect: userAnswer === correctAnswer },
        });
    };

    const handleNext = async () => {
        await saveProgress();
        if (currentQuestion < quiz.questions.length - 1) setCurrentQuestion(currentQuestion + 1);
    };

    const handlePrevious = () => {
        if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    };

    const saveProgress = async () => {
        if (!attemptId || !quiz) return;
        setSavingProgress(true);

        try {
            const answersArray = quiz.questions.map((q, index) => ({
                question: q.question,
                answer: answers[index] || "",
                marksAwarded: answers[index]?.trim().toLowerCase() === q.answer?.trim().toLowerCase() ? 1 : 0,
            }));

            await fetch(`${API_BASE_URL}/v2/quiz-attempt/${attemptId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ answers: answersArray, status: "in_progress" }),
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSavingProgress(false);
        }
    };

    const handleSubmitQuiz = async () => {
        if (!quiz) return;

        setSavingProgress(true);

        try {
            const totalQuestions = quiz.questions.length;

            const correctCount = quiz.questions.reduce((count, q, index) => {
                const userAnswer = answers[index]?.trim().toLowerCase();
                return userAnswer === q.answer?.trim().toLowerCase() ? count + 1 : count;
            }, 0);

            const percentageScore =
                totalQuestions > 0
                    ? Math.round((correctCount / totalQuestions) * 100)
                    : 0;

            const answersArray = quiz.questions.map((q, index) => ({
                question: q.question,
                answer: answers[index] || "",
                marksAwarded:
                    answers[index]?.trim().toLowerCase() === q.answer?.trim().toLowerCase()
                        ? 1
                        : 0,
            }));

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
                    totalQuestions: totalQuestions
                }),
            });

            Alert.alert("Success", `Quiz submitted! Score: ${percentageScore}%`);
            router.replace(`/quiz-results/${attemptId}`);
        } catch (err) {
            Alert.alert("Error", "Failed to submit quiz.");
        } finally {
            setSavingProgress(false);
        }
    };

    if (loading || !quiz) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Feather name="loader" size={48} color={colors.primaryDark} />
                <Text style={{ marginTop: 12 }}>Loading quiz...</Text>
            </View>
        );
    }


    const totalQuestions = quiz.questions.length;
    const progress = ((currentQuestion + 1) / totalQuestions) * 100;

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={{ flexDirection: 'column', justifyContent: "space-between" }}>

                <Text style={styles.subtitle}>Quizess/ {quiz.subject} - {quiz.topics[0]?.name}</Text>
                {isExamMode && (
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

                {/* MCQ */}
                {!isSAQ && currentQ.options?.map((opt, index) => {
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
                            key={index}
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

                {/* SAQ (Short Answer) */}
                {isSAQ && (
                    <View style={{ marginTop: 12 }}>
                        <Text style={{ marginBottom: 6, fontWeight: "500" }}>
                            Type your answer:
                        </Text>

                        <TextInput
                            value={answers[currentQuestion] || ""}
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

                {/* feedback */}
                {!isExamMode && feedback[currentQuestion]?.submitted && (
                    <View style={styles.feedbackContainer}>

                        {/* Status section */}
                        <View
                            style={[
                                styles.section,
                                feedback[currentQuestion].isCorrect
                                    ? styles.correctBg
                                    : styles.incorrectBg,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    feedback[currentQuestion].isCorrect
                                        ? styles.correctText
                                        : styles.incorrectText,
                                ]}
                            >
                                {feedback[currentQuestion].isCorrect ? "Correct!" : "Incorrect"}
                            </Text>
                        </View>

                        {/* Explanation section */}
                        <View style={[styles.section, styles.explanationBg]}>
                            <Text style={styles.sectionTitle}>Explanation</Text>
                            <Text style={styles.sectionText}>{currentQ.explanation}</Text>
                        </View>

                        {/* Correct answer section (only if wrong) */}
                        {!feedback[currentQuestion].isCorrect && (
                            <View style={[styles.section, styles.answerBg]}>
                                <Text style={styles.sectionTitle}>Correct Answer</Text>
                                <Text style={styles.sectionText}>{currentQ.answer}</Text>
                            </View>
                        )}

                    </View>
                )}

                {/* Hints */}
                {!isExamMode && currentQ.hints?.length > 0 && (() => {
                    const currentHints = currentQ.hints;
                    const revealedCount = revealedHintIndex[currentQuestion] || 0;

                    return (
                        <View style={{ marginTop: 12 }}>
                            {/* Revealed hints */}

                            {currentHints.slice(0, revealedCount).map((hint, idx) => (

                                <Text key={idx} style={{ color: colors.primaryDark, marginVertical: 4 }}>
                                    {idx + 1}, {hint}
                                </Text>
                            ))}

                            {/* Single Show Hint button */}
                            {revealedCount < currentHints.length && (
                                <Pressable
                                    onPress={() =>
                                        setRevealedHintIndex(prev => ({
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

                                    <Text style={{ borderWidth: 1, padding: 8, borderColor: colors.secondaryLight, borderRadius: 8 }}>
                                        💡 Need a hint?
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    );
                })()}


            </View>

            {!isExamMode &&
                answers[currentQuestion] &&
                !feedback[currentQuestion]?.submitted && (
                    <Pressable
                        onPress={handleSubmitAnswer}
                        style={{ padding: 12, backgroundColor: colors.primaryDark, borderRadius: 8, marginTop: 8 }}
                    >
                        <Text style={{ color: "#fff", textAlign: "center", backgroundColor: colors.primaryDark }}>Submit Answer</Text>
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
                {/* Previous */}
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

                {/* Question Picker */}
                <View
                    style={{
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 8,
                        overflow: "hidden",
                        width: 120,
                        height: 44,
                        justifyContent: "center",
                    }}
                >
                    <Picker
                        selectedValue={currentQuestion}
                        onValueChange={(value) => setCurrentQuestion(value)}
                        mode="dropdown"
                    >
                        {quiz.questions.map((_, index) => (
                            <Picker.Item
                                key={index}
                                label={`Question ${index + 1}`}
                                value={index}
                            />
                        ))}
                    </Picker>
                </View>

                {/* Next / Submit */}
                {currentQuestion < totalQuestions - 1 ? (
                    <Pressable onPress={handleNext} style={styles.btnNav}>
                        <Text style={styles.btn}>Next</Text>
                    </Pressable>
                ) : (
                    <Pressable
                        onPress={handleSubmitQuiz}
                        style={{ padding: 12, backgroundColor: colors.primaryDark, borderRadius: 8 }}
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
    info: {
        flexDirection: 'column',
    },
    btn: {
        backgroundColor: colors.primaryDark,
        color: colors.white
    },
    text: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 12,
    },
    btnNav: { padding: 12, backgroundColor: colors.primaryDark, borderRadius: 8 },
    headerProgress: { fontSize: 20, fontWeight: "bold", marginBottom: 8, justifyContent: 'space-between' },
    questionContainer: {
        marginTop: 30,
        borderWidth: 1,
        borderColor: colors.mutedBlack,
        padding: 16,
        borderRadius: 16,
        marginBottom: 23
    }, feedbackContainer: {
        marginTop: 12,
        borderRadius: 10,
        overflow: "hidden", // keeps sections tidy
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
