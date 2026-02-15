import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors } from "../theme/colors.jsx";
import { API_BASE_URL } from "../theme/constants.jsx";

const DURATIONS = [
  { label: "Short", value: "short" },
  { label: "Medium", value: "medium" },
  { label: "Long", value: "long" },
];

const getParamValue = (value) => (Array.isArray(value) ? value[0] : value);

const sanitizeTopicList = (items) => {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const subtopics = Array.isArray(item.subtopics) ? item.subtopics.filter(Boolean) : [];

      if (!item.name || subtopics.length === 0) return null;

      return {
        id: item.id || item.name,
        name: String(item.name),
        generalObjective: String(item.generalObjective || ""),
        subtopics: subtopics.map((subtopic) => String(subtopic)),
      };
    })
    .filter(Boolean);
};

export default function SubjectTopics() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const subject = String(getParamValue(params.subject) || "");
  const classLevel = String(getParamValue(params.classLevel) || "");

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDurations, setSelectedDurations] = useState({});

  useEffect(() => {
    if (!subject || !classLevel) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const fetchTopics = async () => {
      setLoading(true);

      try {
        const where = { subject, classLevel };
        const query = new URLSearchParams({ where: JSON.stringify(where) });
        const res = await fetch(`${API_BASE_URL}/v2/topics?${query.toString()}`, {
          signal: controller.signal,
        });

        const json = await res.json();
        if (!isMounted) return;

        setTopics(sanitizeTopicList(json?.data));
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch topics", err);
          Alert.alert("Error", "Failed to load topics");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTopics();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [classLevel, subject]);

  const topicCount = useMemo(() => topics.length, [topics]);

  const handleDurationSelect = (topicName, subtopicName, duration) => {
    if (!duration) return;

    const topicObj = topics.find((topic) => topic.name === topicName);
    if (!topicObj) return;

    const pickerKey = `${topicName}-${subtopicName || "all"}`;
    setSelectedDurations((prev) => ({ ...prev, [pickerKey]: duration }));

    const includeAllSubtopics = !subtopicName || subtopicName === topicName;
    const selectedSubtopic = includeAllSubtopics ? "" : String(subtopicName);

    router.push({
      pathname: "/quiz-generating",
      params: {
        classLevel,
        subject,
        topic: topicName,
        subtopicName: selectedSubtopic,
        includeAllSubtopics: includeAllSubtopics ? "1" : "0",
        duration,
        quizType: "mcq",
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subjectTitle}>{subject || "Subject"}</Text>
        <Text style={styles.meta}>Class: {classLevel || "Not set"}</Text>
        <Text style={styles.meta}>Topics: {topicCount}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.secondary} />
      ) : (
        topics.map((topic) => (
          <View key={topic.id} style={styles.topicCard}>
            <Text style={styles.topicName}>{topic.name}</Text>

            <View style={styles.subtopicContainer}>
              <Text style={styles.subtopicText}>Take Quiz: All Subtopics</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map((duration) => {
                  const selectedKey = `${topic.name}-all`;
                  const isSelected = selectedDurations[selectedKey] === duration.value;
                  return (
                    <Pressable
                      key={duration.value}
                      onPress={() => handleDurationSelect(topic.name, "", duration.value)}
                      style={[styles.durationBtn, isSelected && styles.durationBtnActive]}
                    >
                      <Text style={[styles.durationBtnText, isSelected && styles.durationBtnTextActive]}>
                        {duration.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {topic.subtopics.map((subtopic) => (
              <View key={subtopic} style={styles.subtopicContainer}>
                <Text style={styles.subtopicText}>{subtopic}</Text>
                <View style={styles.durationRow}>
                  {DURATIONS.map((duration) => {
                    const selectedKey = `${topic.name}-${subtopic}`;
                    const isSelected = selectedDurations[selectedKey] === duration.value;
                    return (
                      <Pressable
                        key={duration.value}
                        onPress={() => handleDurationSelect(topic.name, subtopic, duration.value)}
                        style={[styles.durationBtn, isSelected && styles.durationBtnActive]}
                      >
                        <Text style={[styles.durationBtnText, isSelected && styles.durationBtnTextActive]}>
                          {duration.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
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
    backgroundColor: `${colors.secondaryLight}10`,
  },
  subtopicText: { fontSize: 14, color: colors.mutedBlack, marginBottom: 4 },
  durationRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  durationBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    backgroundColor: colors.white,
  },
  durationBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  durationBtnText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "600",
  },
  durationBtnTextActive: {
    color: colors.white,
  },
});
