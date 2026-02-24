import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useCurriculum } from "./CurriculumContext";
import { useQuizGeneration } from "./QuizgenerationContext";

const LevelProgressContext = createContext(null);
const MAX_LEVELUP_SUBTOPICS = 24;
const LEVEL_SEQUENCE = [
  { difficulty: "easy", quizType: "mcq", duration: "short" },
  { difficulty: "medium", quizType: "mcq", duration: "medium" },
  { difficulty: "hard", quizType: "mcq", duration: "long" },
  { difficulty: "easy", quizType: "saq", duration: "short" },
  { difficulty: "medium", quizType: "saq", duration: "medium" },
  { difficulty: "hard", quizType: "saq", duration: "long" },
];

const getSubjectName = (subject) => {
  if (typeof subject === "string") return subject;
  if (subject && typeof subject === "object") {
    return String(subject.name || "").trim();
  }
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

const normalizeDifficulty = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return ["easy", "medium", "hard"].includes(normalized) ? normalized : "";
};

const normalizeQuizType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  if (normalized.includes("saq")) return "saq";
  if (normalized.includes("mcq")) return "mcq";
  return "";
};

const parseMetaObject = (value) => {
  if (value && typeof value === "object") return value;
  if (typeof value !== "string") return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (_err) {
    return null;
  }
};

const toTopicsArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === "object") return [parsed];
      return [value];
    } catch (_err) {
      return [value];
    }
  }

  if (typeof value === "object") return [value];
  return [];
};

const normalizeTopics = (topics = []) => {
  if (!Array.isArray(topics)) return [];

  return topics
    .map((topic) => {
      if (typeof topic === "string") {
        return { name: topic, description: "", subtopic: [] };
      }

      const rawSubtopics = topic?.subtopic || topic?.subtopics || [];
      const subtopic = Array.isArray(rawSubtopics)
        ? rawSubtopics
            .map((item) =>
              typeof item === "string" ? item : String(item?.name || "").trim()
            )
            .filter(Boolean)
        : [];

      return {
        name: String(topic?.name || "").trim(),
        description: String(topic?.description || "").trim(),
        subtopic,
      };
    })
    .filter((topic) => topic.name);
};

const pickFocusTopic = (topics, focusTopicName) => {
  if (!Array.isArray(topics) || !topics.length) return null;

  const focus = String(focusTopicName || "").trim().toLowerCase();
  if (!focus) return topics[0];

  return (
    topics.find((topic) => topic.name.toLowerCase() === focus) ||
    topics[0]
  );
};

const toCompactTopic = (topic) => {
  if (!topic) return null;

  const rawSubtopics = Array.isArray(topic.subtopic) ? topic.subtopic : [];
  const subtopic = rawSubtopics
    .map((item) => (typeof item === "string" ? item : String(item?.name || "").trim()))
    .filter(Boolean)
    .slice(0, MAX_LEVELUP_SUBTOPICS);

  return {
    name: String(topic.name || "").trim(),
    description: "",
    subtopic,
  };
};

export const useLevelProgress = () => {
  const context = useContext(LevelProgressContext);
  if (!context) {
    throw new Error("useLevelProgress must be used within LevelProgressProvider");
  }
  return context;
};

