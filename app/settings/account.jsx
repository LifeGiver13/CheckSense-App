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
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

import { useAuth } from "../../contexts/AuthContext";
import { colors } from "../../theme/colors";
import { API_BASE_URL } from "../../theme/constants";

const CLASSES = [
  "Form 1",
  "Form 2",
  "Form 3",
  "Form 4",
  "Form 5",
  "Lower Sixth",
  "Upper Sixth",
];

const SCHOOLS = [
  "Government Bilingual High School, Yaoundé",
  "Government High School, Buea",
  "Sacred Heart College, Mankon",
  "St. Joseph's College, Sasse",
  "Other",
];

const LANGUAGES = ["English", "French"];

export default function AccountInformation() {
  const { user, token, updateUserProfile } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");

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

  // Load username
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("auth_user");
        if (userData) {
          const parsed = JSON.parse(userData);
          setUsername(parsed.username || "");
        }
      } catch (error) {
        console.log("Failed to load user", error);
      }
    };

    loadUser();
  }, []);

  // Initialize form
  useEffect(() => {
    if (!user) return;

    const profile = user.profile || {};

    const initial = {
      email: profile.email || "",
      phone: profile.phoneNumber || "",
      selectedClass: profile.defaultClass || "",
      selectedSubjects: profile.subjects || [],
      school: profile.school || "",
      language: profile.language || "English",
      profilePicture: profile.profilePic || "",
    };

    setEmail(initial.email);
    setPhone(initial.phone);
    setSelectedClass(initial.selectedClass);
    setSelectedSubjects(initial.selectedSubjects);
    setSchool(initial.school);
    setLanguage(initial.language);
    setProfilePicture(initial.profilePicture);

    initialValuesRef.current = initial;
  }, [user]);

  // Fetch subjects
  useEffect(() => {
    if (!selectedClass) {
      setAvailableSubjects([]);
      return;
    }

    const fetchSubjects = async () => {
      setLoadingSubjects(true);

      try {
        const res = await fetch(
          `${API_BASE_URL}/subjects?classLevel=${encodeURIComponent(
            selectedClass
          )}`
        );

        const data = await res.json();

        const subjects =
          data?.data
            ?.filter((s) => s.classLevel === selectedClass)
            ?.map((s) => s.name) || [];

        setAvailableSubjects(subjects.sort());
      } catch (error) {
        console.log(error);
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [selectedClass]);

  // Unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!initialValuesRef.current) return false;

    const initial = initialValuesRef.current;

    return (
      email !== initial.email ||
      phone !== initial.phone ||
      selectedClass !== initial.selectedClass ||
      JSON.stringify(selectedSubjects.sort()) !==
        JSON.stringify(initial.selectedSubjects.sort()) ||
      school !== initial.school ||
      language !== initial.language ||
      profilePicture !== initial.profilePicture
    );
  }, [
    email,
    phone,
    selectedClass,
    selectedSubjects,
    school,
    language,
    profilePicture,
  ]);

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

  // Save profile
  const handleSaveChanges = async () => {
    if (!user || !token) return;

    setSaving(true);

    try {
      const updatedProfile = {
        email,
        phoneNumber: phone,
        defaultClass: selectedClass,
        subjects: selectedSubjects,
        school,
        language,
        profilePic: profilePicture,
      };

      const res = await fetch(`${API_BASE_URL}/v2/users/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...user,
          profile: updatedProfile,
        }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      updateUserProfile(data.profile || updatedProfile);

      initialValuesRef.current = { ...updatedProfile };

      Alert.alert("Success", "Profile updated successfully");

      if (pendingNavigation) pendingNavigation();
    } catch {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // Toggle subject
  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const handleProfilePictureChange = async (uri) => {
    if (!user || !token) return;

    const previous = profilePicture;


    setProfilePicture(uri);
    setUploadingProfilePic(true);

    try {
      const formData = new FormData();

      // extract file type from uri
      const fileType = uri.split(".").pop()?.toLowerCase();

      const mimeType =
        fileType === "png"
          ? "image/png"
          : fileType === "jpg" || fileType === "jpeg"
          ? "image/jpeg"
          : fileType === "webp"
          ? "image/webp"
          : "image/jpeg";

      formData.append("profilePic", {
        uri,
        name: `profile.${fileType || "jpg"}`,
        type: mimeType,
      });
    const res = await fetch(`${API_BASE_URL}/v2/users/${user.uid}/profile-pic`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await res.text();
    console.log("UPLOAD RESPONSE:", text);

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server did not return JSON");
    }

    if (!res.ok) throw new Error(data?.message || "Upload failed");

    setProfilePicture(data?.data?.profilePic);
    updateUserProfile({
      ...user.profile,
      profilePic: data?.data?.profilePic 
    });
    } catch (err) {
      console.log(err);
      setProfilePicture(previous);
      Alert.alert("Upload Failed", "Could not upload profile picture.");
    } finally {
      setUploadingProfilePic(false);
    }
  };
  // Pick image
  const pickImage = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Allow access to photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleProfilePictureChange(result.assets[0].uri);
    }
  };

  const renderCheckbox = (subject) => (
    <TouchableOpacity
      key={subject}
      style={styles.checkboxContainer}
      onPress={() => toggleSubject(subject)}
    >
      <View
        style={[
          styles.checkbox,
          selectedSubjects.includes(subject) && styles.checkboxChecked,
        ]}
      >
        {selectedSubjects.includes(subject) && (
          <Feather name="check" size={14} color="#fff" />
        )}
      </View>

      <Text style={styles.checkboxLabel}>{subject}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Account Information</Text>

      {/* Profile */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Profile</Text>

        <TouchableOpacity
          style={styles.profilePicContainer}
          onPress={pickImage}
        >
          {uploadingProfilePic ? (
            <ActivityIndicator color={colors.primaryDark} />
          ) : profilePicture ? (
            <Image
              source={{ uri: profilePicture }}
              style={styles.profilePic}
            />
          ) : (
            <Text style={styles.profileInitial}>
              {username?.charAt(0)?.toUpperCase() || "U"}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          editable={false}
          style={[styles.input, styles.disabledInput]}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} style={styles.input} />

        <Text style={styles.label}>Phone</Text>
        <TextInput value={phone} onChangeText={setPhone} style={styles.input} />
      </View>

      {/* Study */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Study Details</Text>

        <Text style={styles.label}>Class</Text>

        <Picker
          selectedValue={selectedClass}
          onValueChange={setSelectedClass}
          style={styles.picker}
        >
          <Picker.Item label="Select Class" value="" />

          {CLASSES.map((cls) => (
            <Picker.Item key={cls} label={cls} value={cls} />
          ))}
        </Picker>

        <Text style={styles.label}>Subjects</Text>

        {loadingSubjects ? (
          <ActivityIndicator />
        ) : (
          availableSubjects.map(renderCheckbox)
        )}

        <Text style={styles.label}>School</Text>

        <Picker
          selectedValue={school}
          onValueChange={setSchool}
          style={styles.picker}
        >
          <Picker.Item label="Select School" value="" />

          {SCHOOLS.map((s) => (
            <Picker.Item key={s} label={s} value={s} />
          ))}
        </Picker>
      </View>

      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Language</Text>

        <Picker
          selectedValue={language}
          onValueChange={setLanguage}
          style={styles.picker}
        >
          {LANGUAGES.map((l) => (
            <Picker.Item key={l} label={l} value={l} />
          ))}
        </Picker>
      </View>

      {/* Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handleNavigation("/settings")}
        >
          <Text style={styles.secondaryText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSaveChanges}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Unsaved modal */}
      <Modal visible={showUnsavedDialog} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Unsaved Changes</Text>

            <Text style={styles.modalText}>
              Save changes before leaving?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => setShowUnsavedDialog(false)}
              >
                <Text style={styles.secondaryText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleDiscardChanges}
              >
                <Text style={styles.primaryText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#f6f8fc",
padding:16
},

header:{
fontSize:26,
fontWeight:"700",
marginBottom:20
},

card:{
backgroundColor:"#fff",
padding:18,
borderRadius:14,
marginBottom:20,
shadowColor:"#000",
shadowOpacity:0.05,
shadowRadius:10,
elevation:2
},

sectionTitle:{
fontSize:18,
fontWeight:"600",
marginBottom:12
},

label:{
fontSize:13,
fontWeight:"600",
marginBottom:6,
color:"#555"
},

input:{
borderWidth:1,
borderColor:"#ddd",
borderRadius:8,
padding:10,
marginBottom:14,
backgroundColor:"#fff"
},

disabledInput:{
backgroundColor:"#f1f1f1"
},

picker:{
marginBottom:12
},

profilePicContainer:{
width:90,
height:90,
borderRadius:45,
alignSelf:"center",
backgroundColor:"#f0f3ff",
alignItems:"center",
justifyContent:"center",
marginBottom:14
},

profilePic:{
width:90,
height:90,
borderRadius:45
},

profileInitial:{
fontSize:34,
fontWeight:"700",
color:colors.primaryDark
},

checkboxContainer:{
flexDirection:"row",
alignItems:"center",
marginBottom:8
},

checkbox:{
width:18,
height:18,
borderRadius:4,
borderWidth:1,
borderColor:"#bbb",
marginRight:10,
alignItems:"center",
justifyContent:"center"
},

checkboxChecked:{
backgroundColor:colors.primaryDark,
borderColor:colors.primaryDark
},

checkboxLabel:{
fontSize:14
},

actions:{
flexDirection:"row",
justifyContent:"space-between",
marginTop:10,
marginBottom:40
},

primaryButton:{
flex:1,
backgroundColor:colors.primaryDark,
padding:14,
borderRadius:8,
alignItems:"center",
marginLeft:8
},

secondaryButton:{
flex:1,
borderWidth:1,
borderColor:"#ddd",
padding:14,
borderRadius:8,
alignItems:"center",
marginRight:8
},

primaryText:{
color:"#fff",
fontWeight:"600"
},

secondaryText:{
fontWeight:"600"
},

modalOverlay:{
flex:1,
backgroundColor:"rgba(0,0,0,0.4)",
justifyContent:"center",
alignItems:"center"
},

modalCard:{
backgroundColor:"#fff",
padding:20,
borderRadius:12,
width:"80%"
},

modalTitle:{
fontSize:18,
fontWeight:"700",
marginBottom:10
},

modalText:{
fontSize:14,
marginBottom:16
},

modalActions:{
flexDirection:"row"
}

});