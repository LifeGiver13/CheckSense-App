import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors.jsx';

export default function AppLogo() {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Feather name='book-open' color={colors.white} size={24} />
      </View>
      <Text style={styles.text}>CheckSense</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
  },
});
