import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors } from '../../../theme/colors.jsx';

export default function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.secondary,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  text: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
