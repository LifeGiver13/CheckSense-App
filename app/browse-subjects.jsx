import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { colors } from "../theme/colors.jsx";

export default function BrowseSubjects() {
  const router = useRouter();
  const { getSubjects, getTopics, getCachedTopics } = useCurriculum();

  const [classLevel, setClassLevel] = useState("");
  const [userSubjects, setUserSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingSubject, setOpeningSubject] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const raw = await AsyncStorage.getItem("auth_user");
        if (!raw) return;

        const user = JSON.parse(raw);
        const profileSubjects = Array.isArray(user?.profile?.subjects)
          ? user.profile.subjects
          : [];

        setClassLevel(user?.profile?.defaultClass || "");
        setUserSubjects(profileSubjects);
      } catch (_err) {
        setClassLevel("");
        setUserSubjects([]);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!classLevel) {
      setSubjects([]);
      setLoading(false);
      return;
    }

    const fetchSubjects = async () => {
      setLoading(true);
      try {
        const data = await getSubjects({ classLevel });
        setSubjects(data || []);
      } catch (error) {
        console.error("Failed to load subjects", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [classLevel, userSubjects, getSubjects]);

  const visibleSubjects = useMemo(() => {
    if (!selectedSubject) {
      return subjects;
    }

    if (selectedSubject === "__MY__") {
      const allowed = new Set(userSubjects);
      return subjects.filter((item) => allowed.has(item.name));
    }

    return subjects.filter((item) => item.name === selectedSubject);
  }, [subjects, selectedSubject, userSubjects]);

  const handleOpenSubject = async (subjectItem) => {
    const subjectId = String(subjectItem?.id || "").trim();
    const subjectName = String(subjectItem?.name || "").trim();

    if (!subjectId) {
      Alert.alert("Error", "This subject is missing an ID.");
      return;
    }

    setOpeningSubject(subjectName || subjectId);
    try {
      if (classLevel && subjectName) {
        const cached = getCachedTopics({ classLevel, subject: subjectName });
        if (!cached.length) {
          await getTopics({ classLevel, subject: subjectName });
        }
      }

      router.push({
        pathname: "/subject-topics",
        params: {
          subjectId,
        },
      });
    } catch (_err) {
      Alert.alert("Error", "Failed to open this subject.");
    } finally {
      setOpeningSubject("");
    }
  };

  return (
    <FlatList
      data={loading ? [] : visibleSubjects}
      keyExtractor={(subject, index) => subject.id || subject.name || String(index)}
      contentContainerStyle={styles.container}
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      windowSize={7}
      removeClippedSubviews
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Browse Subjects</Text>

          <Text style={styles.label}>Class</Text>
          <Picker
            selectedValue={classLevel}
            onValueChange={setClassLevel}
            style={styles.picker}
          >
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
          <Picker
            selectedValue={selectedSubject}
            onValueChange={setSelectedSubject}
            style={styles.picker}
          >
            <Picker.Item label="All subjects" value="" />
            <Picker.Item label="My subjects" value="__MY__" />
          </Picker>

          {loading && (
            <ActivityIndicator
              size="large"
              color={colors.secondary}
              style={{ marginTop: 16 }}
            />
          )}
        </>
      }
      ListEmptyComponent={
        !loading ? (
          <Text style={styles.meta}>No subjects found for this filter.</Text>
        ) : null
      }
      renderItem={({ item: subject }) => {
        const cachedTopics = getCachedTopics({
          classLevel,
          subject: subject.name,
        });
        const topicCount = cachedTopics.filter(
          (topic) => Array.isArray(topic.subtopics) && topic.subtopics.length > 0
        ).length;

        return (
          <Pressable
            style={styles.card}
            onPress={() => handleOpenSubject(subject)}
            disabled={openingSubject === (subject.name || subject.id)}
          >
            <View style={styles.cardHeader}>
              <Feather name="book" size={22} color={colors.secondary} />
              <Text style={styles.cardTitle}>{subject.name}</Text>
            </View>

            <Text style={styles.meta}>Class: {classLevel}</Text>
            <Text style={styles.meta}>Topics: {topicCount || "Tap to load"}</Text>
            {openingSubject === (subject.name || subject.id) && (
              <ActivityIndicator
                size="small"
                color={colors.secondary}
                style={{ marginTop: 8 }}
              />
            )}
          </Pressable>
        );
      }}
    />
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
