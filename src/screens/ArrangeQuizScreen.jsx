import { Picker } from "@react-native-picker/picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../contexts/AuthContext.jsx";
import { colors } from "../../theme/colors.jsx";
import { API_BASE_URL } from "../../theme/constants.jsx";
import Duration from "../components/Duration.jsx";
import QuizType from "../components/QuizType.jsx";

const CLASSES = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

export default function ArrangeQuiz() {
  const { user } = useAuth();

  const router = useRouter()

  const userProfile = user?.profile || {};
  const userDefaultClass = userProfile?.defaultClass;

  const [selectedClass, setSelectedClass] = useState(
    userDefaultClass || "Upper Sixth"
  );
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [subtopics, setSubtopics] = useState([]);

  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedSubtopics, setSelectedSubtopics] = useState([]);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [quizDuration, setQuizDuration] = useState("");
  const [quizType, setQuizType] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const normalizeText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "object") {
      return String(value.name || value.label || value.value || "").trim();
    }
    return String(value).trim();
  };

  const resetForm = useCallback(() => {
    setSelectedClass(userDefaultClass || "Upper Sixth");
    setSubjects([]);
    setTopics([]);
    setSubtopics([]);
    setSelectedSubject("");
    setSelectedTopic("");
    setSelectedSubtopics([]);
    setQuizDuration("");
    setQuizType("");
    setSubmitting(false);
  }, [userDefaultClass]);

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [resetForm])
  );


  // Fetch subjects
  useFocusEffect(
    useCallback(() => {
      if (!selectedClass) return;

      const controller = new AbortController();
      let isMounted = true;

      async function loadSubjects() {
        setLoadingSubjects(true);
        try {
          const res = await fetch(
            `${API_BASE_URL}/subjects/filter?classLevel=${selectedClass}`,
            { signal: controller.signal }
          );

          const data = await res.json();

          if (isMounted) {
            setSubjects(Array.isArray(data?.data) ? data.data : []);
          }
        } catch (err) {
          if (err.name !== "AbortError") {
            Alert.alert("Failed to fetch subjects");
            console.log("Subjects error:", err);
          }
        } finally {
          if (isMounted) setLoadingSubjects(false);
        }
      }

      loadSubjects();

      return () => {
        isMounted = false;
        controller.abort();
      };
    }, [selectedClass])
  );

  // Fetch topics when class + subject change
  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;

    const controller = new AbortController();
    let isMounted = true;

    async function loadTopics() {
      setLoadingTopics(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/filter-topics?subject=${encodeURIComponent(
            selectedSubject
          )}&classLevel=${encodeURIComponent(selectedClass)}`,
          { signal: controller.signal }
        );

        const data = await res.json();

        if (isMounted) {
          setTopics(Array.isArray(data?.data) ? data.data : []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          Alert.alert("Failed to fetch topics");
          console.log("Topics error:", err);
        }
      } finally {
        if (isMounted) setLoadingTopics(false);
      }
    }

    loadTopics();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [selectedClass, selectedSubject]);

  // Update subtopics when topic changes
  useEffect(() => {
    const topicObj = topics.find((t) => t.name === selectedTopic);
    setSubtopics(topicObj?.subtopics || []);
    setSelectedSubtopics([]);
  }, [selectedTopic, topics]);

  const handleSubtopicToggle = (st) => {
    setSelectedSubtopics((prev) =>
      prev.includes(st) ? prev.filter((s) => s !== st) : [...prev, st]
    );
  };

  const handleContinue = () => {
    if (submitting) return;

    const normalizedClass = normalizeText(selectedClass);
    const normalizedSubject = normalizeText(selectedSubject);
    const normalizedTopic = normalizeText(selectedTopic);

    if (!normalizedClass || !normalizedSubject || !normalizedTopic) {
      Alert.alert("Please select class, subject, and topic");
      return;
    }

    if (!quizDuration || !quizType) {
      Alert.alert("Please select quiz duration and question type");
      return;
    }

    setSubmitting(true);

    try {
      const sourceSubtopics =
        selectedSubtopics.length > 0 ? selectedSubtopics : subtopics;

      const normalizedSubtopics = sourceSubtopics
        .map((subtopic) => normalizeText(subtopic))
        .filter((subtopic) => subtopic.length > 0);

      const subtopicNamesString = JSON.stringify(normalizedSubtopics);

      router.push({
        pathname: "/quiz-generating",
        params: {
          classLevel: normalizedClass,
          subject: normalizedSubject,
          topic: normalizedTopic,
          subtopicNames: subtopicNamesString,
          duration: quizDuration,
          quizType,
        },
      });
    } catch (err) {
      console.log("Navigation error:", err);
      Alert.alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };
  

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <View style={styles.topHeader}>
        <AppLogoPages />
      </View> */}

      <View style={styles.arrangeQuiz}>
        <Text style={styles.title}>Arrange Your Quiz</Text>

        <Text style={styles.subtitle}>
          Choose your preferences to create a personalized study session
        </Text>
      </View>


      {/* Class Picker */}
      <Text style={styles.label}>🎓 Select Class</Text>
      <Picker
        selectedValue={selectedClass}
        onValueChange={(val) => {
          setSelectedClass(val);
          setSelectedSubject("");
          setSelectedTopic("");
          setSelectedSubtopics([]);
          setTopics([]);
          setSubtopics([]);
        }}
        style={styles.picker}
      >
        {CLASSES.map((cls) => (
          <Picker.Item key={cls} label={cls} value={cls} />
        ))}
      </Picker>

      {/* Subject Picker */}
      <Text style={styles.label}>📚 Select Subject</Text>
      {loadingSubjects ? (
        <ActivityIndicator color={colors.secondary} />
      ) : (
        <Picker
          selectedValue={selectedSubject}
          onValueChange={(val) => {
            setSelectedSubject(val);
            setSelectedTopic("");
            setSelectedSubtopics([]);
          }}
          style={styles.picker}
        >
          <Picker.Item label="Select subject..." value="" />
          {subjects.map((s) => (
            <Picker.Item key={s.name} label={s.name} value={s.name} />
          ))}
        </Picker>
      )}

      {/* Topic Picker */}
      <Text style={styles.label}>📖 Select Topic</Text>
      {loadingTopics ? (
        <ActivityIndicator color={colors.secondary} />
      ) : (
        <Picker
          selectedValue={selectedTopic}
          onValueChange={(val) => setSelectedTopic(val)}
          style={styles.picker}
        >
          <Picker.Item label="Select topic..." value="" />
          {topics.map((t) => (
            <Picker.Item key={t.id} label={t.name} value={t.name} />
          ))}
        </Picker>
      )}

      {/* Subtopics */}
      {subtopics.length > 0 && (
        <>
          <Text style={styles.label}>🎲 Select Subtopics</Text>
          {subtopics.map((st) => (
            <Pressable
              key={st}
              onPress={() => handleSubtopicToggle(st)}
              style={[
                styles.subTopicItem,
                selectedSubtopics.includes(st) &&
                styles.subTopicSelected,
              ]}
            >
              <Text style={styles.subTopicText}>{st}</Text>
            </Pressable>
          ))}
        </>
      )}

      <View>
        <Text style={styles.label}>⏱️ Quiz Duration</Text>
        <View style={styles.features}>
          <Duration
            icon={<Feather name="zap" size={28} color={colors.white} />}
            title="Short"
            selected={quizDuration === "short"}
            description="7 questions • 5 - 10 min"
            onSelect={() => setQuizDuration("short")}
          />

          <Duration
            icon={<Feather name="clock" size={28} color={colors.white} />}
            title="Medium"
            description="15 questions • 15 - 20 min"
            onSelect={() => setQuizDuration("medium")}
            selected={quizDuration === "medium"}
          />

          <Duration
            icon={<Feather name="book-open" size={28} color={colors.white} />}
            title="Long"
            description="20 questions • 20 - 40 min"
            onSelect={() => setQuizDuration("long")}
            selected={quizDuration === "long"}
          />

        </View>
      </View>
      <View>
        <Text style={styles.label}>❓Question Type</Text>
        <View style={styles.features}>
          <QuizType
            icon={<Feather name="check" size={28} color={colors.white} />}
            title="Multiple Choice"
            description="Choose from 4 possible answers"
            onSelect={() => setQuizType("mcq")}
            selected={quizType === "mcq"}

          />

          <QuizType
            icon={<Feather name="activity" size={28} color={colors.white} />}
            title="Structural Questions"
            description="Type your answer"
            onSelect={() => setQuizType("saq")}
            selected={quizType === "saq"}
          />

        </View>
      </View>

      <Pressable
        style={styles.continueBtn}
        onPress={handleContinue}
        disabled={submitting}
      >
        <Text style={styles.continueText}>Continue</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flexGrow: 1,
    marginTop: 0,
    backgroundColor: colors.white,
  },
  cont: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 16,
    textAlign: 'left',
  },
  subtitle: {
    color: colors.mutedWhite,
    fontSize: 12,
    textAlign: 'left',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: colors.black,
    marginVertical: 8,
  },

  picker: {
    backgroundColor: colors.white,
    color: colors.mutedBlack,
  },

  subTopicItem: {
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 8,
  },

  subTopicSelected: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
  },

  subTopicText: {
    color: colors.mutedBlack,
  },

  continueBtn: {
    marginTop: 20,
    marginBottom: 50,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.secondary,
    alignItems: "center",
  },

  continueText: {
    color: colors.white,
    fontWeight: "bold",
  },
  features: {
    width: '90%',
    marginTop: 40,
    gap: 20,
    flexDirection: 'row'
  },
  arrangeQuiz: {
    backgroundColor: colors.primaryDark,
    alignItems: 'flex-start',
    borderRadius: 20,
    padding: 16
  }
});
