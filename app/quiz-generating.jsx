import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, AppState, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../contexts/AuthContext";
import { useQuizGeneration } from "../contexts/QuizgenerationContext";
import { colors } from "../theme/colors";
import { API_BASE_URL } from "../theme/constants";

const encouragingMessages = [
  { icon: "activity", text: "Crafting challenging questions just for you..." },
  { icon: "book-open", text: "Selecting the best content from your topics..." },
  { icon: "award", text: "Adding a touch of magic to your quiz..." },
  { icon: "coffee", text: "Great things take time. Almost there..." },
];

const getParamValue = (value, fallback = "") => {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
};

const safeParseJSON = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeSubject = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return String(value.name || "");
  return String(value);
};

const normalizeQuizType = (value, fallback = "mcq") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "saq" || normalized === "short_answer" || normalized === "short-answer") {
    return "saq";
  }
  if (normalized === "mcq" || normalized === "multiple_choice" || normalized === "multiple-choice") {
    return "mcq";
  }
  return fallback;
};

const normalizeText = (value, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value).trim();
  if (typeof value === "object") {
    const preferred = value.name ?? value.label ?? value.value ?? value.text;
    if (preferred !== null && preferred !== undefined) return String(preferred).trim();
    return fallback;
  }
  return fallback;
};

const normalizeSubtopicItem = (item) => {
  if (item === null || item === undefined) return null;

  if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
    const name = String(item).trim();
    return name ? { name, description: "" } : null;
  }

  if (typeof item === "object") {
    const name = normalizeText(
      item.name ?? item.subtopic ?? item.title ?? item.label ?? item.value,
      ""
    );
    if (!name) return null;
    return {
      name,
      description: normalizeText(item.description, ""),
    };
  }

  return null;
};

const normalizeTopicItem = (topic, fallbackTopicName = "General") => {
  if (!topic || typeof topic !== "object") return null;

  const name = normalizeText(topic.name ?? topic.topic, normalizeText(fallbackTopicName, "General"));
  if (!name) return null;

  const description = normalizeText(topic.description ?? topic.generalObjective, "");

  const sourceSubtopics = Array.isArray(topic.subtopic)
    ? topic.subtopic
    : Array.isArray(topic.subtopics)
      ? topic.subtopics
      : Array.isArray(topic.subTopic)
        ? topic.subTopic
        : [];

  const normalizedSubtopics = sourceSubtopics
    .map((subtopic) => normalizeSubtopicItem(subtopic))
    .filter(Boolean);

  return {
    name,
    description,
    subtopic:
      normalizedSubtopics.length > 0
        ? normalizedSubtopics
        : [{ name, description: "" }],
  };
};

const normalizeTopicsPayload = (topics, fallbackTopicName = "General") => {
  const normalized = (Array.isArray(topics) ? topics : [])
    .map((topic) => normalizeTopicItem(topic, fallbackTopicName))
    .filter(Boolean);

  if (normalized.length > 0) return normalized;

  const fallbackName = normalizeText(fallbackTopicName, "General");
  return [
    {
      name: fallbackName,
      description: "",
      subtopic: [{ name: fallbackName, description: "" }],
    },
  ];
};

