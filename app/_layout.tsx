import { colors } from '@/theme/colors';
import { Feather } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import { TouchableOpacity } from 'react-native';
import 'react-native-gesture-handler';
import { AuthProvider } from '../contexts/AuthContext';
import AppLogoPages from './src/components/AppLogo.jsx';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Drawer
        screenOptions={({ navigation }) => ({
          headerShown: true,
          headerTitle: () => <AppLogoPages/> ,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.toggleDrawer()}
              style={{ marginLeft: 15 }}
            >
              <Feather name="menu" size={26} color="black" />
            </TouchableOpacity>
          ),
          headerLeft: ()=> null,
          headerTintColor: colors.black
        })}
      >
        {/* These names MUST match file names */}
        <Drawer.Screen
          name="index"
          options={{ title: 'CheckSense',
            headerShown: false,
            drawerItemStyle: {height: 0}
           }}/>

        <Drawer.Screen
          name="login"
          options={{ 
            title: 'Login',
            headerShown: false,
            drawerItemStyle: {height: 0}
           }}
        />

        <Drawer.Screen
          name="arrange-quiz"
          options={{ title: 'Arrange Quiz' }}
        />
      </Drawer>
    </AuthProvider>
  );
}
