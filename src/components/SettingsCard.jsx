import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors.jsx";

export default function SettingsCard({ icon, title, description, items = [], onPress, colorBg, colorText }) {
  return (
    <Pressable style={[styles.card, { borderColor: colorBg }]} onPress={onPress}>
      <View style={[styles.cardHeader, { backgroundColor: colorBg }]}>
        <View style={styles.iconWrapper}>{icon}</View>
        <Text style={[styles.cardTitle, { color: colorText }]}>{title}</Text>
        <Text style={[styles.cardDescription, { color: colorText }]}>{description}</Text>
      </View>
      <View style={styles.cardBody}>
        {items.map((item, idx) => (
          <View key={idx} style={styles.cardItem}>
            <Text style={[styles.check, { color: colors.success }]}>✓</Text>
            <Text style={styles.cardItemText}>{item}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 2, borderRadius: 10, marginBottom: 16 },
  cardHeader: { padding: 16, borderRadius: 10, alignItems:'center' },
  iconWrapper: { marginBottom: 8},
  cardTitle: { fontSize: 20, fontWeight: "bold" },
  cardDescription: { fontSize: 14 },
  cardBody: { padding: 16 },
  cardItem: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  check: { marginRight: 8 },
  cardItemText: { fontSize: 14 },
});
