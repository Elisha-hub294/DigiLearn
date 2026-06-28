import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/theme';

type TabRoute = {
  key: string;
  name: string;
};

const tabs = [
  { name: 'Home', icon: 'home', route: 'index' },
  { name: 'Library', icon: 'book', route: 'library' },
  { name: 'Videos', icon: 'video', route: 'videos' },
  { name: 'Settings', icon: 'settings', route: 'settings' },
] as const;

export const BottomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route: TabRoute) => {
        // Find the matching tab config by route name
        const tab = tabs.find((t) => t.route === route.name);
        
        // Skip rendering if it's an internal Expo route (like _sitemap)
        if (!tab) return null;

        const isActive = state.routes[state.index].key === route.key;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon name={tab.icon as any} size={18} color={isActive ? colors.white : colors.subtitle} />
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.name}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -8 },
    elevation: 8,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  iconWrap: {
    padding: 10,
    borderRadius: radius.pill,
  },
  iconWrapActive: {
    backgroundColor: colors.primary,
  },
  label: {
    marginTop: 4,
    fontSize: 12,
    color: colors.subtitle,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.primary,
  },
});
