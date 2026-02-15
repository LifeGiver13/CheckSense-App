import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors.jsx";

export default function ActionCard({
  icon,
  title,
  description,
  buttons = [], 
}) {
  return (
    <View style={styles.card}>
      <View style={styles.dashboardContainers}>
      <View style={styles.titleCont}>
        <View>{icon}</View>

        <Text style={styles.title}>{title}</Text>
      </View>

      <Text style={styles.description}>{description}</Text>
</View>
      {/* Buttons */}
      {buttons.length > 0 && (
        <View style={styles.buttonRow}>
          {buttons.slice(0, 2).map((btn, index) => (
            <Pressable
              key={index}
              onPress={btn.onPress}
              style={[
                styles.button,
                btn.type === "secondary"
                  ? styles.secondaryBtn
                  : styles.primaryBtn,
              ]}
            >
              {btn.icon && <View style={styles.btnIcon}>{btn.icon}</View>}
              <Text style={styles.buttonText}>{btn.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.primaryDark
  },
  titleCont: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start'
  }
  ,
dashboardContainers:{
  justifyContent: 'flex-start'
}
,
  title: {
    color: colors.black,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
    marginLeft: 7,
  },

  description: {
    color: colors.mutedBlack,
    textAlign: "center",
    fontSize: 14,
    marginBottom: 16,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },

  primaryBtn: {
    backgroundColor: colors.secondary,
  },

  secondaryBtn: {
    backgroundColor: colors.primaryDark,
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },

  btnIcon: {
    marginRight: 8,
  },

  buttonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
});

