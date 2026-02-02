import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext"; // your AuthContext
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

const CLASSES = ["Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Lower Sixth", "Upper Sixth"];
const SCHOOLS = [
  "Government Bilingual High School, Yaoundé",
  "Government High School, Buea",
  "Sacred Heart College, Mankon",
  "St. Joseph's College, Sasse",
  "Other"
];
const LANGUAGES = ["English", "French"];

export default function AccountInformation() {
  const { user, token, updateUserProfile } = useAuth();

  const [profilePicture, setProfilePicture] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [school, setSchool] = useState("");
  const [language, setLanguage] = useState("English");

  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);

  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const initialValuesRef = useRef(null);
    const [username, setUsername] = useState('');
    const router = useRouter()

 useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('auth_user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUsername(parsed.username || '');
        }
      } catch (error) {
        console.log('Failed to load user', error);
      }
    };

    loadUser();
  }, []);
  // Initialize form
  useEffect(() => {
    if (user) {
      const profile = user.profile || {};
      setEmail(profile.email || "");
      setPhone(profile.phoneNumber || "");
      setSelectedClass(profile.defaultClass || "");
      setSelectedSubjects(profile.subjects || []);
      setSchool(profile.school || "");
      setLanguage(profile.language || "English");
      setProfilePicture(profile?.profilePic || "");

      initialValuesRef.current = {
        email: profile.email || "",
        phone: profile.phone || "",
        selectedClass: profile.defaultClass || "",
        selectedSubjects: profile.subjects || [],
        school: profile.school || "",
        language: profile.language || "English",
        profilePicture: profile.avatar || "",
      };
    }
  }, [user]);

  // Fetch subjects when class changes
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setAvailableSubjects([]);
        return;
      }
      setLoadingSubjects(true);
      try {
        const response = await fetch(`${API_BASE_URL}/subjects?classLevel=${encodeURIComponent(selectedClass)}`);
        const data = await response.json();
        const subjects = data?.data
          ?.filter(s => s.classLevel === selectedClass)
          ?.map(s => s.name) || [];
        setAvailableSubjects(subjects.sort());
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, [selectedClass]);

  const hasUnsavedChanges = useCallback(() => {
    if (!initialValuesRef.current) return false;
    const initial = initialValuesRef.current;
    return (
      email !== initial.email ||
      phone !== initial.phone ||
      selectedClass !== initial.selectedClass ||
      JSON.stringify([...selectedSubjects].sort()) !== JSON.stringify([...initial.selectedSubjects].sort()) ||
      school !== initial.school ||
      language !== initial.language ||
      profilePicture !== initial.profilePicture
    );
  }, [email, phone, selectedClass, selectedSubjects, school, language, profilePicture]);

  const handleNavigation = (path) => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true);
      setPendingNavigation(() => () => router.push(path));
    } else {
      router.push(path);
    }
  };

  const handleDiscardChanges = () => {
    setShowUnsavedDialog(false);
    if (pendingNavigation) pendingNavigation();
  };

  const handleSaveChanges = async () => {
    if (!user || !token) return;
    setSaving(true);
    try {
      const updatedProfile = {
        ...user.profile,
        email,
        phone,
        defaultClass: selectedClass,
        subjects: selectedSubjects,
        school,
        language,
        avatar: profilePicture,
      };

      const response = await fetch(`${API_BASE_URL}/v2/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...user, profile: updatedProfile }),
      });

      if (response.ok) {
        const data = await response.json();
        updateUserProfile(data.profile || updatedProfile);
        initialValuesRef.current = { ...updatedProfile };
        alert("Profile updated successfully!");
        if (pendingNavigation) pendingNavigation();
      } else {
        alert("Failed to save changes");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleProfilePictureChange = async (uri) => {
    if (!user || !token) return;
    setProfilePicture(uri); // just locally for now
    // TODO: implement upload to API if needed
  };

  const renderCheckbox = (subject) => (
    <TouchableOpacity
      key={subject}
      onPress={() => toggleSubject(subject)}
      style={styles.checkboxContainer}
    >
      <View style={[styles.checkbox, selectedSubjects.includes(subject) && styles.checkboxChecked]}>
        {selectedSubjects.includes(subject) && <Feather name="check" size={16} color="white" />}
      </View>
      <Text>{subject}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>Account Information</Text>

      {/* Profile */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile Details</Text>

        <TouchableOpacity style={styles.profilePicContainer}>
          {profilePicture ? (
            <Image source={{ uri: profilePicture }} style={styles.profilePic} />
          ) : (
            <Text style={styles.profileInitial}>U</Text>
          )}
        </TouchableOpacity>
        <View>
        <Text style={styles.title}>Acccount Name</Text>
          <TextInput
          placeholder="Username"
          value={username}
          style={styles.input}
          editable={false}
        />
        </View>
        <View>
        <Text style={styles.title}>Email Address</Text>
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        </View>
        <View>
        <Text style={styles.title}>Phone Number</Text>
        <TextInput
          placeholder="Phone"
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
        />
        </View>
      </View>

      {/* Study Details */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Study Details</Text>
        <View>
        <Text style={styles.title}>Class</Text>
        </View>
        <Picker selectedValue={selectedClass} onValueChange={setSelectedClass} style={styles.picker}>
          <Picker.Item label="Select Class" value="" />
          {CLASSES.map(cls => <Picker.Item key={cls} label={cls} value={cls} />)}
        </Picker>
           
         <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 10 }} />
         <View>
        <Text style={styles.title} >Subjects</Text>
        <Text style={styles.subtitle}>Select the subjects you study (these will appear in Quiz Setup)</Text>

        </View>
        {loadingSubjects ? (
          <ActivityIndicator />
        ) : availableSubjects.length > 0 ? (
          availableSubjects.map(renderCheckbox)
        ) : (
          <Text>No subjects available</Text>
        )}
        <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 10 }} />
        <View>
        <Text style={styles.title}>School (Optional)</Text>
        </View>
        <Picker selectedValue={school} onValueChange={setSchool} style={styles.picker}>
          <Picker.Item label="Select School" value="" />
          {SCHOOLS.map(s => <Picker.Item key={s} label={s} value={s} />)}
        </Picker>
      </View>

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>General Settings</Text>
        <Picker selectedValue={language} onValueChange={setLanguage} style={styles.picker}>
          {LANGUAGES.map(l => <Picker.Item key={l} label={l} value={l} />)}
        </Picker>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.button} onPress={() => handleNavigation("/settings")}>
          <Text style={styles.buttonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveChanges} disabled={saving}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>

      {/* Unsaved Changes Modal */}
      <Modal visible={showUnsavedDialog} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Unsaved Changes</Text>
            <Text>Do you want to save changes before leaving?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowUnsavedDialog(false)} style={styles.button}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDiscardChanges} style={[styles.button, styles.saveButton]}>
                <Text style={{ color: "white" }}>Discard / Save & Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.white, marginBottom: 0, width: '100%'},
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 16 },
  card: { padding: 16, backgroundColor: colors.mutedWhite, marginBottom: 16, borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: colors.mutedBlack, borderRadius: 6, padding: 8, marginBottom: 12 },
  picker: { borderWidth: 1, borderColor: colors.mutedBlack, borderRadius: 6, marginBottom: 12 },
  profilePicContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.mutedWhite, marginBottom: 12, justifyContent: "center", alignItems: "center", borderWidth:1, borderBlockColor: colors.secondary },
  profilePic: { width: 80, height: 80, borderRadius: 40, borderWidth:1, borderBlockColor: colors.secondary },
  profileInitial: { fontSize: 32, fontWeight: "bold", borderWidth:1, borderBlockColor: colors.secondary },
  actions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16,marginBottom: 50 },
  button: { padding: 12, borderRadius: 6, backgroundColor: colors.primaryDark, alignItems: "center", flex: 1, marginHorizontal: 4 },
  saveButton: { backgroundColor: colors.primaryDark },
  buttonText: { color: colors.white, fontWeight: "bold" },
  checkboxContainer: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  checkbox: { width: 20, height: 20, borderWidth: 1, borderColor: colors.mutedBlack, marginRight: 8, justifyContent: "center", alignItems: "center" },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primaryDark },
  modalOverlay: { flex: 1, backgroundColor: colors.black, justifyContent: "center", alignItems: "center" },
  modalContent: { width: "80%", padding: 16, backgroundColor: "white", borderRadius: 8 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, marginBottom: 50 },
  title: {fontSize: 14, fontWeight: 900, marginBottom:7},
  subtitle:{fontSize: 10, marginBottom:7}
});
