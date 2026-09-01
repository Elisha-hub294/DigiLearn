import { useRouter } from "expo-router";
import { AddItemModal } from "../components/library/AddItemModal";
import { PublishAccessGate } from "../components/library/PublishAccessGate";
import { useProfile } from "../contexts/ProfileContext";

export default function AddBannerScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const isAuthorizedPublisher =
    profile?.type === "teacher" || profile?.type === "admin";

  return (
    <PublishAccessGate
      isAuthorizedPublisher={isAuthorizedPublisher}
      title="Add Announcement"
      unauthorizedMessage="Only teacher or admin accounts can publish announcements. Please switch to an approved account type to continue."
      onBack={() => router.back()}
    >
      <AddItemModal
        visible
        screen
        formType="banner"
        onClose={() => router.back()}
        onSuccess={() => router.replace("/")}
      />
    </PublishAccessGate>
  );
}
