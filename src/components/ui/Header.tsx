import { Feather as Icon } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows, spacing, typography } from '../../constants/theme';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const Header = () => {
  const router = useRouter();
  const greeting = getGreeting();
  const date = new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.greeting}>{`${greeting}, Elisha`}</Text>
      </View>
      <Pressable
        onPress={() => router.push('/profile')}
        style={styles.avatarButton}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
      >
        <Image source={require('../../../assets/images/user.png')} style={styles.avatarImage} contentFit="cover" />
        <View style={styles.badge}>
          <Icon name="bell" size={12} color={colors.white} />
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  textWrap: {
    flex: 1,
  },
  date: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  greeting: {
    ...typography.title,
    color: colors.text,
  },
  avatarButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    paddingHorizontal: 4,
    zIndex: 10,
    elevation: 6,
  },
});
