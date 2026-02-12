import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { colors } from "../theme/colors.jsx";
import { API_BASE_URL } from "../theme/constants.jsx";

const DURATIONS = [
  { label: "Short (7 questions • 5-10 min)", value: "short" },
  { label: "Medium (15 questions • 15-20 min)", value: "medium" },
  { label: "Long (20 questions • 20-40 min)", value: "long" },
];

export default function SubjectTopics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { subject, classLevel } = params;

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Track which topic/subtopic's duration picker is visible
  const [activePicker, setActivePicker] = useState({
    topic: "",
    subtopic: "",
  });

  // Track selected duration per topic/subtopic
  const [selectedDurations, setSelectedDurations] = useState({});

  // Fetch topics
  useEffect(() => {
    if (!subject || !classLevel) return;

    const fetchTopics = async () => {
      setLoading(true);
      try {
        const where = { subject, classLevel };
        const params = new URLSearchParams({ where: JSON.stringify(where) });
        const res = await fetch(`${API_BASE_URL}/v2/topics?${params.toString()}`);
        const json = await res.json();
        const validTopics = (json.data || []).filter(
          (t) => Array.isArray(t.subtopics) && t.subtopics.length > 0
        );
        setTopics(validTopics);
      } catch (e) {
        console.error("Failed to fetch topics", e);
        Alert.alert("Error", "Failed to load topics");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [subject, classLevel]);

  const handleDurationSelect = (topicName, subtopicName, duration) => {
    const topicObj = topics.find((t) => t.name === topicName);
    const payload = [
      {
        name: topicObj.name,
        description: topicObj.generalObjective || "",
        subtopic:
          subtopicName === "" || subtopicName === topicName
            ? topicObj.subtopics.map((st) => ({ name: st, description: "" }))
            : [{ name: subtopicName, description: "" }],
      },
    ];

    // Immediately redirect to quiz-generating
    router.push({
      pathname: "/quiz-generating",
      params: {
        classLevel,
        subject,
        topic: topicName,
        subTopics: JSON.stringify(payload),
        duration,
        quizType: "mcq",
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subjectTitle}>{subject}</Text>
        <Text style={styles.meta}>Class: {classLevel}</Text>
        <Text style={styles.meta}>Topics: {topics.length}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.secondary} />
      ) : (
        topics.map((topic) => (
          <View key={topic.id} style={styles.topicCard}>
            <Text style={styles.topicName}>{topic.name}</Text>

            {/* All Subtopics option */}
            <View style={styles.subtopicContainer}>
              <Text style={styles.subtopicText}>Take Quiz: All Subtopics</Text>
              <Picker
                selectedValue={selectedDurations[`${topic.name}-all`] || ""}
                onValueChange={(val) => handleDurationSelect(topic.name, "", val)}
                style={styles.picker}
              >
                <Picker.Item label="Select duration..." value="" />
                {DURATIONS.map((d) => (
                  <Picker.Item key={d.value} label={d.label} value={d.value} />
                ))}
              </Picker>
            </View>

            {/* Individual subtopics */}
            {topic.subtopics.map((st) => (
              <View key={st} style={styles.subtopicContainer}>
                <Text style={styles.subtopicText}>{st}</Text>
                <Picker
                  selectedValue={selectedDurations[`${topic.name}-${st}`] || ""}
                  onValueChange={(val) => handleDurationSelect(topic.name, st, val)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select duration..." value="" />
                  {DURATIONS.map((d) => (
                    <Picker.Item key={d.value} label={d.label} value={d.value} />
                  ))}
                </Picker>
              </View>
            ))}

            <Text style={styles.topicObjective}>
              Objective: {topic.generalObjective || "No objective provided"}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: colors.white },
  header: { marginBottom: 20 },
  subjectTitle: { fontSize: 22, fontWeight: "bold" },
  meta: { fontSize: 14, color: colors.mutedBlack },
  topicCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    marginBottom: 16,
  },
  topicName: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  topicObjective: { fontSize: 14, color: colors.mutedBlack, marginTop: 8 },
  subtopicContainer: {
    padding: 10,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 10,
    marginVertical: 6,
    backgroundColor: colors.secondaryLight + "10", // light tint
  },
  subtopicText: { fontSize: 14, color: colors.mutedBlack, marginBottom: 4 },
  picker: { width: "100%", backgroundColor: "#f5f5f5" },
});
