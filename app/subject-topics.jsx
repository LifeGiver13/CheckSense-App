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

import { useCurriculum } from "../contexts/CurriculumContext.jsx";
import { useQuizGeneration } from "../contexts/QuizgenerationContext.jsx";
import { colors } from "../theme/colors.jsx";

const DURATIONS = [
  { label: "Short (7 questions | 5-10 min)", value: "short" },
  { label: "Medium (15 questions | 15-20 min)", value: "medium" },
  { label: "Long (20 questions | 20-40 min)", value: "long" },
];

export default function SubjectTopics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getTopics } = useCurriculum();
  const { setQuizConfig } = useQuizGeneration();
  const subject = Array.isArray(params.subject) ? params.subject[0] : params.subject;
  const classLevel = Array.isArray(params.classLevel)
    ? params.classLevel[0]
    : params.classLevel;

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDurations, setSelectedDurations] = useState({});

  useEffect(() => {
    if (!subject || !classLevel) return;

    const fetchTopics = async () => {
      setLoading(true);
      try {
        const data = await getTopics({ subject, classLevel });
        const validTopics = (data || []).filter(
          (topic) => Array.isArray(topic.subtopics) && topic.subtopics.length > 0
        );
        setTopics(validTopics);
      } catch (error) {
        console.error("Failed to fetch topics", error);
        Alert.alert("Error", "Failed to load topics");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [subject, classLevel, getTopics]);

  const handleDurationSelect = (topicName, subtopicName, duration) => {
    if (!duration) return;

    const selectedKey = `${topicName}-${subtopicName || "all"}`;
    setSelectedDurations((prev) => ({
      ...prev,
      [selectedKey]: duration,
    }));

    const topicObj = topics.find((topic) => topic.name === topicName);
    if (!topicObj) return;

    const payload = [
      {
        name: topicObj.name,
        description: topicObj.generalObjective || "",
        subtopic:
          subtopicName === "" || subtopicName === topicName
            ? topicObj.subtopics.map((subtopic) => ({
                name: subtopic,
                description: "",
              }))
            : [{ name: subtopicName, description: "" }],
      },
    ];

    setQuizConfig({
      classLevel,
      subject,
      topic: topicName,
      topics: payload,
      duration,
      quizType: "mcq",
    });

    router.push("/quiz-generating");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subjectTitle}>{subject}</Text>
        <Text style={styles.headerCaption}>Choose a topic and duration</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Class</Text>
            <Text style={styles.metaChipValue}>{classLevel}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaChipLabel}>Topics</Text>
            <Text style={styles.metaChipValue}>{topics.length}</Text>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={colors.secondary} />
          <Text style={styles.loadingText}>Loading topic suggestions...</Text>
        </View>
      ) : topics.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No Topics Available</Text>
          <Text style={styles.emptyText}>
            Try another subject or class level to see available subtopics.
          </Text>
        </View>
      ) : (
        topics.map((topic, topicIndex) => (
          <View key={topic.id || topic.name} style={styles.topicCard}>
            <View style={styles.topicHeader}>
              <Text style={styles.topicTag}>Topic {topicIndex + 1}</Text>
              <Text style={styles.topicName}>{topic.name}</Text>
            </View>

            <View style={styles.subtopicContainer}>
              <Text style={styles.subtopicTitle}>All Subtopics</Text>
              <Text style={styles.subtopicHint}>
                Generate one quiz covering the full topic.
              </Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={selectedDurations[`${topic.name}-all`] || ""}
                  onValueChange={(value) => handleDurationSelect(topic.name, "", value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select duration..." value="" />
                  {DURATIONS.map((duration) => (
                    <Picker.Item
                      key={duration.value}
                      label={duration.label}
                      value={duration.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {topic.subtopics.map((subtopic) => (
              <View key={subtopic} style={styles.subtopicContainer}>
                <Text style={styles.subtopicTitle}>{subtopic}</Text>
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={selectedDurations[`${topic.name}-${subtopic}`] || ""}
                    onValueChange={(value) =>
                      handleDurationSelect(topic.name, subtopic, value)
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Select duration..." value="" />
                    {DURATIONS.map((duration) => (
                      <Picker.Item
                        key={duration.value}
                        label={duration.label}
                        value={duration.value}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            ))}

            <View style={styles.objectiveBox}>
              <Text style={styles.objectiveLabel}>Learning Objective</Text>
              <Text style={styles.topicObjective}>
                {topic.generalObjective || "No objective provided"}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: "#f4f7fb",
  },
  header: {
    marginBottom: 18,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: "#0d1b2a",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 3,
  },
  subjectTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
    marginBottom: 4,
  },
  headerCaption: {
    fontSize: 13,
    color: "#d6e4ff",
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  metaChipLabel: {
    fontSize: 11,
    color: "#d7e5ff",
  },
  metaChipValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },
  loadingBox: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: colors.mutedBlack,
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dbe7ff",
    backgroundColor: colors.white,
    padding: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.black,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.mutedBlack,
  },
  topicCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: "#dce8ff",
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#102a43",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  topicHeader: {
    marginBottom: 8,
  },
  topicTag: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
    backgroundColor: "#eef4ff",
    marginBottom: 8,
  },
  topicName: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.black,
  },
  subtopicContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#cfe1ff",
    borderRadius: 12,
    marginVertical: 6,
    backgroundColor: "#f7faff",
  },
  subtopicTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.black,
    marginBottom: 4,
  },
  subtopicHint: {
    fontSize: 12,
    color: colors.mutedBlack,
    marginBottom: 8,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#d8e5ff",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  picker: {
    width: "100%",
    color: colors.mutedBlack,
  },
  objectiveBox: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: "#f5f9ff",
    borderWidth: 1,
    borderColor: "#dbe8ff",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  objectiveLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  topicObjective: {
    fontSize: 13,
    color: colors.mutedBlack,
    lineHeight: 19,
  },
});
