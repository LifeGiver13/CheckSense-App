import { Image, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../theme/colors.jsx';

export default function Username({ user, color = colors.black, avatarSize = 50 }) {
  const router = useRouter();

  const username = user?.username || '';
  const email = user?.email || '';
  const avatar = user?.profile || null;

  // Get first letter for default avatar
  const initial = username?.charAt(0)?.toUpperCase() || 'U';

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.replace('/settings/account')} style={{ flexDirection: 'row', alignItems: 'center' }}>
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              {
                width: avatarSize,
                height: avatarSize,
                borderRadius: avatarSize / 2,
                backgroundColor: colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <Text style={{ color: '#fff', fontSize: avatarSize / 2, fontWeight: 'bold' }}>{initial}</Text>
          </View>
        )}

        <View style={[styles.info, { marginLeft: 12 }]}>
          <Text style={[styles.text, { color }]}>{username}</Text>
          <Text style={[styles.subtitle, { color }]}>{email}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 10,
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