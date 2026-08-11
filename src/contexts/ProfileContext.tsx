import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "../../firebaseConfig";
import { defaultUserProfile, ensureUserProfile, UserProfile } from "../services/userProfile";

type ProfileState = { user: User | null; profile: UserProfile | null; loading: boolean; error: string | null; refresh: () => Promise<void> };
const ProfileContext = createContext<ProfileState | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => { setUser(nextUser); setProfile(null); setError(null); setLoading(Boolean(nextUser)); }), []);
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let unsubscribe = () => {};
    let active = true;
    ensureUserProfile(user).then(() => {
      if (!active) return;
      unsubscribe = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
        setProfile({ ...defaultUserProfile(user), ...(snapshot.data() ?? {}) } as UserProfile);
        setLoading(false);
      }, (reason) => { setError(reason.message || "Could not load your profile."); setLoading(false); });
    }).catch((reason) => { if (active) { setError(reason instanceof Error ? reason.message : "Could not load your profile."); setLoading(false); } });
    return () => { active = false; unsubscribe(); };
  }, [user]);
  const refresh = async () => { if (user) await ensureUserProfile(user); };
  const value = useMemo(() => ({ user, profile, loading, error, refresh }), [user, profile, loading, error]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
export function useProfile() { const state = useContext(ProfileContext); if (!state) throw new Error("useProfile must be used within ProfileProvider"); return state; }
