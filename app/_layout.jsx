import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import 'react-native-gesture-handler';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { CurriculumProvider } from '../contexts/CurriculumContext.jsx';
import { LastQuizTakeContextProvider } from '../contexts/LastQuizTake.jsx';
import { LevelProgressProvider } from '../contexts/LevelProgressContext.jsx';
import { QuizGenerationProvider } from '../contexts/QuizgenerationContext.jsx';
import { QuizSessionProvider } from '../contexts/QuizSessionContext.jsx';

import AppLogoPages from '../src/components/AppLogoPages.jsx';
import Username from '../src/components/Username.jsx';
import { colors } from '../theme/colors.jsx';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const headerTextColor = isDark ? colors.white : colors.black;
  const headerBgColor = isDark ? '#0b0b0b' : colors.white;

  return (
    <AuthProvider>
      <CurriculumProvider>
        <LastQuizTakeContextProvider>
          <QuizGenerationProvider>
            <LevelProgressProvider>
              <QuizSessionProvider>
                <Drawer
                  screenOptions={({ navigation }) => ({
                    headerShown: true,
                    headerStyle: { backgroundColor: headerBgColor },
                    headerTitle: () => <AppLogoPages color={headerTextColor} />,
                    headerRight: () => (
                      <TouchableOpacity
                        onPress={() => navigation.toggleDrawer()}
                        style={{ marginRight: 15 }}
                      >
                        <Feather name="menu" size={26} color={headerTextColor} />
                      </TouchableOpacity>
                    ),
                    headerLeft: () => null,
                  })}
                  drawerContent={() => <DrawerContent />}
                >
                  <Drawer.Screen
                    name="index"
                    options={{ headerShown: false, drawerItemStyle: { height: 0 } }}
                  />
                  <Drawer.Screen
                    name="login"
                    options={{ headerShown: false, drawerItemStyle: { height: 0 } }}
                  />
                  <Drawer.Screen
                    name="dashboard"
                    options={{ title: 'Dashboard' }}
                  />
                  <Drawer.Screen
                    name="arrange-quiz"
                    options={{ title: 'Arrange Quiz' }}
                  />
                  <Drawer.Screen
                    name="quizzes"
                    options={{ title: 'Quizzes' }}
                  />
                  <Drawer.Screen
                    name="settings"
                    options={{ title: 'Settings' }}
                  />
                </Drawer>
              </QuizSessionProvider>
            </LevelProgressProvider>
          </QuizGenerationProvider>
        </LastQuizTakeContextProvider>
      </CurriculumProvider>
    </AuthProvider>
  );
}

function DrawerContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const textColor = isDark ? colors.white : colors.black;
  const dividerColor = isDark ? 'rgba(255,255,255,0.15)' : '#ccc';
  const drawerBgColor = isDark ? '#0b0b0b' : colors.white;

  const router = useRouter();
  const pathname = usePathname();
  const { logout, isAuthenticated, isLoading, verifySession } = useAuth();

  const isActive = (route) => pathname === `/${route}`;

  const renderLink = (route, label, icon) => {
    const active = isActive(route);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/${route}`)}
        style={[styles.link, active && styles.activeLink]}
      >
        <View style={styles.container}>
          <Feather
            name={icon}
            size={22}
            color={active ? colors.white : textColor}
          />
          <Text style={[styles.linkText, { color: textColor }, active && styles.activeText]}>
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  React.useEffect(() => {
    if (!isAuthenticated) return;

    let interval;
    let isHandlingExpiry = false;

    const checkSession = async () => {
      if (isHandlingExpiry) return;

      const valid = await verifySession();

      if (!valid) {
        isHandlingExpiry = true;
        clearInterval(interval);

        Alert.alert("Session expired", "Please login again");

        await logout();
        router.replace('/login');
      }
    };

    checkSession();
    interval = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isLoading) return null;

  return (
    <ScrollView
      contentContainerStyle={{
        flex: 1,
        justifyContent: 'space-between',
        backgroundColor: drawerBgColor,
      }}
    >
      <ScrollView contentContainerStyle={styles.sidebar}>
        <AppLogoPages color={textColor} />
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        {isAuthenticated && <Username color= {dividerColor}/>}
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={styles.drawerLinks}>
          {renderLink('dashboard', 'Dashboard', 'home')}
          {renderLink('arrange-quiz', 'Arrange Quiz', 'book-open')}
          {renderLink('quizzes', 'Quizzes', 'help-circle')}
          {renderLink('settings', 'Settings', 'settings')}
        </View>
      </ScrollView>

      <View style={{ padding: 10 }}>
        {isAuthenticated ? (
          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace('/login');
            }}
            style={[
              styles.link,
              {
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                justifyContent: 'center',
                backgroundColor: colors.secondary,
              },
            ]}
          >
            <Feather name="log-out" size={20} color={colors.black} />
            <Text
              style={[
                styles.linkText,
                { color: colors.black, fontWeight: '700', marginLeft: 2 },
              ]}
            >
              Logout
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={[styles.link, { backgroundColor: colors.primaryDark }]}
          >
            <Feather name="log-in" size={20} color={colors.white} />
            <Text style={[styles.linkText, { color: colors.white }]}>
              Login
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  drawerLinks: {
    marginTop: 6,
    flexDirection: 'column',
    gap: 14,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 10,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  activeLink: {
    backgroundColor: colors.primaryDark,
    width: '96%',
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
  },
  activeText: {
    color: colors.white,
    fontWeight: '700',
  },
  sidebar: {
    flex: 1,
    paddingTop: 33,
    marginLeft: 10,
    gap: 10,
  },
});
