import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { colors, shadows, spacing, typography } from '../../constants/theme';

export const Header = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.date}>24 Jun</Text>
        <Text style={styles.greeting}>Hi, Kathryn</Text>
      </View>
      <Pressable onPress={() => router.push('/profile')} style={styles.avatarButton}>
        <Image source={require('../../../assets/images/user.png')} style={styles.avatarImage} />
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
    marginBottom: 2,
  },
  greeting: {
    ...typography.title,
    color: colors.text,
  },
  avatarButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
});
