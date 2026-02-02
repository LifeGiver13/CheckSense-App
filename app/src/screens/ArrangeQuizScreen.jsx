import { Picker } from "@react-native-picker/picker";
import { useEffect, useState } from "react";
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
import { useRouter } from "expo-router";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { colors } from "../../../theme/colors.jsx";
import { API_BASE_URL } from "../../../theme/constants.jsx";
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

  // Fetch subjects
  useEffect(() => {
    async function loadSubjects() {
      setLoadingSubjects(true);
      try {
        const res = await fetch(`${API_BASE_URL}/subjects/filter?classLevel=${selectedClass}`);
        const data = await res.json();
        setSubjects(data.data || []);
      } catch (err) {
        Alert.alert("Failed to fetch subjects");
        console.error(err);
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  // Fetch topics when class + subject change
  useEffect(() => {
    async function loadTopics() {
      if (!selectedClass || !selectedSubject) return;
      setLoadingTopics(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/filter-topics?subject=${encodeURIComponent(
            selectedSubject
          )}&classLevel=${encodeURIComponent(selectedClass)}`
        );
        const data = await res.json();
        setTopics(data.data || []);
      } catch (err) {
        Alert.alert("Failed to fetch topics");
        console.error(err);
      } finally {
        setLoadingTopics(false);
      }
    }
    loadTopics();
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
    if (!selectedClass || !selectedSubject || !selectedTopic) {
      Alert.alert("Please select class, subject, and topic");
      return;
    }

    router.push("QuizGenerating", {
      class: selectedClass,
      subject: selectedSubject,
      topic: selectedTopic,
      subTopics:
        selectedSubtopics.length > 0 ? selectedSubtopics : subtopics,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <View style={styles.topHeader}>
        <AppLogoPages />
      </View> */}
        <View style={styles.arangeQuiz}>
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
            icon={<Feather name='zap' size={28} color={colors.white} />}
            title="Short"
            description="7 questions • 5 - 10 min "
          />

          <Duration
            icon={<Feather name='clock' size={28} color={colors.white} />}
            title="Meduim"
            description="15 questions • 15 - 20 min "
          />

          <Duration
            icon={<Feather name='book-open' size={28} color={colors.white} />}
            title="Long"
            description="20 questions • 20 - 40 min "
          />
          </View>
        </View>
        <View>
        <Text style={styles.label}>❓Question Type</Text>
        <View style={styles.features}>
          <QuizType
            icon={<Feather name='check' size={28} color={colors.white} />}
            title="Multiple Choice"
            description="Choose from 4 possible answers "
          />

          <QuizType
            icon={<Feather name='activity' size={28} color={colors.white} />}
            title="Structural Questions"
            description="Type your answer"
          />
          </View>
        </View>

      <Pressable style={styles.continueBtn} onPress={handleContinue}>
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
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 16,
    textAlign: 'left',
  },
  subtitle: {
    color: colors.mutedBlack,
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 30,
  },
    arange:{
    backgroundColor: colors.primaryDark
    } ,
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
});
