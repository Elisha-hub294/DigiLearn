import { Feather as Icon } from "@expo/vector-icons";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useProfile } from "../../contexts/ProfileContext";
import {
  DeletableResourceCollection,
  deleteResource,
} from "../../services/resourceDeletion";
import { ActionDialog } from "./ActionDialog";
import { CardActionMenu } from "./CardActionMenu";

export function ResourceDeleteMenu({
  collection,
  id,
  title,
  data,
  onDeleted,
  light = false,
}: {
  collection: DeletableResourceCollection;
  id: string;
  title: string;
  data: Record<string, unknown>;
  onDeleted?: () => void;
  light?: boolean;
}) {
  const { user, profile } = useProfile();
  const buttonRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const canDelete = Boolean(
    user && (profile?.type === "admin" || data.owner === user.uid),
  );

  if (!canDelete) return null;

  const openMenu = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setMenuVisible(true);
    });
  };

  const confirmDelete = async () => {
    setConfirmVisible(false);
    setBusy(true);
    try {
      await deleteResource(collection, id);
      onDeleted?.();
    } catch (error) {
      console.error("Failed to delete resource:", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable
        ref={buttonRef}
        accessibilityRole="button"
        accessibilityLabel={`More options for ${title}`}
        onPress={(event) => {
          event.stopPropagation?.();
          openMenu();
        }}
        style={styles.button}
      >
        <Icon
          name="more-vertical"
          size={18}
          color={light ? "#fff" : "#334155"}
        />
      </Pressable>
      <CardActionMenu
        visible={menuVisible && Boolean(anchor)}
        anchor={anchor}
        actions={[
          {
            label: "Delete",
            icon: "trash-2",
            accessibilityLabel: `Delete ${title}`,
            destructive: true,
            onPress: () => setConfirmVisible(true),
          },
        ]}
        onClose={() => setMenuVisible(false)}
      />
      <ActionDialog
        visible={confirmVisible}
        title="Delete this resource?"
        message={`This will permanently delete "${title}" and all of its stored files. This action cannot be undone.`}
        primaryText={busy ? "Deleting..." : "Delete"}
        secondaryText="Cancel"
        onPrimary={confirmDelete}
        onSecondary={() => setConfirmVisible(false)}
        onClose={() => setConfirmVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 32,
    minHeight: 32,
  },
});
