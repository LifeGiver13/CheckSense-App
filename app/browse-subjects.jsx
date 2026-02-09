import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { colors } from "../theme/colors.jsx";
import { API_BASE_URL } from "../theme/constants.jsx";

export default function BrowseSubjects() {
    const router = useRouter();

    const [classLevel, setClassLevel] = useState("");
    const [userSubjects, setUserSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load user profile
    useEffect(() => {
        const loadUser = async () => {
            const raw = await AsyncStorage.getItem("auth_user");
            if (!raw) return;

            const user = JSON.parse(raw);
            setClassLevel(user?.profile?.defaultClass || "");
            setUserSubjects(user?.profile?.subjects || []);
        };

        loadUser();
    }, []);

    // Fetch topics
    useEffect(() => {
        if (!classLevel) return;

        const fetchTopics = async () => {
            setLoading(true);
            try {
                const where = {
                    classLevel,
                    ...(selectedSubject && { subject: selectedSubject }),
                };

                const params = new URLSearchParams({
                    where: JSON.stringify(where),
                });

                const res = await fetch(`${API_BASE_URL}/v2/topics?${params.toString()}`);


                const json = await res.json();

                const validTopics = (json.data || []).filter(
                    (topic) =>
                        Array.isArray(topic.subtopics) && topic.subtopics.length > 0
                );

                setTopics(validTopics);

            } catch (e) {
                console.error("Failed to load topics", e);
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();
    }, [classLevel, selectedSubject]);

    // Group topics by subject
    const groupedSubjects = topics.reduce((acc, topic) => {
        if (!topic.subject) return acc;

        if (!acc[topic.subject]) acc[topic.subject] = [];
        acc[topic.subject].push(topic);

        return acc;
    }, {});


    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Browse Subjects</Text>

            {/* Class Picker */}
            <Text style={styles.label}>🎓 Class</Text>
            <Picker
                selectedValue={classLevel}
                onValueChange={setClassLevel}
                style={styles.picker}
            >
                <Picker.Item label="Select class..." value="" />
                <Picker.Item label="Form 1" value="Form 1" />
                <Picker.Item label="Form 2" value="Form 2" />
                <Picker.Item label="Form 3" value="Form 3" />
                <Picker.Item label="Form 4" value="Form 4" />
                <Picker.Item label="Form 5" value="Form 5" />
                <Picker.Item label="Lower Sixth" value="Lower Sixth" />
                <Picker.Item label="Upper Sixth" value="Upper Sixth" />
            </Picker>

            {/* Subject Picker (user subjects only) */}
            <Text style={styles.label}>📚 Subject</Text>
            <Picker
                selectedValue={selectedSubject}
                onValueChange={setSelectedSubject}
                style={styles.picker}
            >
                <Picker.Item label="All subjects" value="" />
                {userSubjects.map((s) => (
                    <Picker.Item key={s} label={s} value={s} />
                ))}
            </Picker>

            {/* Content */}
            {loading ? (
                <ActivityIndicator size="large" color={colors.secondary} />
            ) : (
                Object.entries(groupedSubjects).map(([subject, subjectTopics]) => (
                    <Pressable
                        key={subject}
                        style={styles.card}
                        onPress={() =>
                            router.push({
                                pathname: "/subject-topics",
                                params: {
                                    subject,
                                    classLevel,
                                },
                            })
                        }
                    >
                        <View style={styles.cardHeader}>
                            <Feather name="book" size={22} color={colors.secondary} />
                            <Text style={styles.cardTitle}>{subject}</Text>
                        </View>

                        <Text style={styles.meta}>
                            Class: {classLevel}
                        </Text>
                        <Text style={styles.meta}>
                            Topics: {subjectTopics.length}
                        </Text>
                    </Pressable>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: colors.white,
    },
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 16,
    },
    label: {
        marginTop: 12,
        marginBottom: 4,
        fontWeight: "600",
    },
    picker: {
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#eee",
        marginTop: 12,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 6,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    meta: {
        color: colors.mutedBlack,
        fontSize: 13,
    },
});
