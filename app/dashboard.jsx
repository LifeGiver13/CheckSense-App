import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import ActionCard from '../src/components/ActionCard.jsx';
import { colors } from '../theme/colors.jsx';
export default function Dashboard() {
    const router = useRouter()
    const [username, setUsername] = useState('');



    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await AsyncStorage.getItem('auth_user');
                if (userData) {
                    const parsed = JSON.parse(userData);
                    setUsername(parsed.username || '');
                }
            } catch (error) {
                console.log('Failed to load user', error);
            }
        };

        loadUser();
    }, []);

    return (

        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.userMsg}>
                <Text style={styles.title}>Hi, {username}!</Text>
                <Text style={styles.subtitle}>
                    Ready to continue your learning journey?
                </Text>


                {/* Features */}
                <Text style={styles.pageTitle}>What would you like to do today?</Text>
            </View>
            <View style={styles.features}>
                <ActionCard
                    icon={<Feather name='book-open' size={28} color={colors.black} />}
                    title="Explore Subjects"
                    description="Browse subjects and topics to find quizzes"
                    buttons={[
                        {
                            label: "Browser Subjects",
                            icon: <Feather name="folder" size={18} color={colors.white} />,
                            onPress: () => { router.push('/browse-subjects') },
                            type: "primary",
                        },
                    ]}
                />
                <ActionCard
                    icon={<Feather name='zap' size={28} color={colors.black} />}
                    title="Quizzes"
                    description="Take existing quizzes or create your own custom quiz"
                    buttons={[
                        {
                            label: "Quiz",
                            icon: <Feather name="book-open" size={18} color={colors.white} />,
                            onPress: () => { router.push('/browse-subjects') },
                            type: "primary",
                        },
                        {
                            label: "Create",
                            icon: <Feather name="eye" size={18} color={colors.white} />,
                            onPress: () => { router.push('/arrange-quiz') },
                            type: "secondary",
                        },
                    ]}
                />



                <ActionCard
                    icon={<Feather name='zap' size={28} color={colors.black} />}
                    title="Games"
                    description="Have fun with word searches and puzzles"
                    buttons={[
                        {
                            label: "Games",
                            icon: <Feather name="play" size={18} color={colors.white} />,
                            onPress: () => { router.push('/games') },
                            type: "primary",
                        },
                    ]}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({

    content: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: colors.white
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
        fontSize: 26,
        color: colors.black,
        fontWeight: 'bold',
        textAlign: 'left',
    },
    pageTitle: {
        fontSize: 18,
        color: colors.black,
    },
    highlight: {
        color: colors.secondary,
    },
    subtitle: {
        color: colors.mutedBlack,
        fontSize: 12,
        marginBottom: 30,
    },
    features: {
        width: '100%',
        marginTop: 20,
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
    },
    userMsg: {
        display:'flex',
        flexDirection:'column',
        justifyContent:'flex-start',
        textAlign:'left',
        marginLeft: -50
    }
});