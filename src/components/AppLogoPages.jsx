import { Feather } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors.jsx';

export default function AppLogoPages({ color = colors.black }) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Feather name="book-open" size={22} color={colors.white} />
      </View>
      <View style={styles.logo}>
        <Text style={[styles.text, { color }]}>CheckSense</Text>
        <Text style={[styles.subtitle, { color }]}>GCE Study Companion</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10, // remove color here; it does nothing
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
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12, // you can add this
  },
  logo:{
    alignItems: 'center',
  }
});
