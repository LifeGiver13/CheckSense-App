import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors.jsx';

export default function QuizType({ icon, title, description }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 24,
    width: '50%',
    alignItems: 'center',
    marginBottom: 10,
    borderColor: colors.primaryDark,
    borderWidth: 1,
  },
   iconBox: {
      width: 60,
      height: 60,
      backgroundColor: colors.secondary,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
  title: {
    color: colors.black,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    color: colors.mutedBlack,
    textAlign: 'center',
    fontSize: 10,
  },
})