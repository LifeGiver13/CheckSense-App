import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors.jsx';

export default function Username({ color = colors.black, avatarSize = 50 }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem('auth_user');
        if (userData) {
          const parsed = JSON.parse(userData);
          setUsername(parsed.username || '');
          setEmail(parsed.email || '');
          setAvatar(parsed?.profile?.profilePic || null);
        }
      } catch (error) {
        console.log('Failed to load user', error);
      }
    };

    loadUser();
  }, []);

  return (
    <View style={styles.container}>
      {avatar && (
        <Image
          source={{ uri: avatar }}
          style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
        />
      )}
      <View style={styles.info}>
        <Text style={[styles.text, { color }]}>{username}</Text>
        <Text style={[styles.subtitle, { color }]}>{email}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginLeft: 10
  },
  info: {
    flexDirection: 'column',
  },
  avatar: {
    backgroundColor: colors.secondary,
  },
  text: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
  },
});