export function LevelProgressProvider({ children }) {
  const { getTopics } = useCurriculum();
  const { setQuizConfig } = useQuizGeneration();
  const [isLevelingUp, setIsLevelingUp] = useState(false);

  const resolveCurrentLevel = useCallback(({ attempt, quiz, currentConfig } = {}) => {
    const attemptMeta = parseMetaObject(attempt?.meta);
    const quizMeta = parseMetaObject(quiz?.meta);

    const difficulty =
      normalizeDifficulty(attempt?.difficulty) ||
      normalizeDifficulty(attemptMeta?.difficulty) ||
      normalizeDifficulty(quiz?.difficulty) ||
      normalizeDifficulty(quizMeta?.difficulty) ||
      normalizeDifficulty(currentConfig?.difficulty) ||
      "easy";

    const quizType =
      normalizeQuizType(attempt?.quizType) ||
      normalizeQuizType(quiz?.quizType || quiz?.type) ||
      normalizeQuizType(currentConfig?.quizType) ||
      "mcq";

    return { difficulty, quizType };
  }, []);

  const getNextLevelConfig = useCallback(({ passed, difficulty, quizType }) => {
    if (!passed) return null;
    const currentDifficulty = normalizeDifficulty(difficulty);
    const currentQuizType = normalizeQuizType(quizType);
    const currentIndex = LEVEL_SEQUENCE.findIndex(
      (item) =>
        item.difficulty === currentDifficulty && item.quizType === currentQuizType
    );
    if (currentIndex < 0) return null;
    return LEVEL_SEQUENCE[currentIndex + 1] || null;
  }, []);

  const getNextLevelFromSession = useCallback(
    ({ attempt, quiz, currentConfig, passed } = {}) => {
      const { difficulty, quizType } = resolveCurrentLevel({
        attempt,
        quiz,
        currentConfig,
      });
      return getNextLevelConfig({ passed, difficulty, quizType });
    },
    [resolveCurrentLevel, getNextLevelConfig]
  );

  const buildLevelUpBaseConfig = useCallback(
    async ({ attempt, quiz, currentConfig } = {}) => {
      const resolvedSubject =
        String(currentConfig?.subject || "").trim() ||
        getSubjectName(quiz?.subject) ||
        getSubjectName(attempt?.subject);

      const resolvedClassLevel =
        String(currentConfig?.classLevel || "").trim() ||
        getClassLevel({ classLevel: quiz?.classLevel, subject: quiz?.subject }) ||
        getClassLevel({
          classLevel: attempt?.classLevel,
          subject: attempt?.subject,
        });

      if (!resolvedSubject || !resolvedClassLevel) {
        return { ok: false, error: "Missing subject/class data for level up." };
      }

      const focusTopicName = String(currentConfig?.topic || "").trim();
      const sourceTopicCollections = [
        currentConfig?.topics,
        quiz?.topics,
        attempt?.topic,
        attempt?.topics,
      ];
      const firstNonEmptyTopics =
        sourceTopicCollections.find((entry) => toTopicsArray(entry).length > 0) || [];

      let topicPool = normalizeTopics(toTopicsArray(firstNonEmptyTopics));

      let focusTopic = pickFocusTopic(topicPool, focusTopicName);

      if (!focusTopic) {
        try {
          const fetchedTopics = await getTopics({
            classLevel: resolvedClassLevel,
            subject: resolvedSubject,
          });

          topicPool = (fetchedTopics || []).map((topic) => ({
            name: String(topic?.name || "").trim(),
            description: String(topic?.generalObjective || "").trim(),
            subtopic: Array.isArray(topic?.subtopics) ? topic.subtopics : [],
          }));
          focusTopic = pickFocusTopic(topicPool, focusTopicName);
        } catch (_err) {
          // Keep going with local fallback below.
        }
      }

      if (!focusTopic) {
        const fallbackName =
          focusTopicName ||
          String(topicPool?.[0]?.name || "").trim() ||
          "General Review";

        focusTopic = {
          name: fallbackName,
          description: "",
          subtopic: [],
        };
      }

      const compactTopic = toCompactTopic(focusTopic);
      if (!compactTopic || !compactTopic.name) {
        return { ok: false, error: "Could not prepare level-up topic data." };
      }

      return {
        ok: true,
        config: {
          classLevel: resolvedClassLevel,
          subject: resolvedSubject,
          topic: focusTopicName || compactTopic.name,
          topics: [compactTopic],
        },
      };
    },
    [getTopics]
  );

  const continueLevelUp = useCallback(
    async ({ attempt, quiz, currentConfig, passed } = {}) => {
      if (isLevelingUp) {
        return { ok: false, reason: "busy" };
      }

      const { difficulty, quizType } = resolveCurrentLevel({
        attempt,
        quiz,
        currentConfig,
      });
      const nextConfig = getNextLevelConfig({ passed, difficulty, quizType });

      if (!nextConfig) {
        return {
          ok: false,
          reason: passed ? "mastered" : "not_passed",
        };
      }

      setIsLevelingUp(true);
      try {
        const base = await buildLevelUpBaseConfig({ attempt, quiz, currentConfig });
        if (!base.ok) {
          return { ok: false, reason: "invalid", error: base.error };
        }

        const configToGenerate = {
          ...base.config,
          ...nextConfig,
        };

        setQuizConfig(configToGenerate);
        return { ok: true, config: configToGenerate, nextConfig };
      } catch (_err) {
        return { ok: false, reason: "error", error: "Failed to continue level up." };
      } finally {
        setIsLevelingUp(false);
      }
    },
    [
      isLevelingUp,
      resolveCurrentLevel,
      getNextLevelConfig,
      buildLevelUpBaseConfig,
      setQuizConfig,
    ]
  );

  const value = useMemo(
    () => ({
      isLevelingUp,
      resolveCurrentLevel,
      getNextLevelConfig,
      getNextLevelFromSession,
      continueLevelUp,
    }),
    [
      isLevelingUp,
      resolveCurrentLevel,
      getNextLevelConfig,
      getNextLevelFromSession,
      continueLevelUp,
    ]
  );

  return (
    <LevelProgressContext.Provider value={value}>
      {children}
    </LevelProgressContext.Provider>
  );
}
