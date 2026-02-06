import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

const PAGE_SIZE = 10;

export default function Quizzes() {
    const router = useRouter();
    const { token, user, isLoading: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("pending");
    const [quizAttempts, setQuizAttempts] = useState([]);

    const [pagination, setPagination] = useState({
        total: 0,
        limit: PAGE_SIZE,
        offset: 0,
    });
    const formatDateTime = (ts) => {
        if (!ts?._seconds) return "";

        return new Date(ts._seconds * 1000).toLocaleString();
    };

    const fetchQuizAttempts = useCallback(
        async (offset = 0) => {
            const userId = user?.id || user?.uid;
            if (!token || !userId) return;

            setLoading(true);
            try {
                const where = encodeURIComponent(JSON.stringify({ userId }));
                const res = await fetch(
                    `${API_BASE_URL}/v2/my/quiz-attempt?where=${where}&limit=${PAGE_SIZE}&offset=${offset}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    }
                );

                const json = await res.json();

                setQuizAttempts(json.data || []);
                setPagination({
                    total: json.total || 0,
                    limit: json.limit || PAGE_SIZE,
                    offset: json.offset || 0,
                });
            } catch (e) {
                console.log("Fetch error:", e);
            } finally {
                setLoading(false);
            }
        },
        [token, user]
    );
    useFocusEffect(
        useCallback(() => {
            if (!authLoading) {
                fetchQuizAttempts(0);
            }
        }, [authLoading, fetchQuizAttempts])
    );

    const pending = quizAttempts.filter(
        q => q.status === "draft" || q.status === "in_progress"
    );
    const completed = quizAttempts.filter(q => q.status === "completed");
    const challenges = quizAttempts.filter(q => q.isChallenge);

    const data =
        tab === "pending"
            ? pending
            : tab === "challenges"
                ? challenges
                : completed;

    const startQuiz = quiz => {
        router.push({
            pathname: "/quiz/[id]",
            params: { id: quiz.id, mode: quiz.quizMode || "practice" },
        });
    };
    const dismissQuiz = id => {
        setQuizAttempts(prev => prev.filter(q => q.id !== id));
    };


    if (loading || authLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>My Quizzes</Text>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TabButton label={"Pending "+ pending.length} active={tab === "pending"} onPress={() => setTab("pending")} />
                <TabButton label={"Challenges "+ challenges.length} active={tab === "challenges"} onPress={() => setTab("challenges")} />
                <TabButton label={"Completed "+ completed.length} active={tab === "completed"} onPress={() => setTab("completed")} />
            </View>

            {/* List */}
            <FlatList
                data={data}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 40 }}
                ListEmptyComponent={
                    <Text style={styles.empty}>No quizzes here</Text>
                }
                renderItem={({ item }) => {
                   
                    const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

                    return (
                        <View style={styles.card}>
                            {/* First line */}
                            <Text style={styles.firstLine}>
                                {item.subject} • {item.classLevel} • {item.quizType} • {capitalize(item.quizMode) + ' Mode'}
                                {item.score !== null ? ` • Score: ${item.score}%` : ""}
                            </Text>

                            {/* Second line: topic */}
                            <Text style={styles.secondLine}>
                                {item.topic[0]?.name || ""}
                            </Text>

                            {/* Third line: created and updated */}
                            <Text style={styles.thirdLine}>
                                Created: {formatDateTime(item.createdAt)} • Updated: {formatDateTime(item.updatedAt)}
                            </Text>

                            {/* Action buttons */}
                            <View style={styles.buttonContainer}>
                                {item.status === "completed" ? (
                                    <>
                                        <TouchableOpacity
                                            style={styles.buttonReview}
                                            onPress={() => router.push(`/quiz/${item.id}/results`)}
                                        >
                                            <Ionicons name="eye" size={16} color={colors.primaryDark} />
                                            <Text style={styles.buttonTextReview}>Review</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.buttonContinue}
                                            onPress={() => router.push(`/choose-quiz-type/${item.quizId}`)}
                                        >
                                            <Ionicons name="refresh" size={16} color={colors.white} />
                                            <Text style={styles.buttonTextContinue}>Retake</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={styles.buttonContinue}
                                            onPress={() => startQuiz(item)}
                                        >
                                            <Ionicons name="play" size={16} color={colors.white} />
                                            <Text style={styles.buttonTextContinue}>
                                                {item.status === "in_progress" ? "Continue" : "Start"}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.buttonDismiss}
                                            onPress={() => dismissQuiz(item.id)}
                                        >
                                            <Ionicons name="trash" size={16} color={colors.black} />
                                            <Text style={styles.buttonTextDismiss}>Dismiss</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    );
                }}

            />

            {/* Pagination */}
            {pagination.total > PAGE_SIZE && (
                <View style={styles.pagination}>
                    <TouchableOpacity
                        disabled={pagination.offset === 0}
                        onPress={() =>
                            fetchQuizAttempts(Math.max(0, pagination.offset - PAGE_SIZE))
                        }
                    >
                        <Text>{"< Previous"}</Text>
                    </TouchableOpacity>

                    <Text style={styles.subtitle}>Showing {pagination.offset + 1}-{pagination.offset + 10} of {pagination.total} quizzes</Text>

                    <Text style={styles.subtitle}>Page {(pagination.offset / 10).toFixed(0) + 1} of {(pagination.total / 10).toFixed(0)}</Text>
                    <TouchableOpacity
                        disabled={pagination.offset + PAGE_SIZE >= pagination.total}
                        onPress={() =>
                            fetchQuizAttempts(pagination.offset + PAGE_SIZE)
                        }
                    >
                        <Text>{"Next >"}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}


function TabButton({ label, active, onPress }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.tab, active && styles.tabActive]}
        >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: colors.white
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 16,
    },
    tabs: {
        flexDirection: "row",
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        padding: 10,
        borderBottomWidth: 2,
        borderColor: colors.mutedWhite,
        alignItems: "center",
    },
    tabActive: {
        borderColor: colors.black,
    },
    tabText: {
        color: colors.mutedBlack,
    },
    tabTextActive: {
        color: colors.black,
        fontWeight: "bold",
    },
    card: {
        padding: 16,
        backgroundColor: colors.white,
        borderRadius: 8,
        marginBottom: 12,
        elevation: 2,
    },
    subject: {
        fontSize: 18,
        fontWeight: "bold",
    },
    meta: {
        color: colors.mutedBlack,
        marginBottom: 8,
    },
    buttonContinue: {
        flexDirection: "row",
        backgroundColor: colors.primaryDark,
        padding: 10,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    buttonDismiss: {
        flexDirection: "row",
        backgroundColor: colors.white,
        padding: 10,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    buttonTextContinue: {
        color: colors.white,
        fontWeight: "600",
    },
    buttonTextDismiss: {
        color: colors.black,
        fontWeight: "600",
    },
    empty: {
        textAlign: "center",
        marginTop: 40,
        color: colors.mutedWhite,
    },
    pagination: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    subtitle: {
        fontSize: 9
    },
    buttonContainer: {
        flexDirection: "row",
        backgroundColor: colors.white,
        padding: 10,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: 'space-between',
        gap: 2,
    },
    buttonReview: {
        flexDirection: "row",
        backgroundColor: colors.white,
        padding: 10,
        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderWidth: 1,
        borderColor: colors.primaryDark,
    },

    buttonTextReview: {
        color: colors.primaryDark,
        fontWeight: "600",
    },
    firstLine: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 4,
        color: colors.mutedBlack,
    },
    secondLine: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
        color: colors.primaryDark,
    },
    thirdLine: {
        fontSize: 12,
        color: colors.mutedBlack,
        marginBottom: 8,
    },


});
