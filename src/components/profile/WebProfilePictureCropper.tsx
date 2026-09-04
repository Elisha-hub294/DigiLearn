import type { ReactNode } from "react";

type Props = {
  visible: boolean;
  image: string | null;
  onCancel: () => void;
  onConfirm: (croppedImage: string) => void;
};

export default function WebProfilePictureCropper({
  visible,
  image,
  onCancel,
  onConfirm,
}: Props): ReactNode {
  return null;
}
