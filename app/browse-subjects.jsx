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
import { useCurriculum } from "../contexts/CurriculumContext.jsx";
import { colors } from "../theme/colors.jsx";

export default function BrowseSubjects() {
    const router = useRouter();
    const { getSubjectsWithTopicCounts } = useCurriculum();

    const [classLevel, setClassLevel] = useState("");
    const [userSubjects, setUserSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState("");
    const [subjectsWithTopics, setSubjectsWithTopics] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load user profile
    useEffect(() => {
        const loadUser = async () => {
            try {
                const raw = await AsyncStorage.getItem("auth_user");
                if (!raw) return;

                const user = JSON.parse(raw);
                const subjects = Array.isArray(user?.profile?.subjects)
                    ? user.profile.subjects
                    : [];

                setClassLevel(user?.profile?.defaultClass || "");
                setUserSubjects(subjects);

                // Default selectedSubject to first user subject
                if (subjects.length) {
                    setSelectedSubject(subjects[0]);
                }
            } catch (_err) {
                setClassLevel("");
                setUserSubjects([]);
            }
        };

        loadUser();
    }, []);

    // Fetch subjects and their topics
    useEffect(() => {
        if (!classLevel) return;

        const fetchSubjectsAndTopics = async () => {
            setLoading(true);
            try {
                const subjectsWithCounts = await getSubjectsWithTopicCounts({
                    classLevel,
                    selectedSubject,
                });
                setSubjectsWithTopics(subjectsWithCounts);
            } catch (e) {
                console.error("Failed to load subjects/topics", e);
            } finally {
                setLoading(false);
            }
        };

        fetchSubjectsAndTopics();
    }, [classLevel, selectedSubject, getSubjectsWithTopicCounts]);

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

            {/* Subject Picker */}
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
                subjectsWithTopics
                    .filter((s) => s.topicCount > 0)
                    .map((subject) => (
                        <Pressable
                            key={subject.id}
                            style={styles.card}
                            onPress={() =>
                                router.push({
                                    pathname: "/subject-topics",
                                    params: {
                                        subject: subject.name,
                                        classLevel,
                                    },
                                })
                            }
                        >
                            <View style={styles.cardHeader}>
                                <Feather name="book" size={22} color={colors.secondary} />
                                <Text style={styles.cardTitle}>{subject.name}</Text>
                            </View>

                            <Text style={styles.meta}>Class: {classLevel}</Text>
                            <Text style={styles.meta}>Topics: {subject.topicCount}</Text>
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
