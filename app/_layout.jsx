import { Feather } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import AppLogoPages from '../src/components/AppLogoPages.jsx';
import Username from '../src/components/Username.jsx';
import { colors } from '../theme/colors.jsx';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerTitle: () => <AppLogoPages color={colors.black} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ marginLeft: 15 }}
            >
              <Feather name="menu" size={26} color="black" />
            </TouchableOpacity>
          ),
          headerLeft: () => null,
        })}
        drawerContent={({ navigation }) => (
          <ScrollView style={{ flex: 1, paddingTop: 40 }}>
            {/* Logo at the top */}
            <AppLogoPages color={colors.black} />

            {/* Custom Drawer Links */}
            <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 10 }} />
            <Username/>
            <View style={{ height: 1, backgroundColor: '#ccc', marginVertical: 10 }} />

            <View style={styles.drawerLinks}>
              <TouchableOpacity
                onPress={() => navigation.navigate('arrange-quiz')}
                style={styles.link}
              >

                {/* Arrrange Quiz */}
              <View style={styles.container}>
                 <View style={styles.iconBox}>
                    <Feather name='home' color={colors.black} size={24} />
                  </View>
                  <Text style={styles.linkText}>Arrange Quiz</Text>
              </View>
              </TouchableOpacity>


              {/* settings */}
               <TouchableOpacity
                onPress={() => navigation.navigate('settings')}
                style={styles.link}
                >
                <View style={styles.container}>
                
                <View style={styles.iconBox}>
                  <Feather name='settings' color={colors.black} size={24} />
                </View>
                <Text style={styles.linkText}>Settings</Text>
              </View>
              </TouchableOpacity>


            </View>
            
          </ScrollView>
        )}
      >
        <Drawer.Screen
          name="index"
          options={{ title: 'Landing', headerShown: false, drawerItemStyle: { height: 0 } }}
        />
        <Drawer.Screen
          name="login"
          options={{ title: 'Login', headerShown: false, drawerItemStyle: { height: 0 } }}
        />
        <Drawer.Screen
          name="arrange-quiz"
          options={{ title: 'Arrange Quiz' }}
        />
        <Drawer.Screen
          name="settings"
          options={{ title: 'Settings' }}
        />
      </Drawer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
    container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20
  },
  drawerLinks: {
    marginTop: 20,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
  },
});
