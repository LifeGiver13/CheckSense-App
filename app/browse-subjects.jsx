import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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

const safeParseJSON = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSubjectName = (subject) => {
  if (!subject) return "";
  if (typeof subject === "string") return subject;
  if (typeof subject === "object") {
    return String(subject.name || subject.label || subject.value || "");
  }
  return String(subject);
};

const normalizeSubjectList = (subjects) => {
  if (!Array.isArray(subjects)) return [];
  return subjects
    .map((subject) => normalizeSubjectName(subject).trim())
    .filter((subject) => subject.length > 0);
};

export default function BrowseSubjects() {
  const router = useRouter();

  const [classLevel, setClassLevel] = useState("");
  const [userSubjects, setUserSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjectsWithTopics, setSubjectsWithTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem("auth_user");
        if (!raw) {
          if (isMounted) setLoading(false);
          return;
        }

        const user = safeParseJSON(raw, null);
        if (!user) {
          if (isMounted) setLoading(false);
          return;
        }

        const defaultClass = String(user?.profile?.defaultClass || "");
        const normalizedSubjects = normalizeSubjectList(user?.profile?.subjects);

        if (!isMounted) return;

        setClassLevel(defaultClass);
        setUserSubjects(normalizedSubjects);
        setSelectedSubject(normalizedSubjects[0] || "");
      } catch (err) {
        console.log("Failed to load user:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!classLevel) {
      setSubjectsWithTopics([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchSubjectsAndTopics = async () => {
      setLoading(true);

      try {
        const subjectWhere = { classLevel };
        if (selectedSubject) subjectWhere.name = selectedSubject;

        const subjectParams = new URLSearchParams({
          where: JSON.stringify(subjectWhere),
        });

        const topicsWhere = { classLevel };
        if (selectedSubject) topicsWhere.subject = selectedSubject;

        const topicsParams = new URLSearchParams({
          where: JSON.stringify(topicsWhere),
        });

        const [resSubjects, resTopics] = await Promise.all([
          fetch(`${API_BASE_URL}/v2/subjects?${subjectParams.toString()}`, {
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/v2/topics?${topicsParams.toString()}`, {
            signal: controller.signal,
          }),
        ]);

        const [jsonSubjects, jsonTopics] = await Promise.all([
          resSubjects.json(),
          resTopics.json(),
        ]);

        if (!isMounted) return;

        const subjects = Array.isArray(jsonSubjects?.data) ? jsonSubjects.data : [];
        const topics = Array.isArray(jsonTopics?.data) ? jsonTopics.data : [];

        const validTopics = topics.filter(
          (topic) => Array.isArray(topic?.subtopics) && topic.subtopics.length > 0
        );

        const topicCountBySubject = validTopics.reduce((acc, topic) => {
          const topicSubject = normalizeSubjectName(topic?.subject).trim();
          if (!topicSubject) return acc;
          acc[topicSubject] = (acc[topicSubject] || 0) + 1;
          return acc;
        }, {});

        const merged = subjects.map((subject) => {
          const subjectName = normalizeSubjectName(subject?.name).trim();

          return {
            ...subject,
            name: subjectName,
            topicCount: topicCountBySubject[subjectName] || 0,
          };
        });

        setSubjectsWithTopics(merged);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to load subjects/topics", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSubjectsAndTopics();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [classLevel, selectedSubject]);

  const renderedSubjects = useMemo(
    () => subjectsWithTopics.filter((subject) => Number(subject?.topicCount || 0) > 0),
    [subjectsWithTopics]
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Browse Subjects</Text>

      <Text style={styles.label}>Class</Text>
      <Picker selectedValue={classLevel} onValueChange={setClassLevel} style={styles.picker}>
        <Picker.Item label="Select class..." value="" />
        <Picker.Item label="Form 1" value="Form 1" />
        <Picker.Item label="Form 2" value="Form 2" />
        <Picker.Item label="Form 3" value="Form 3" />
        <Picker.Item label="Form 4" value="Form 4" />
        <Picker.Item label="Form 5" value="Form 5" />
        <Picker.Item label="Lower Sixth" value="Lower Sixth" />
        <Picker.Item label="Upper Sixth" value="Upper Sixth" />
      </Picker>

      <Text style={styles.label}>Subject</Text>
      <Picker selectedValue={selectedSubject} onValueChange={setSelectedSubject} style={styles.picker}>
        <Picker.Item label="All subjects" value="" />
        {userSubjects.map((subject) => (
          <Picker.Item key={subject} label={subject} value={subject} />
        ))}
      </Picker>

      {loading ? (
        <ActivityIndicator size="large" color={colors.secondary} />
      ) : (
        renderedSubjects.map((subject) => (
          <Pressable
            key={subject?.id || subject?.name}
            style={styles.card}
            onPress={() =>
              subject?.name &&
              classLevel &&
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
