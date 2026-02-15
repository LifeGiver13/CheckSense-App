import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors.jsx";

export default function QuizAction({
    icon,
    title,
    description,
}) {
    return (
        <View style={styles.card}>
            <View style={styles.dashboardContainers}>
                <View style={styles.titleCont}>
                    <View>{icon}</View>
                </View>
                <View style={styles.info}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 24,
        alignItems: "center",
        marginBottom: 10,
        borderColor: colors.white,
    },
    info:{
        justifyContent: 'flex-start',
        marginLeft: 5,
        alignItems:'flex-start'
    },
    titleCont: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    }
    ,
    dashboardContainers: {
        justifyContent: 'flex-start',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginLeft: 20,
        marginTop: "-4%"
    }
    ,
    title: {
        color: colors.white,
        fontSize: 20,
        fontWeight: "bold",
    },

    description: {
        color: colors.mutedWhite,
        fontSize: 14,
        marginBottom: 16,
    },

});

