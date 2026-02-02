import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRouter } from 'expo-router';
import { colors } from '../../../theme/colors.jsx';
import AppLogo from '../components/AppLogo';
import FeatureCard from '../components/FeatureCard';
import PrimaryButton from '../components/PrimaryButton';
export default function LandingScreen() {
    const router = useRouter()
  
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDark]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
       <View style={styles.header}>
         <AppLogo />

        <View style={styles.headerActions}>
          <Text style={styles.headerLink} onPress={() => router.push('/register')}>
            Sign Up
          </Text>

          <Text style={styles.headerButton} onPress={() => router.push('/login')}>
            Login
          </Text>
        </View>
        </View>


        {/* Hero */}
        <Text style={styles.badge}>🇨🇲 Built for Cameroon GCE </Text>

        <Text style={styles.title}>
          Master Your <Text style={styles.highlight}>GCE Exams</Text>
        </Text>

        <Text style={styles.subtitle}>
Generate unique quizzes on any topic, anytime. Practice with instant feedback or test yourself in exam conditions.        </Text>

        <PrimaryButton
          title="⚡Take a Quiz "
          onPress={() => router.push('/login')}
        />

        {/* Features */}
        <View style={styles.features}>
          <FeatureCard
            icon={<Feather name='zap' size={28} color={colors.white} />}
            title="Instant Quizzes"
            description="Generate custom quizzes on any subject and topic in seconds"
          />

          <FeatureCard
            icon={<Feather name='book-open' size={28} color={colors.white} />}
            title="Two Study Modes"
            description="Practice with hints or simulate real exam conditions"
          />

          <FeatureCard
            icon={<Feather name='zap' size={28} color={colors.white} />}
            title="Track Progress"
            description="Monitor your performance and earn achievement badges."
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    marginTop: 20,
    alignItems: 'center',
  },

  badge: {
    color: colors.secondary,
    borderColor: colors.secondary,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    color: colors.white,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  highlight: {
    color: colors.secondary,
  },
  subtitle: {
    color: colors.mutedWhite,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  features: {
    width: '100%',
    marginTop: 40,
    gap: 20,
    marginBottom: 50
  },
  // headeractions
  header: {
  width: '100%',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 30,
},

headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 14,
},

headerLink: {
  color: colors.white,
  fontSize: 14,
},

headerButton: {
  color: colors.white,
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.3)',
  paddingHorizontal: 14,
  paddingVertical: 6,
  borderRadius: 20,
}
});