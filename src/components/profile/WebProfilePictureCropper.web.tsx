import type { ReactNode } from "react";
import { useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  visible: boolean;
  image: string | null;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
};

async function getCroppedImage(image: string, crop: Area) {
  const source = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("Unable to prepare this image."));
    element.src = image;
  });
  const canvas = document.createElement("canvas");
  canvas.width = crop.width;
  canvas.height = crop.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser cannot crop this image.");
  context.drawImage(
    source,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height,
  );
  return canvas.toDataURL("image/jpeg", 0.8);
}

type Area = { x: number; y: number; width: number; height: number };

export default function WebProfilePictureCropper({
  visible,
  image,
  onCancel,
  onConfirm,
}: Props): ReactNode {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    if (saving) return;
    setError("");
    setZoom(1);
    onCancel();
  };

  const confirm = async () => {
    if (!image || !area || saving) return;
    try {
      setSaving(true);
      onConfirm(await getCroppedImage(image, area));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "We couldn't crop this image. Please choose another image.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Adjust profile picture</Text>
          <Text style={styles.subtitle}>
            Move and zoom the image inside the square.
          </Text>
          <View style={styles.cropArea}>
            {image ? (
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="rect"
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedAreaPixels) =>
                  setArea(croppedAreaPixels)
                }
              />
            ) : null}
          </View>
          <View style={styles.zoomRow}>
            <Text style={styles.zoomLabel}>Zoom</Text>
            <input
              aria-label="Zoom profile picture"
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              style={{ flex: 1 }}
            />
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={close} disabled={saving} style={styles.cancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={saving || !area}
              style={styles.confirm}
            >
              <Text style={styles.confirmText}>
                {saving ? "Preparing..." : "Use photo"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
  },
  title: { color: "#0F172A", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#64748B", fontSize: 14, marginTop: 6 },
  cropArea: {
    width: "100%",
    height: 360,
    marginTop: 20,
    backgroundColor: "#0F172A",
    position: "relative",
  },
  zoomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
  },
  zoomLabel: { color: "#334155", fontSize: 14, fontWeight: "600" },
  error: { color: "#DC2626", fontSize: 13, marginTop: 12 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 22,
  },
  cancel: { minHeight: 44, paddingHorizontal: 18, justifyContent: "center" },
  cancelText: { color: "#475569", fontWeight: "700" },
  confirm: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#006eff",
    justifyContent: "center",
  },
  confirmText: { color: "#fff", fontWeight: "700" },
});
