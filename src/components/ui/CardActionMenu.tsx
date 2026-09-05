import { Feather as Icon } from "@expo/vector-icons";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { radius } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export type CardActionMenuItem = {
  label: string;
  icon: keyof typeof Icon.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
  destructive?: boolean;
};

type Anchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CardActionMenuProps = {
  visible: boolean;
  anchor: Anchor | null;
  actions: CardActionMenuItem[];
  onClose: () => void;
};

const MENU_MIN_WIDTH = 126;

export function CardActionMenu({
  visible,
  anchor,
  actions,
  onClose,
}: CardActionMenuProps) {
  const { colors: themeColors } = useTheme();
  if (!visible || !anchor) {
    return null;
  }

  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
  const menuWidth = Math.min(
    Math.max(
      MENU_MIN_WIDTH,
      126 + Math.max(...actions.map((action) => action.label.length * 2.8), 0),
    ),
    170,
  );
  const menuHeight = Math.min(220, 14 + actions.length * 38 + 8);

  let top = anchor.y + anchor.height + 8;
  if (top + menuHeight > screenHeight - 18) {
    top = anchor.y - menuHeight - 8;
  }
  top = Math.max(16, Math.min(top, screenHeight - menuHeight - 16));

  let left = anchor.x + anchor.width / 2 - menuWidth / 2;
  left = Math.max(12, Math.min(left, screenWidth - menuWidth - 12));

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.menu,
          {
            left,
            top,
            width: menuWidth,
            maxHeight: menuHeight,
            backgroundColor: themeColors.white,
            borderColor: themeColors.border,
          },
        ]}
      >
        {actions.map((action, index) => (
          <Pressable
            key={`${action.label}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && { backgroundColor: themeColors.lightBackground },
              index === actions.length - 1 && styles.menuItemLast,
            ]}
          >
            <Icon
              name={action.icon as any}
              size={15}
              color={action.destructive ? "#d14343" : themeColors.dark}
            />
            <Text
              style={[
                styles.menuLabel,
                { color: themeColors.text },
                action.destructive && styles.menuLabelDestructive,
              ]}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
  },
  menu: {
    position: "absolute",
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    zIndex: 50,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  menuItemPressed: {},
  menuItemLast: {
    marginBottom: 0,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  menuLabelDestructive: {
    color: "#d14343",
  },
});
