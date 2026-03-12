import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext.jsx';
import { colors } from '../theme/colors.jsx';

const SCHOOLS = [
  "Government Bilingual High School, Yaoundé",
  "Government High School, Buea",
  "Sacred Heart College, Mankon",
  "St. Joseph's College, Sasse",
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, login } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    password: '',
    school: '',
    referralCode: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

 const handleRegister = async () => {
  setError('');

  if (!formData.firstName || !formData.lastName || !formData.username || !formData.password) {
    setError("Please fill in all required fields.");
    return;
  }

  try {
    setIsLoading(true);

    const result = await register(formData);

    if (!result.success) {
      setError(result.error || "Registration failed");
      Alert.alert("Registration Failed", result.error || "Registration failed");
      return;
    }

    const loginUser = await login(formData.username, formData.password);

    if (!loginUser.success) {
      setError(loginUser.error || "Account created");
      Alert.alert("Account Created", "Please Login");

    router.replace("/login");
      }

    // Alert.alert("Success", `Welcome, ${formData.username}!`);
    router.replace("/dashboard");

  } catch (err) {
    console.log(err);
    setError("Something went wrong.");
    Alert.alert("Error", "Something went wrong.");
  } finally {
    setIsLoading(false);
  }
};
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Feather name="book-open" size={28} color={colors.white} />
          </View>
          <Text style={styles.appName}>CheckSense</Text>
        </View>

        <Text style={styles.heading}>Create Account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* First + Last name */}
        <View style={styles.row}>
          <View style={styles.half}>
            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              placeholder="Enter Your First Name"
                placeholderTextColor={colors.mutedBlack}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            />
          </View>

          <View style={styles.half}>
            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your Last Name"
                placeholderTextColor={colors.mutedBlack}
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            />
          </View>
        </View>

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
              placeholderTextColor={colors.mutedBlack}
            value={formData.username}
            onChangeText={(text) => setFormData({ ...formData, username: text })}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>

          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.password,{ flex: 1 }]}
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
                placeholderTextColor={colors.mutedBlack}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
            />

            <Pressable onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.secondaryLight}
              />
            </Pressable>
          </View>
        </View>

        {/* School Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>School (Optional)</Text>

          <View    style={styles.picker}>
            <Picker
              selectedValue={formData.school}
              style={styles.picker}
              onValueChange={(value) => setFormData({ ...formData, school: value })}
            >
              <Picker.Item label="Select your School" value="" />

              {SCHOOLS.map((school) => (
                <Picker.Item key={school} label={school} value={school} />
              ))}

            </Picker>
          </View>
        </View>

        {/* Referral Code */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Referral Code (Optional)</Text>

          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="The WhatsApp number of your Referee"
             placeholderTextColor={colors.mutedBlack}
            value={formData.referralCode}
            onChangeText={(text) => setFormData({ ...formData, referralCode: text })}
          />
        </View>

        {/* Register Button */}
        <Pressable style={styles.button} onPress={handleRegister}>
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </Pressable>

           <View style={styles.bottomText}>
                  <Text style={{ color: colors.black }}>Do not have an account? </Text>
                  <Text style={styles.link} onPress={() => router.push('/login')}>
                   Login
                  </Text>
                </View>

        {/* Back */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Home</Text>
        </Pressable>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({

container:{
flexGrow:1,
justifyContent:"center",
padding:20,
backgroundColor:colors.primary
},

card:{
backgroundColor:colors.white,
padding:24,
borderRadius:12,
elevation:5
},

logoContainer:{
flexDirection:"row",
justifyContent:"center",
alignItems:"center",
gap:10,
marginBottom:16
},

logoBox:{
width:48,
height:48,
backgroundColor:colors.secondary,
borderRadius:12,
alignItems:"center",
justifyContent:"center"
},

appName:{
fontSize:24,
fontWeight:"bold"
},

heading:{
fontSize:20,
fontWeight:"600",
textAlign:"center",
marginBottom:16
},

row:{
flexDirection:"row",
gap:10
},

half:{
flex:1
},

inputGroup:{
  marginTop: 10,
marginBottom:12
},

label:{
marginBottom:4
},

input:{
borderWidth:1,
borderColor:"#ddd",
color: colors.black,
padding:12,
borderRadius:6
},
password:{
  color: colors.mutedBlack
},
passwordWrapper:{
flexDirection:"row",
alignItems:"center",
borderWidth:1,
borderColor:"#ddd",
color: colors.mutedBlack,
borderRadius:6,
paddingHorizontal:10
},

picker:{
borderWidth:1,
borderColor:"#ddd",
color: colors.mutedBlack,
borderRadius:6,
backgroundColor: colors.white
},

button:{
backgroundColor:colors.primaryDark,
padding:14,
borderRadius:6,
alignItems:"center",
marginVertical:12
},

buttonText:{
color:colors.white,
fontWeight:"bold",
fontSize:16
},

backButton:{
alignItems:"center"
},

backText:{
fontWeight:"600"
},

error:{
color:"#f87171",
textAlign:"center",
marginBottom:8
},

 bottomText: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
   link: {
    color: colors.primary,
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },

});