export default function QuizGenerating() {
  const params = useLocalSearchParams();
  const { token } = useAuth();
  const { addPendingQuiz } = useQuizGeneration();

  const fromQuizId = String(getParamValue(params.fromQuizId, ""));
  const subjectParam = getParamValue(params.subject, "");
  const topicParam = getParamValue(params.topic, "");
  const subTopicsParam = getParamValue(params.subTopics, "[]");
  const subtopicNamesParam = getParamValue(params.subtopicNames, "[]");
  const subtopicNameParam = getParamValue(params.subtopicName, "");
  const includeAllSubtopicsParam = String(getParamValue(params.includeAllSubtopics, "0"));
  const durationParam = String(getParamValue(params.duration, "short"));
  const quizTypeParam = String(getParamValue(params.quizType, "mcq"));
  const classLevelParam = String(getParamValue(params.classLevel, ""));
  const difficultyParam = String(getParamValue(params.difficulty, "easy"));
  const progressionStepParam = Number.parseInt(String(getParamValue(params.progressionStep, "0")), 10);

  const initialSubject = normalizeSubject(subjectParam);
  const initialTopic = String(topicParam || "");
  const requestedDifficulty = useMemo(() => {
    const value = String(difficultyParam || "").trim().toLowerCase();
    return ["easy", "medium", "hard"].includes(value) ? value : "easy";
  }, [difficultyParam]);
  const requestedSingleSubtopic = useMemo(
    () => normalizeText(subtopicNameParam, ""),
    [subtopicNameParam]
  );
  const includeAllSubtopics = useMemo(
    () => includeAllSubtopicsParam === "1",
    [includeAllSubtopicsParam]
  );
  const requestedQuizType = useMemo(() => {
    if (Number.isFinite(progressionStepParam) && progressionStepParam >= 4) return "saq";
    return normalizeQuizType(quizTypeParam, "mcq");
  }, [progressionStepParam, quizTypeParam]);
  const generationKey = useMemo(
    () =>
      JSON.stringify({
        fromQuizId,
        subjectParam,
        topicParam,
        subTopicsParam,
        subtopicNamesParam,
        subtopicNameParam: requestedSingleSubtopic,
        includeAllSubtopics,
        durationParam,
        quizTypeParam,
        requestedQuizType,
        classLevelParam,
        requestedDifficulty,
        progressionStepParam,
      }),
    [
      classLevelParam,
      durationParam,
      fromQuizId,
      quizTypeParam,
      requestedQuizType,
      requestedDifficulty,
      progressionStepParam,
      requestedSingleSubtopic,
      includeAllSubtopics,
      subTopicsParam,
      subtopicNamesParam,
      subjectParam,
      topicParam,
    ]
  );

  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [userId, setUserId] = useState(null);
  const [quizCreated, setQuizCreated] = useState(false);
  const [displaySubject, setDisplaySubject] = useState(initialSubject);
  const [displayTopic, setDisplayTopic] = useState(initialTopic);
  const startedGenerationKeysRef = useRef(new Set());

  const durationMap = { short: 7, medium: 15, long: 20 };
  const totalQuestions = durationMap[durationParam] || 7;

  const parsedTopics = useMemo(() => {
    if (typeof subTopicsParam !== "string") return [];
    const parsed = safeParseJSON(subTopicsParam, []);
    return Array.isArray(parsed) ? parsed : [];
  }, [subTopicsParam]);

  const parsedSubtopicNames = useMemo(() => {
    if (typeof subtopicNamesParam !== "string") return [];
    const parsed = safeParseJSON(subtopicNamesParam, []);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeText(item, ""))
      .filter((item) => item.length > 0);
  }, [subtopicNamesParam]);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("auth_user");
      const parsed = safeParseJSON(stored, null);
      if (!parsed) return;
      setUserId(
        parsed.uid ||
        parsed.userId ||
        parsed.id ||
        parsed?.user?.uid ||
        parsed?.user?.userId ||
        parsed?.user?.id ||
        null
      );
    })();
  }, []);

  useEffect(() => {
    setProgress(0);
    setMessageIndex(0);
    setElapsedTime(0);
    setQuizCreated(false);
    setDisplaySubject(initialSubject);
    setDisplayTopic(initialTopic);
  }, [generationKey, initialSubject, initialTopic]);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % encouragingMessages.length);
    }, 8000);

    const difficultyMultiplier =
      requestedDifficulty === "hard" ? 0.6 : requestedDifficulty === "medium" ? 0.8 : 1;

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        if (p < 50) return p + 2 * difficultyMultiplier;
        if (p < 80) return p + 1 * difficultyMultiplier;
        return p + 0.5 * difficultyMultiplier;
      });
    }, 1500);

    const timerInterval = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
      clearInterval(timerInterval);
    };
  }, [generationKey, requestedDifficulty]);

  useEffect(() => {
    if (!userId || quizCreated) return;
    if (startedGenerationKeysRef.current.has(generationKey)) return;

    startedGenerationKeysRef.current.add(generationKey);

    const controller = new AbortController();
    let isMounted = true;

    const createQuiz = async () => {
      try {
        let resolvedSubject = initialSubject;
        let resolvedTopic = initialTopic;
        let resolvedClassLevel = classLevelParam;
        let resolvedTopics = parsedTopics;

        if (fromQuizId) {
          const sourceHeaders = token ? { Authorization: `Bearer ${token}` } : {};
          const sourceRes = await fetch(`${API_BASE_URL}/v2/quiz/${fromQuizId}`, {
            headers: sourceHeaders,
            signal: controller.signal,
          });

          if (!sourceRes.ok) throw new Error("Failed to fetch source quiz");

          const sourceJson = await sourceRes.json();
          const sourceQuiz = sourceJson?.data || sourceJson;

          resolvedSubject = normalizeSubject(sourceQuiz?.subject) || resolvedSubject;
          resolvedTopic = normalizeText(sourceQuiz?.topics?.[0]?.name, resolvedTopic || "Topic");
          resolvedClassLevel = normalizeText(
            sourceQuiz?.classLevel || sourceQuiz?.subject?.classLevel,
            resolvedClassLevel || ""
          );

          const sourceTopics = Array.isArray(sourceQuiz?.topics) ? sourceQuiz.topics : [];
          if (sourceTopics.length > 0) {
            resolvedTopics = sourceTopics;
          }
        }

        const finalSubject = normalizeText(resolvedSubject, "");
        const finalTopic = normalizeText(resolvedTopic, "Topic");
        const finalClassLevel = normalizeText(resolvedClassLevel, classLevelParam || "");
        let normalizedTopics = normalizeTopicsPayload(resolvedTopics, finalTopic);

        if ((!Array.isArray(resolvedTopics) || resolvedTopics.length === 0) && parsedSubtopicNames.length > 0) {
          normalizedTopics = [
            {
              name: finalTopic,
              description: "",
              subtopic: parsedSubtopicNames.map((subtopic) => ({
                name: subtopic,
                description: "",
              })),
            },
          ];
        }

        if (
          (!Array.isArray(resolvedTopics) || resolvedTopics.length === 0) &&
          parsedSubtopicNames.length === 0 &&
          !fromQuizId
        ) {
          let derivedSubtopics = [];

          if (includeAllSubtopics) {
            try {
              const where = {
                subject: finalSubject,
                classLevel: finalClassLevel,
                name: finalTopic,
              };
              const query = new URLSearchParams({ where: JSON.stringify(where) });
              const topicRes = await fetch(`${API_BASE_URL}/v2/topics?${query.toString()}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                signal: controller.signal,
              });

              if (topicRes.ok) {
                const topicJson = await topicRes.json();
                const topicRows = Array.isArray(topicJson?.data) ? topicJson.data : [];
                const matchedTopic =
                  topicRows.find((item) => normalizeText(item?.name, "") === finalTopic) || topicRows[0];

                derivedSubtopics = (Array.isArray(matchedTopic?.subtopics) ? matchedTopic.subtopics : [])
                  .map((subtopic) => normalizeText(subtopic, ""))
                  .filter((subtopic) => subtopic.length > 0);
              }
            } catch (topicErr) {
              if (topicErr.name !== "AbortError") {
                console.log("Topic subtopic fetch fallback used:", topicErr);
              }
            }
          } else if (requestedSingleSubtopic) {
            derivedSubtopics = [requestedSingleSubtopic];
          }

          if (derivedSubtopics.length > 0) {
            normalizedTopics = [
              {
                name: finalTopic,
                description: "",
                subtopic: derivedSubtopics.map((subtopic) => ({
                  name: subtopic,
                  description: "",
                })),
              },
            ];
          }
        }

        const normalizedDifficulty = requestedDifficulty;

        if (!finalSubject || !finalTopic) {
          if (isMounted) {
            Alert.alert("Missing quiz details", "Please go back and select subject/topic again.");
          }
          return;
        }

        if (isMounted) {
          setDisplaySubject(finalSubject);
          setDisplayTopic(finalTopic);
        }

        const payload = {
          subject: { name: finalSubject, classLevel: finalClassLevel },
          topics: normalizedTopics,
          totalQuestions,
          meta: { difficulty: normalizedDifficulty, userId },
          quizType: requestedQuizType,
        };

        const createHeaders = {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const res = await fetch(`${API_BASE_URL}/v2/quiz`, {
          method: "POST",
          headers: createHeaders,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        let json = {};
        try {
          json = await res.json();
        } catch {
          json = {};
        }
        const newQuizId = json?.id || json?.data?.id;

        if (res.ok && newQuizId && isMounted) {
          addPendingQuiz({ id: newQuizId, subject: finalSubject, topic: finalTopic });
          setQuizCreated(true);
        } else if (!res.ok && isMounted) {
          startedGenerationKeysRef.current.delete(generationKey);
          console.error("Quiz creation failed:", json);
          Alert.alert("Quiz generation failed", json?.message || "Please try again.");
        } else if (isMounted) {
          startedGenerationKeysRef.current.delete(generationKey);
          console.error("Quiz creation succeeded but no id returned:", json);
          Alert.alert("Quiz generation failed", "No quiz ID was returned by the server.");
        }
      } catch (err) {
        startedGenerationKeysRef.current.delete(generationKey);
        if (err.name !== "AbortError") {
          console.error("Quiz creation error:", err);
          Alert.alert("Quiz generation error", "Please try again.");
        }
      }
    };

    createQuiz();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [
    addPendingQuiz,
    classLevelParam,
    difficultyParam,
    fromQuizId,
    generationKey,
    initialSubject,
    initialTopic,
    parsedTopics,
    parsedSubtopicNames,
    progressionStepParam,
    quizCreated,
    quizTypeParam,
    requestedSingleSubtopic,
    includeAllSubtopics,
    requestedDifficulty,
    requestedQuizType,
    token,
    totalQuestions,
    userId,
  ]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") {
        console.log("App backgrounded, polling continues in context");
      }
    });

    return () => sub.remove();
  }, []);

  const currentMessage = encouragingMessages[messageIndex];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Feather name="loader" size={48} color="#0a84ff" />
        <Feather name={currentMessage.icon} size={32} color="#0a84ff" style={{ marginVertical: 8 }} />

        <Text style={styles.title}>Creating Your Quiz</Text>
        <Text style={{ opacity: 0.6, marginBottom: 12 }}>
          {displaySubject || "Subject"} - {displayTopic || "Topic"}
        </Text>

        <Text>{Math.round(progress)}% complete</Text>
        <Text style={{ textAlign: "center", marginVertical: 8 }}>{currentMessage.text}</Text>

        <Text style={{ fontSize: 12, opacity: 0.6 }}>{elapsedTime}s elapsed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primaryDark,
  },
  title: { fontSize: 22, fontWeight: "bold" },
});
