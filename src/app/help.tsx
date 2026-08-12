import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";

type HelpSectionProps = { title: string; items: string[] };

function HelpItem({ title, onPress }: { title: string; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.item, pressed && styles.itemPressed]} accessibilityRole="button" accessibilityLabel={title}>
    <Text style={styles.itemText}>{title}</Text><Feather name="chevron-right" size={20} color="#222" />
  </Pressable>;
}

function HelpSection({ title, items }: HelpSectionProps) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.items}>{items.map(item => <HelpItem key={item} title={item} />)}</View></View>;
}

export default function HelpScreen() {
  const router = useRouter(); const { width } = useWindowDimensions();
  const padding = Math.max(30, getHorizontalPadding(width)); const maxWidth = Math.min(600, width - padding * 2);
  return <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
    <View style={[styles.page, { paddingHorizontal: padding }]}>
      <View style={[styles.content, { maxWidth }]}>
        <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back to Settings"><Feather name="chevron-left" size={30} color="#111" /></Pressable><Text style={styles.title}>How can we help?</Text></View>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <HelpSection title="Frequently asked questions" items={["Downloading files", "Offline file access", "Report a problem"]} />
          <HelpSection title="Account" items={["Email", "Academic level", "Changing my subjects"]} />
          <HelpSection title="Using DigiLearn" items={["Video guide", "Finding teachers"]} />
        </ScrollView>
        <Pressable style={({ pressed }) => [styles.chatButton, pressed && styles.chatPressed]} accessibilityRole="button" accessibilityLabel="Chat with us">
          <Feather name="message-circle" size={20} color="#fff" fill="#fff" /><Text style={styles.chatText}>Chat with us</Text>
        </Pressable>
      </View>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.white},page:{flex:1,alignItems:"center"},content:{flex:1,width:"100%"},header:{height:68,flexDirection:"row",alignItems:"center"},backButton:{width:44,height:44,alignItems:"center",justifyContent:"center",marginLeft:-10,marginRight:4},title:{fontSize:30,fontWeight:"700",color:"#111"},scroll:{paddingTop:38,paddingBottom:spacing.xxl},section:{marginBottom:34},sectionTitle:{color:"#111",fontSize:21,fontWeight:"600",marginBottom:5},items:{width:"100%"},item:{minHeight:52,paddingVertical:12,flexDirection:"row",alignItems:"center",justifyContent:"space-between"},itemPressed:{opacity:.58},itemText:{color:"#111",fontSize:15,flexShrink:1,paddingRight:16},chatButton:{height:52,width:"100%",marginBottom:8,borderRadius:26,backgroundColor:"#FF646A",flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},chatPressed:{opacity:.78,transform:[{scale:.99}]},chatText:{color:"#fff",fontSize:16,fontWeight:"600"},
});
