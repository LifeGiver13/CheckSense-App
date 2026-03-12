import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useCurriculum } from "../../contexts/CurriculumContext.jsx";
import { colors } from "../../theme/colors.jsx";


export default  function SubjectsStep({
  selectedClass,
  selectedSubjects,
  setSelectedSubjects,
  onNext,
  onBack
}) {

  const { getSubjects } = useCurriculum();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {

    async function loadSubjects() {
      if (!selectedClass) return;

      setLoading(true);
      setError("");
      try {
        const data = await getSubjects({ classLevel: selectedClass });
        setSubjects(data || []);
      } catch (_err) {
        setError("Failed to load subjects. Please try again.");
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    }

    loadSubjects();

  }, [selectedClass, getSubjects]);

  const toggleSubject = (name) => {
  setSelectedSubjects(prev =>
      prev.includes(name)
        ? prev.filter(s => s !== name)
        : [...prev, name]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your subjects</Text>
      <Text style={styles.subtitle}>
        Pick the subjects you study so we can personalize your dashboard.
      </Text>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>

          {subjects.map((s) => {
            const isSelected = selectedSubjects.includes(s.name);
            return (
              <Pressable
                key={s.name}
                onPress={() => toggleSubject(s.name)}
                style={[styles.item, isSelected && styles.itemSelected]}
              >
                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <Pressable onPress={onBack} style={[styles.actionBtn, styles.backBtn]}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={!selectedSubjects.length}
          style={[styles.actionBtn, !selectedSubjects.length && { opacity: 0.6 }]}
        >
          <Text style={styles.nextText}>Continue</Text>
        </Pressable>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: colors.white,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.black,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.mutedBlack,
    marginBottom: 12,
  },
  error: {
    color: "red",
    marginTop: 10,
  },
  list: {
    paddingBottom: 10,
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 10,
    backgroundColor: colors.white,
  },
  itemSelected: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
  },
  itemText: {
    color: colors.black,
    fontWeight: "600",
  },
  itemTextSelected: {
    color: colors.secondary,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.primaryDark,
    minWidth: 120,
    alignItems: "center",
  },
  backBtn: {
    backgroundColor: colors.secondaryLight,
  },
  backText: {
    color: colors.black,
    fontWeight: "700",
  },
  nextText: {
    color: colors.white,
    fontWeight: "700",
  },
});
