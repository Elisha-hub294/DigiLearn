import { Feather } from "@expo/vector-icons";
import { deleteUser } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig";
import { getHorizontalPadding } from "../constants/layout";
import { colors } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";

type Field = "name" | "bio" | "level" | "school" | "gender";
type RowProps = { icon: React.ComponentProps<typeof Feather>["name"]; label: string; value?: string; onPress: () => void; about?: boolean };
const fieldLabels: Record<Field, string> = { name: "Name", bio: "About", level: "Level", school: "School", gender: "Gender" };

function ProfileSettingRow({ icon, label, value, onPress, about }: RowProps) {
  const hasValue = Boolean(value?.trim());
  const [expanded, setExpanded] = useState(false);
  return <View style={styles.row}>
    <View style={styles.iconArea}><Feather name={icon} size={23} color="#666" /></View>
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${hasValue ? "Edit" : "Set"} ${label}`}>
        <Text style={[styles.rowValue, !hasValue && styles.setAction]} numberOfLines={about && expanded ? undefined : 2}>
          {hasValue ? value : `Set ${label}`}
        </Text>
      </Pressable>
      {about && hasValue && !expanded && (value?.length ?? 0) > 95 ? <Pressable onPress={() => setExpanded(true)} accessibilityLabel="See all about text"><Text style={styles.seeMore}>...See more</Text></Pressable> : null}
    </View>
  </View>;
}

const friendlyError = (error: unknown) => {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
  if (code.includes("requires-recent-login")) return "For your security, please log in again before deleting your account.";
  if (code.includes("network")) return "Couldn't connect. Check your internet connection and try again.";
  if (code.includes("permission")) return "You don't have permission to update this profile.";
  return "We couldn't save your changes. Please try again.";
};

export default function MyProfileScreen() {
  const router = useRouter(); const { width } = useWindowDimensions();
  const { user, profile, loading } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false); const [field, setField] = useState<Field | null>(null);
  const [draft, setDraft] = useState(""); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const padding = getHorizontalPadding(width); const contentWidth = useMemo(() => Math.min(560, width - padding * 2), [width, padding]);
  const openEditor = (nextField: Field) => { setField(nextField); setDraft(String(profile?.[nextField] ?? "")); setError(""); };
  const save = async () => {
    if (!field || !user || saving) return;
    const value = draft.trim();
    if (field === "name" && !value) { setError("Please enter a value before continuing."); return; }
    try { setSaving(true); await updateDoc(doc(db, "users", user.uid), { [field]: value }); setField(null); }
    catch (reason) { Alert.alert("Update unavailable", friendlyError(reason)); }
    finally { setSaving(false); }
  };
  const confirmDelete = () => {
    setMenuOpen(false);
    Alert.alert("Delete account?", "This permanently deletes your account. This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete Account", style: "destructive", onPress: async () => { if (!auth.currentUser) return; try { await deleteUser(auth.currentUser); router.replace("/welcome" as never); } catch (reason) { Alert.alert("Account not deleted", friendlyError(reason)); } } },
    ]);
  };
  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <ScrollView contentContainerStyle={[styles.scroll, { paddingHorizontal: padding }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={[styles.container, { maxWidth: contentWidth }]}>
        <View style={styles.header}><Pressable onPress={() => router.push('/settings' as never)} style={styles.headerButton} accessibilityLabel="Go back to settings"><Feather name="chevron-left" size={30} color="#111" /></Pressable><Text style={styles.title}>My Profile</Text><Pressable onPress={() => setMenuOpen(v => !v)} style={styles.headerButton} accessibilityLabel="Profile actions"><Feather name="more-horizontal" size={25} color="#111" /></Pressable></View>
        {menuOpen ? <View style={styles.menu}><Pressable onPress={confirmDelete} style={styles.menuItem} accessibilityRole="button"><Text style={styles.deleteText}>Delete account</Text></Pressable></View> : null}
        {loading ? <View style={styles.loading}><View style={styles.avatarSkeleton}/><View style={styles.lineSkeleton}/><View style={styles.lineSkeleton}/></View> : !user ? <View style={styles.authPrompt}><Feather name="user" size={32} color={colors.primary}/><Text style={styles.authTitle}>Log in or Sign up</Text><Text style={styles.authCopy}>Sign in or create an account to manage your profile information.</Text><View style={styles.authActions}><Pressable onPress={() => router.push("/login" as never)} style={styles.login}><Text style={styles.loginText}>Log in</Text></Pressable><Pressable onPress={() => router.push("/signup" as never)} style={styles.signup}><Text style={styles.signupText}>Sign up</Text></Pressable></View></View> : <>
          <Image source={user.photoURL ? { uri: user.photoURL } : require("../../assets/images/user-default.png")} style={styles.avatar} resizeMode="cover" accessibilityLabel="Your profile picture" />
          <View style={styles.rows}>
            <ProfileSettingRow icon="user" label="Name" value={profile?.name} onPress={() => openEditor("name")} />
            <ProfileSettingRow icon="info" label="About" value={profile?.bio} onPress={() => openEditor("bio")} about />
            <ProfileSettingRow icon="award" label="Level" value={profile?.level} onPress={() => openEditor("level")} />
            <ProfileSettingRow icon="book-open" label="School" value={profile?.school} onPress={() => openEditor("school")} />
            <ProfileSettingRow icon="users" label="Gender" value={profile?.gender} onPress={() => openEditor("gender")} />
          </View>
        </>}
      </View>
    </ScrollView>
    <Modal visible={field !== null} transparent animationType="slide" onRequestClose={() => setField(null)}><KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === "ios" ? "padding" : undefined}><View style={styles.sheet}><View style={styles.sheetHandle}/><Text style={styles.sheetTitle}>Set {field ? fieldLabels[field] : ""}</Text>{field === "level" ? <View style={styles.choices}>{["Ordinary", "Advanced"].map(choice => <Pressable key={choice} onPress={() => setDraft(choice)} style={[styles.choice, draft === choice && styles.choiceSelected]}><Text style={[styles.choiceText, draft === choice && styles.choiceTextSelected]}>{choice}</Text></Pressable>)}</View> : <TextInput value={draft} onChangeText={setDraft} autoFocus placeholder={field === "bio" ? "Tell us about yourself..." : `Enter your ${field ?? "value"}`} placeholderTextColor="#9CA3AF" multiline={field === "bio"} style={[styles.input, field === "bio" && styles.bioInput]} accessibilityLabel={`Enter ${field ? fieldLabels[field] : "value"}`} />}{error ? <Text style={styles.validation}>{error}</Text> : null}<View style={styles.sheetActions}><Pressable onPress={() => setField(null)} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable onPress={save} disabled={saving} style={styles.confirm}>{saving ? <ActivityIndicator color="#fff"/> : <Text style={styles.confirmText}>Confirm</Text>}</Pressable></View></View></KeyboardAvoidingView></Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:"#fff"}, scroll:{paddingBottom:48}, container:{width:"100%",alignSelf:"center"}, header:{height:64,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}, headerButton:{width:44,height:44,alignItems:"center",justifyContent:"center"}, title:{fontSize:31,fontWeight:"700",color:"#111"}, menu:{position:"absolute",right:0,top:58,zIndex:2,backgroundColor:"#fff",borderRadius:12,shadowColor:"#000",shadowOpacity:.16,shadowRadius:12,shadowOffset:{width:0,height:5},elevation:5},menuItem:{minWidth:150,minHeight:44,justifyContent:"center",paddingHorizontal:16},deleteText:{color:"#FF3B30",fontWeight:"600"},avatar:{width:130,height:130,borderRadius:999,alignSelf:"center",marginTop:28,backgroundColor:"#EEF2F7"},rows:{marginTop:40,gap:30},row:{flexDirection:"row",minHeight:60},iconArea:{width:48,paddingTop:2,alignItems:"center"},rowContent:{flex:1},rowLabel:{fontSize:16,fontWeight:"600",color:"#111",marginBottom:5},rowValue:{fontSize:15,color:"#6B6B6B",lineHeight:21},setAction:{color:"#3B82F6",fontWeight:"600"},seeMore:{color:"#3B82F6",fontSize:14,fontWeight:"600",marginTop:3},loading:{alignItems:"center",gap:28,marginTop:28},avatarSkeleton:{width:130,height:130,borderRadius:999,backgroundColor:"#EDF2F8"},lineSkeleton:{height:54,width:"100%",borderRadius:8,backgroundColor:"#EDF2F8"},authPrompt:{paddingTop:86,alignItems:"center"},authTitle:{fontSize:22,fontWeight:"700",color:"#111",marginTop:14},authCopy:{fontSize:15,lineHeight:22,color:"#6B6B6B",textAlign:"center",marginTop:8,maxWidth:330},authActions:{flexDirection:"row",gap:12,marginTop:24},login:{minHeight:44,minWidth:96,alignItems:"center",justifyContent:"center",borderRadius:22,borderWidth:1,borderColor:"#3B82F6"},loginText:{color:"#3B82F6",fontWeight:"700"},signup:{minHeight:44,minWidth:96,alignItems:"center",justifyContent:"center",borderRadius:22,backgroundColor:"#3B82F6"},signupText:{color:"#fff",fontWeight:"700"},modalBackdrop:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,.35)"},sheet:{backgroundColor:"#fff",borderTopLeftRadius:24,borderTopRightRadius:24,padding:24,paddingBottom:34},sheetHandle:{width:40,height:4,borderRadius:2,backgroundColor:"#D1D5DB",alignSelf:"center",marginBottom:20},sheetTitle:{fontSize:22,fontWeight:"700",color:"#111",marginBottom:18},input:{borderWidth:1,borderColor:"#E5E5E5",borderRadius:12,minHeight:48,paddingHorizontal:14,color:"#111",fontSize:16},bioInput:{minHeight:110,paddingTop:13,textAlignVertical:"top"},choices:{gap:10},choice:{borderWidth:1,borderColor:"#E5E5E5",borderRadius:12,minHeight:48,justifyContent:"center",paddingHorizontal:14},choiceSelected:{borderColor:"#3B82F6",backgroundColor:"#EFF6FF"},choiceText:{color:"#111",fontSize:16},choiceTextSelected:{color:"#3B82F6",fontWeight:"700"},validation:{color:"#FF3B30",fontSize:13,marginTop:8},sheetActions:{flexDirection:"row",justifyContent:"flex-end",gap:10,marginTop:24},cancel:{minHeight:44,paddingHorizontal:18,justifyContent:"center",alignItems:"center"},cancelText:{color:"#6B6B6B",fontWeight:"600"},confirm:{minWidth:100,minHeight:44,borderRadius:22,backgroundColor:"#3B82F6",justifyContent:"center",alignItems:"center"},confirmText:{color:"#fff",fontWeight:"700"} });
