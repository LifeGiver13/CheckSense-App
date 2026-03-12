import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, View } from "react-native";
import { useAuth } from "../../contexts/AuthContext";
import { API_BASE_URL } from "../../theme/constants.jsx";
import { colors } from "../../theme/colors.jsx";
import CareerStep from "./CareeStep";
import ClassStep from "./ClassStep";
import SubjectsStep from "./SubjectStep";
import WelcomeStep from "./WelcomeStep";
export default function OnboardingModal({ visible, onClose }) {

  const { user, token, updateUserProfile } = useAuth();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [careerGoal, setCareerGoal] = useState("");

  useEffect(() => {
    if (!visible) return;
    setStep(1);
    setSelectedClass("");
    setSelectedSubjects([]);
    setCareerGoal("");
    setSaving(false);
  }, [visible]);

  const safeJson = async (response) => {
    try {
      return await response.json();
    } catch {
      return {};
    }
  };

  const handleComplete = async () => {
    if (!selectedClass) {
      Alert.alert("Missing info", "Please choose your class to continue.");
      return;
    }

    if (!selectedSubjects.length) {
      Alert.alert("Missing info", "Please select at least one subject.");
      return;
    }

    const profileUpdate = {
      ...(user?.profile || {}),
      defaultClass: selectedClass,
      subjects: selectedSubjects,
      aspirations: careerGoal,
    };

    setSaving(true);
    try {
      const userId = user?.id || user?.uid || null;
      if (userId && token) {
        const res = await fetch(`${API_BASE_URL}/v2/users/${userId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(user || {}),
            profile: profileUpdate,
          }),
        });

        if (res.ok) {
          const data = await safeJson(res);
          updateUserProfile(data?.profile || profileUpdate);
          onClose();
          return;
        }

        const errData = await safeJson(res);
        console.warn("Failed to update profile on server:", errData);
        Alert.alert(
          "Saved locally",
          "We couldn't save your profile online right now. We'll keep it on this device for now."
        );
      }

      await updateUserProfile(profileUpdate);
      onClose();
    } catch (err) {
      console.error("Onboarding save error:", err);
      await updateUserProfile(profileUpdate);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={() => {
        Alert.alert("Complete setup", "Please finish setup to continue.");
      }}
    >
      <View style={{ flex: 1, backgroundColor: colors.white }}>
        {saving ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color={colors.primaryDark} />
          </View>
        ) : (
          <>
            {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}

            {step === 2 && (
              <ClassStep
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                onNext={() => {
                  if (!selectedClass) {
                    Alert.alert("Choose a class", "Please select your class to continue.");
                    return;
                  }
                  setStep(3);
                }}
                onBack={() => setStep(1)}
              />
            )}

            {step === 3 && (
              <SubjectsStep
                selectedClass={selectedClass}
                selectedSubjects={selectedSubjects}
                setSelectedSubjects={setSelectedSubjects}
                onNext={() => {
                  if (!selectedSubjects.length) {
                    Alert.alert("Select subjects", "Choose at least one subject to continue.");
                    return;
                  }
                  setStep(4);
                }}
                onBack={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <CareerStep
                careerGoal={careerGoal}
                setCareerGoal={setCareerGoal}
                onBack={() => setStep(3)}
                onComplete={handleComplete}
              />
            )}
          </>
        )}
      </View>
    </Modal>
  );
}
