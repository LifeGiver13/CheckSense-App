import { Feather } from '@expo/vector-icons';
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
import { useAuth } from '../../contexts/AuthContext.jsx';
import { colors } from '../../theme/colors.jsx';

export default function LoginScreen() {
  const { login } = useAuth(); // get login function from context
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter()
  const handleLogin = async () => {
    setIsLoading(true);
    setError('');

    if (!loginData.username || !loginData.password) {
      setError('Both fields are required.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await login(loginData.username, loginData.password);

      if (!result.success) {
        setError(result.error || 'Login failed');
        Alert.alert('Login Failed', result.error || 'Login failed');
      } else {
        Alert.alert('Login Successful', `Welcome, ${loginData.username}!`);
        router.push('/arrange-quiz');
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong. Please try again.');
      Alert.alert('Login Failed', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* App Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Feather name="book-open" size={28} color={colors.white} />
          </View>
          <Text style={styles.appName}>CheckSense</Text>
        </View>

        <Text style={styles.heading}>Welcome Back</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Username */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={loginData.username}
            onChangeText={(text) => setLoginData({ ...loginData, username: text })}
            editable={!isLoading}
            placeholder="Enter your username"
            placeholderTextColor={colors.mutedBlack}
          />
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={loginData.password}
              onChangeText={(text) => setLoginData({ ...loginData, password: text })}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedBlack}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Feather
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.secondaryLight}
              />
            </Pressable>
          </View>
        </View>

        {/* Login Button */}
        <Pressable style={styles.button} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>

        {/* Sign Up Link */}
        <View style={styles.bottomText}>
          <Text style={{ color: colors.black }}>Do not have an account? </Text>
          <Text style={styles.link} onPress={() => router.push('/register')}>
            Sign Up
          </Text>
        </View>

        {/* Back to Home */}
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Home</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.primary,
  },
  card: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 10,
  },
  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.black,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    color: colors.black,
  },
  input: {
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    color: colors.black,
    backgroundColor: colors.white,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
  },
  eyeButton: {
    padding: 4,
      },
  button: {
    backgroundColor: colors.primaryDark,
    padding: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginVertical: 12,
  },
  buttonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
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
  backButton: {
    alignItems: 'center',
  },
  backText: {
    color: colors.black,
    fontWeight: 600
  },
  error: {
    color: '#f87171',
    textAlign: 'center',
    marginBottom: 8,
  },
});
