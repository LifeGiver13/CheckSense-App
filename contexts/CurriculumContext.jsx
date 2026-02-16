import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { API_BASE_URL } from "../theme/constants";

const CurriculumContext = createContext(null);

const toCacheKey = (value = "") =>
  String(value).trim().toLowerCase();

const normalizeTopic = (topic = {}) => {
  const rawSubtopics = Array.isArray(topic?.subtopics)
    ? topic.subtopics
    : Array.isArray(topic?.subtopic)
      ? topic.subtopic
      : [];

  const subtopics = rawSubtopics
    .map((subtopic) => {
      if (typeof subtopic === "string") return subtopic;
      return subtopic?.name || "";
    })
    .filter(Boolean);

  return {
    id: topic?.id || "",
    name: topic?.name || "",
    classLevel: topic?.classLevel || "",
    subject: topic?.subject || "",
    generalObjective: topic?.generalObjective || topic?.description || "",
    subtopics,
  };
};

const normalizeSubject = (subject = {}) => ({
  id: subject?.id || "",
  name: subject?.name || "",
  classLevel: subject?.classLevel || "",
});

export const useCurriculum = () => {
  const context = useContext(CurriculumContext);
  if (!context) {
    throw new Error("useCurriculum must be used within CurriculumProvider");
  }
  return context;
};

export function CurriculumProvider({ children }) {
  const subjectsCacheRef = useRef({});
  const topicsCacheRef = useRef({});
  const subjectsWithTopicCountsCacheRef = useRef({});

  const getSubjects = useCallback(async ({ classLevel, name = "", force = false } = {}) => {
    if (!classLevel) return [];

    const cacheKey = `${toCacheKey(classLevel)}::${toCacheKey(name)}`;
    if (!force && subjectsCacheRef.current[cacheKey]) {
      return subjectsCacheRef.current[cacheKey];
    }

    const where = { classLevel: String(classLevel) };
    if (name) where.name = String(name);

    const params = new URLSearchParams({ where: JSON.stringify(where) });
    const response = await fetch(`${API_BASE_URL}/v2/subjects?${params.toString()}`);
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(json?.message || "Failed to fetch subjects");
    }

    const subjects = Array.isArray(json?.data)
      ? json.data.map(normalizeSubject).filter((item) => item.name)
      : [];

    subjectsCacheRef.current[cacheKey] = subjects;
    return subjects;
  }, []);

  const getTopics = useCallback(async ({ classLevel, subject, force = false } = {}) => {
    if (!classLevel || !subject) return [];

    const cacheKey = `${toCacheKey(classLevel)}::${toCacheKey(subject)}`;
    if (!force && topicsCacheRef.current[cacheKey]) {
      return topicsCacheRef.current[cacheKey];
    }

    const where = {
      classLevel: String(classLevel),
      subject: String(subject),
    };
    const params = new URLSearchParams({ where: JSON.stringify(where) });
    const response = await fetch(`${API_BASE_URL}/v2/topics?${params.toString()}`);
    const json = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(json?.message || "Failed to fetch topics");
    }

    const topics = Array.isArray(json?.data)
      ? json.data
          .map(normalizeTopic)
          .filter((item) => item.name && Array.isArray(item.subtopics))
      : [];

    topicsCacheRef.current[cacheKey] = topics;
    return topics;
  }, []);

  const getSubjectsWithTopicCounts = useCallback(
    async ({ classLevel, selectedSubject = "", force = false } = {}) => {
      if (!classLevel) return [];

      const cacheKey = `${toCacheKey(classLevel)}::${toCacheKey(selectedSubject)}`;
      if (!force && subjectsWithTopicCountsCacheRef.current[cacheKey]) {
        return subjectsWithTopicCountsCacheRef.current[cacheKey];
      }

      const subjects = await getSubjects({
        classLevel,
        name: selectedSubject || "",
        force,
      });

      const subjectsWithCounts = await Promise.all(
        subjects.map(async (subject) => {
          const topics = await getTopics({
            classLevel,
            subject: subject.name,
            force,
          });

          const validTopicCount = topics.filter(
            (topic) => Array.isArray(topic.subtopics) && topic.subtopics.length > 0
          ).length;

          return {
            ...subject,
            topicCount: validTopicCount,
          };
        })
      );

      subjectsWithTopicCountsCacheRef.current[cacheKey] = subjectsWithCounts;
      return subjectsWithCounts;
    },
    [getSubjects, getTopics]
  );

  const clearCurriculumCache = useCallback(() => {
    subjectsCacheRef.current = {};
    topicsCacheRef.current = {};
    subjectsWithTopicCountsCacheRef.current = {};
  }, []);

  const value = useMemo(
    () => ({
      getSubjects,
      getTopics,
      getSubjectsWithTopicCounts,
      clearCurriculumCache,
    }),
    [getSubjects, getTopics, getSubjectsWithTopicCounts, clearCurriculumCache]
  );

  return (
    <CurriculumContext.Provider value={value}>
      {children}
    </CurriculumContext.Provider>
  );
}
