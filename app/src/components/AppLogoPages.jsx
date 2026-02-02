import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../theme/colors.jsx';

export default function AppLogoPages() {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Feather name="book-open" size={22} color={colors.white} />
      </View>

      <View>
        <Text>CheckSense</Text>
        <Text>GCE Study Companion</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    color: colors.black,
    gap: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.secondary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
