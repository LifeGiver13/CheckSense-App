import { Picker } from "@react-native-picker/picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCurriculum } from "../contexts/CurriculumContext.jsx";
import { useLastQuizTake } from "../contexts/LastQuizTake.jsx";
import { useQuizGeneration } from "../contexts/QuizgenerationContext.jsx";
import { useQuizSession } from "../contexts/QuizSessionContext.jsx";
import { formatProgressDate } from "../src/components/utils.js";
import { colors } from "../theme/colors.jsx";
const DURATIONS = [
  { label: "Short (7 questions | 5-10 min)", value: "short" },
  { label: "Medium (15 questions | 15-20 min)", value: "medium" },
  { label: "Long (20 questions | 20-40 min)", value: "long" },
];

const filterDurationsByDifficulty = (difficulty) => {
  switch (difficulty) {
    case "easy":
      return DURATIONS.filter((d) => d.value !== "short");
    case "medium":
      return DURATIONS.filter((d) => d.value !== "meduim"); // remove long
    case "hard":
      return DURATIONS.filter((d) => d.value === "long"); // only short
    default:
      return DURATIONS; // fallback: show all
  }
};
const MAX_SUBTOPICS_TO_RENDER = 10;
const MAX_SUBTOPICS_TO_SEND = 12;

const resolveParam = (value) => (Array.isArray(value) ? value[0] : value);
const getSubjectName = (subject) => {
  if (typeof subject === "string") return subject;
  if (subject && typeof subject === "object") return String(subject.name || "").trim();
  return "";
};
const getClassLevel = ({ classLevel, subject } = {}) => {
  const direct = String(classLevel || "").trim();
  if (direct) return direct;
  if (subject && typeof subject === "object") {
    return String(subject.classLevel || "").trim();
  }
  return "";
};

