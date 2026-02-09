import { Feather } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { QuizGenerationProvider } from '../contexts/QuizgenerationContext.jsx';
import AppLogoPages from '../src/components/AppLogoPages.jsx';
import Username from '../src/components/Username.jsx';
import { colors } from '../theme/colors.jsx';

export default function RootLayout() {
  const pathname = usePathname();

  const isActive = (route) => pathname === `/${route}`;

  const renderLink = (route, label, icon) => {
    const active = isActive(route);

    return (
      <TouchableOpacity
        onPress={() => navigationRef.navigate(route)}
        style={[
          styles.link,
          active && styles.activeLink,
        ]}
      >
        <View style={styles.container}>
          <Feather
            name={icon}
            size={22}
            color={active ? colors.white : colors.black}
          />
          <Text
            style={[
              styles.linkText,
              active && styles.activeText,
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const DrawerContent = ({ navigation }) => {
    const { logout, isAuthenticated, isLoading, verifySession } = useAuth();

    navigationRef = navigation;

    // Auto logout if session expired
    React.useEffect(() => {
      const checkSession = async () => {
        const valid = await verifySession();
        if (!valid) {
          Alert.alert("Session expired", "Please login again");
          await logout();
          navigation.navigate('login');
        }
      };
      checkSession();
      const interval = setInterval(checkSession, 60 * 1000); // check every minute
      return () => clearInterval(interval);
    }, []);

    if (isLoading) return null; // wait until auth state is loaded

    return (
      <ScrollView contentContainerStyle={{ flex: 1, justifyContent: 'space-between' }}>
        <ScrollView contentContainerStyle={styles.sidebar}>
          <AppLogoPages color={colors.black} />
          <View style={styles.divider} />
          {isAuthenticated && <Username />}
          <View style={styles.divider} />

          <View style={styles.drawerLinks}>
            {renderLink('arrange-quiz', 'Arrange Quiz', 'home')}
            {renderLink('quizzes', 'Quizzes', 'book-open')}
            {renderLink('settings', 'Settings', 'settings')}
            {renderLink('dashboard', 'Dashboard', 'folder')}
          </View>
        </ScrollView>

        {/* Logout/Login at bottom */}
        <View style={{ padding: 10 }}>
          {isAuthenticated ? (
            <TouchableOpacity
              onPress={async () => {
                await logout();
                navigation.navigate('login');
              }}
              style={[
                styles.link,
                {
                  backgroundColor: colors.red,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  justifyContent: 'center',
                  backgroundColor: colors.secondary
                },
              ]}
            >
              <Feather name="log-out" size={20} color={colors.black} />
              <Text style={[styles.linkText, { color: colors.black, fontWeight: '700',marginLeft:2 }]}>
                Logout
              </Text>
            </TouchableOpacity>

          ) : (
            <TouchableOpacity
              onPress={() => navigation.navigate('login')}
              style={[styles.link, { backgroundColor: colors.primaryDark }]}
            >
              <Feather name="log-in" size={20} color={colors.black} />
              <Text style={[styles.linkText, { color: colors.white }]}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <AuthProvider>
      <QuizGenerationProvider>
        <Drawer
          screenOptions={({ navigation }) => ({
            headerShown: true,
            headerTitle: () => <AppLogoPages color={colors.black} />,
            headerRight: () => (
              <TouchableOpacity
                onPress={() => navigation.toggleDrawer()}
                style={{ marginRight: 15 }}
              >
                <Feather name="menu" size={26} color={colors.black} />
              </TouchableOpacity>
            ),
            headerLeft: () => null,
          })}
          drawerContent={DrawerContent}
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
      </QuizGenerationProvider>
    </AuthProvider>
  );
}

// store navigation for renderLink
let navigationRef = null;

const styles = StyleSheet.create({
  drawerLinks: {
    marginTop: 6,
    display: 'flex',
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
    display: 'flex',
  },
});
