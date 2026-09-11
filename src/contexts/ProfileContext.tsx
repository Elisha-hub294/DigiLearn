import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth, db } from "../../firebaseConfig";
import {
  defaultUserProfile,
  ensureUserProfile,
  UserProfile,
} from "../services/userProfile";

type ProfileState = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};
const ProfileContext = createContext<ProfileState | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setProfile(null);
        setError(null);
        setLoading(Boolean(nextUser));
      }),
    [],
  );
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let active = true;
    let usersSnapshotReceived = false;
    let teachersSnapshotReceived = false;
    let usersData: Record<string, unknown> | null = null;
    let teachersData: Record<string, unknown> | null = null;

    const updateProfile = () => {
      if (!active || (!usersSnapshotReceived && !teachersSnapshotReceived))
        return;
      const data = teachersData ?? usersData;
      setProfile(
        data
          ? ({
              ...defaultUserProfile(user),
              ...usersData,
              ...teachersData,
            } as UserProfile)
          : null,
      );
      setLoading(false);
    };
    const handleError = (reason: Error) => {
      if (!active) return;
      setError(reason.message || "Could not load your profile.");
      setLoading(false);
    };

    const unsubscribeUsers = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        usersSnapshotReceived = true;
        usersData = snapshot.exists()
          ? (snapshot.data() as Record<string, unknown>)
          : null;
        updateProfile();
      },
      handleError,
    );
    const unsubscribeTeachers = onSnapshot(
      doc(db, "teachers", user.uid),
      (snapshot) => {
        teachersSnapshotReceived = true;
        teachersData = snapshot.exists()
          ? (snapshot.data() as Record<string, unknown>)
          : null;
        updateProfile();
      },
      handleError,
    );

    return () => {
      active = false;
      unsubscribeUsers();
      unsubscribeTeachers();
    };
  }, [user]);
  const refresh = useCallback(async () => {
    if (user) await ensureUserProfile(user);
  }, [user]);
  const value = useMemo(
    () => ({ user, profile, loading, error, refresh }),
    [user, profile, loading, error, refresh],
  );
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}
export function useProfile() {
  const state = useContext(ProfileContext);
  if (!state) throw new Error("useProfile must be used within ProfileProvider");
  return state;
}