export default function SubjectTopics() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getTopics, getCachedTopics, getSubjectById } = useCurriculum();
  const { fetchAttemptById, fetchQuizById } = useQuizSession();
  const { setQuizConfig } = useQuizGeneration();
  const { progressTrackerById, getTopicProgress, getSubTopicProgress } = useLastQuizTake();
  const subjectIdParam = String(resolveParam(params.subjectId) || "").trim();
  const attemptIdParam = String(resolveParam(params.attemptId) || "").trim();
  const quizIdParam = String(resolveParam(params.quizId) || "").trim();

  const [topicMap, setTopicMap] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDurations, setSelectedDurations] = useState({});
  const [resolvedSubjectId, setResolvedSubjectId] = useState(
    String(subjectIdParam || "").trim()
  );
  const [resolvedSubject, setResolvedSubject] = useState("");
  const [resolvedClassLevel, setResolvedClassLevel] = useState("");
  const [resolvingSource, setResolvingSource] = useState(false);
  const [expandedTopic, setExpandedTopic] = useState("");
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const resolveSource = async () => {
      setResolvingSource(true);
      try {
        let nextSubjectId = String(subjectIdParam || "").trim();
        let nextSubject = "";
        let nextClassLevel = "";

        if (nextSubjectId) {
          try {
            const subjectData = await getSubjectById(nextSubjectId);
            nextSubject = String(subjectData?.name || "").trim();
            nextClassLevel = String(subjectData?.classLevel || "").trim();
          } catch (_err) {
            nextSubject = "";
            nextClassLevel = "";
          }
        }

        const needsFallback =
          !nextSubject ||
          !nextClassLevel ||
          (!nextSubjectId && (attemptIdParam || quizIdParam));

        if (needsFallback && (attemptIdParam || quizIdParam)) {
          let attemptData = null;
          let quizData = null;

          if (attemptIdParam) {
            attemptData = await fetchAttemptById(attemptIdParam);
          }

          const targetQuizId = String(
            quizIdParam || attemptData?.quizId || ""
          ).trim();

          if (targetQuizId) {
            quizData = await fetchQuizById(targetQuizId);
          }

          const fallbackSubjectId = String(
            quizData?.subjectId ||
            attemptData?.subjectId ||
            quizData?.subject?.id ||
            attemptData?.subject?.id ||
            ""
          ).trim();
          const fallbackSubject =
            getSubjectName(quizData?.subject) || getSubjectName(attemptData?.subject);
          const fallbackClassLevel =
            getClassLevel({
              classLevel: quizData?.classLevel,
              subject: quizData?.subject,
            }) ||
            getClassLevel({
              classLevel: attemptData?.classLevel,
              subject: attemptData?.subject,
            });

          if (!nextSubjectId && fallbackSubjectId) {
            nextSubjectId = fallbackSubjectId;
          }
          if (!nextSubject && fallbackSubject) {
            nextSubject = fallbackSubject;
          }
          if (!nextClassLevel && fallbackClassLevel) {
            nextClassLevel = fallbackClassLevel;
          }
        }

        if (nextSubjectId && (!nextSubject || !nextClassLevel)) {
          const subjectData = await getSubjectById(nextSubjectId);
          nextSubject = nextSubject || String(subjectData?.name || "").trim();
          nextClassLevel = nextClassLevel || String(subjectData?.classLevel || "").trim();
        }

        if (!isCancelled) {
          setResolvedSubjectId(nextSubjectId);
          setResolvedSubject(nextSubject);
          setResolvedClassLevel(nextClassLevel);
        }
      } catch (_err) {
        if (!isCancelled) {
          setResolvedSubjectId("");
          setResolvedSubject("");
          setResolvedClassLevel("");
          Alert.alert("Error", "Failed to load subject details.");
        }
      } finally {
        if (!isCancelled) {
          setResolvingSource(false);
        }
      }
    };

    resolveSource();

    return () => {
      isCancelled = true;
    };
  }, [
    subjectIdParam,
    attemptIdParam,
    quizIdParam,
    getSubjectById,
    fetchAttemptById,
    fetchQuizById,
  ]);



  useEffect(() => {
    if (!resolvedSubject || !resolvedClassLevel) {
      setTopics([]);
      setLoading(false);
      return;
    }
    const fetchTopics = async () => {
      setLoading(true);
      try {
        const cached = getCachedTopics({
          subject: resolvedSubject,
          classLevel: resolvedClassLevel,
        });
        const data = cached.length
          ? cached
          : await getTopics({
            subject: resolvedSubject,
            classLevel: resolvedClassLevel,
          });
        const validTopics = (data || []).filter(
          (topic) => Array.isArray(topic.subtopics) && topic.subtopics.length > 0
        );
        setTopics(validTopics);
        setExpandedTopic((prev) => {
          if (prev && validTopics.some((topic) => topic.name === prev)) {
            return prev;
          }
          return "";
        });
      } catch (error) {
        console.error("Failed to fetch topics", error);
        Alert.alert("Error", "Failed to load topics");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [resolvedSubject, resolvedClassLevel, getTopics, getCachedTopics]);

  useEffect(() => {
    if (!resolvedSubjectId) return;
    // console.log(resolvedSubjectId)

    const loadProgress = async () => {
      const result = await progressTrackerById(resolvedSubjectId);
      // console.log(result)
      // if (result.success === true) {
      //   console.log("Tracker:", result.tracker);
      // }
      setTopicMap(result.topicMap)
    };

    loadProgress();
  }, [resolvedSubjectId]);


  const handleDurationSelect = (topicName, subtopicName, duration) => {
    if (!duration) return;
    if (!resolvedSubject || !resolvedClassLevel) return;
    if (isNavigatingRef.current) return;

    const selectedKey = `${topicName}-${subtopicName || "all"}`;
    setSelectedDurations((prev) => ({
      ...prev,
      [selectedKey]: duration,
    }));

    const topicObj = topics.find((topic) => topic.name === topicName);
    if (!topicObj) return;

    const selectedSubtopics =
      subtopicName === "" || subtopicName === topicName
        ? topicObj.subtopics
          .slice(0, MAX_SUBTOPICS_TO_SEND)
          .map((subtopic) => String(subtopic || "").trim())
          .filter(Boolean)
        : [String(subtopicName || "").trim()].filter(Boolean);

    if (selectedSubtopics.length === 0) {
      Alert.alert("Error", "No valid subtopics available for this selection.");
      return;
    }

    const payload = [
      {
        name: topicObj.name,
        description: topicObj.generalObjective || "",
        subtopic: selectedSubtopics.map((subtopic) => ({
          name: subtopic,
          description: "",
        })),
      },
    ];

    setQuizConfig({
      classLevel: resolvedClassLevel,
      subjectId: resolvedSubjectId || null,
      subject: resolvedSubject,
      topic: topicName,
      topics: payload,
      duration,
      quizType: "mcq",
    });

    isNavigatingRef.current = true;
    router.replace("/quiz-generating");
  };


  return (
    <FlatList
      data={
        resolvingSource || loading || !resolvedSubject || !resolvedClassLevel
          ? []
          : topics
      }
      keyExtractor={(topic, index) => topic.id || topic.name || String(index)}
      initialNumToRender={3}
      maxToRenderPerBatch={3}
      windowSize={5}
      contentContainerStyle={styles.container}
      ListHeaderComponent={
        <>
          <View style={styles.header}>
            <Text style={styles.subjectTitle}>{resolvedSubject || "Subject"}</Text>
            <Text style={styles.headerCaption}>Choose a topic and duration</Text>
            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Class</Text>
                <Text style={styles.metaChipValue}>{resolvedClassLevel || "--"}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaChipLabel}>Topics</Text>
                <Text style={styles.metaChipValue}>{topics.length}</Text>
              </View>
            </View>
          </View>
          <Pressable style={styles.emptyCard} onPress={() => router.push("/browse-subjects")}>
            <Text style={styles.emptyText}>Browse other subjects</Text>
          </Pressable>
        </>
      }
      ListEmptyComponent={
        resolvingSource || loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={styles.loadingText}>Loading topic suggestions...</Text>
          </View>
        ) : !resolvedSubject || !resolvedClassLevel ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Subject Details Missing</Text>
            <Text style={styles.emptyText}>
              Please reopen this page from Browse Subjects or Results.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Topics Available</Text>
            <Text style={styles.emptyText}>
              Try another subject or class level to see available subtopics.
            </Text>
          </View>
        )
      }
      renderItem={({ item: topic, index: topicIndex }) => {
        const isExpanded = expandedTopic === topic.name;
        const topicProgress = getTopicProgress(topicMap, topic.name);
        const availableDurations = filterDurationsByDifficulty(topicProgress?.lastQuizDifficulty);
        // console.log("Curriculum topic id:", topic)
        // console.log("Curriculum topic progress:", topicProgress)

        return (
          <View style={styles.topicCard}>
            <View style={styles.topicHeaderRow}>
              <View style={styles.topicHeader}>
                <Text style={styles.topicTag}>Topic {topicIndex + 1}</Text>
                <Text style={styles.topicName}>{topic.name}</Text>
                <Text style={styles.quizType}>
                  Last Quiz Date: {topicProgress ? formatProgressDate(topicProgress.lastQuizDate) : "Not attempted"}
                </Text>
              </View>

            </View>
            <View style={styles.btnCont}>
              <Pressable
                onPress={() => setExpandedTopic(isExpanded ? "" : topic.name)}
                style={styles.expandBtn}
              >
                <Text style={styles.expandBtnText}>{isExpanded ? "Hide" : "Open"}</Text>
              </Pressable>
            </View>
            {isExpanded && (
              <>
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
                      {availableDurations.map((duration) => (
                        <Picker.Item
                          key={duration.value}
                          label={duration.label}
                          value={duration.value}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                {topic.subtopics.slice(0, MAX_SUBTOPICS_TO_RENDER).map((subtopic) => {
                  // console.log(topic)
                  const subProgress = getSubTopicProgress(topicMap, topic.name, subtopic);
                  const availableSubDurations = filterDurationsByDifficulty(subProgress?.lastQuizDifficulty);
                  console.log(subProgress?.lastQuizDifficulty || null)
                  // console.log('Subtopic Id ==', subProgress)
                  return (
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
                          {availableSubDurations.map((duration) => (
                            <Picker.Item
                              key={duration.value}
                              label={duration.label}
                              value={duration.value}
                            />
                          ))}
                        </Picker>
                      </View>
                      <Text style={styles.expandBtnText}>
                        Last Quiz Date: {subProgress ? formatProgressDate(subProgress.lastQuizDate) : "Not attempted"}
                      </Text>
                      <Text>{subProgress?.lastQuizDifficulty ? `Last difficulty was ${subProgress?.lastQuizDifficulty} so it will be hidden from the selection` : 'No previous difficulty'}</Text>
                    </View>)
                }
                )
                }

                {topic.subtopics.length > MAX_SUBTOPICS_TO_RENDER && (
                  <Text style={styles.subtopicHint}>
                    Showing first {MAX_SUBTOPICS_TO_RENDER} subtopics for performance.
                  </Text>
                )}

                <View style={styles.objectiveBox}>
                  <Text style={styles.objectiveLabel}>Learning Objective</Text>
                  <Text style={styles.topicObjective}>
                    {topic.generalObjective || "No objective provided"}
                  </Text>
                </View>
              </>
            )}
          </View>
        );
      }}
    />
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
    marginBottom: 20,
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
  topicHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  expandBtn: {
    borderWidth: 1,
    borderColor: "#cfe1ff",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f3f8ff",
  },
  btnCont: {
    marginTop: 10,
  },
  expandBtnText: {
    color: colors.primaryDark,
    fontWeight: "600",
    fontSize: 12,
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
