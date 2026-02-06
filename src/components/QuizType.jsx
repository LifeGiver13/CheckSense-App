import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors.jsx";

export default function QuizType({ icon, title, description, onSelect, selected }) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={[styles.iconBox, selected && styles.iconSelected]}>
        {icon}
      </View>

      <Text style={[styles.title, selected && styles.textSelected]}>
        {title}
      </Text>

      <Text style={[styles.description, selected && styles.textSelected]}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    width: "50%",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },

  cardSelected: {
    borderColor: colors.secondary,
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  cardPressed: {
    opacity: 0.85,
  },

  iconBox: {
    width: 60,
    height: 60,
    backgroundColor: colors.secondary,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  iconSelected: {
    backgroundColor: colors.primaryDark,
  },

  title: {
    color: colors.black,
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
  },

  description: {
    color: colors.mutedBlack,
    textAlign: "center",
    fontSize: 10,
  },

  textSelected: {
    color: colors.primaryDark,
  },
});
