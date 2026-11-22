// /*
//   File Path: src/app/index.tsx
//   File Description: Dashboard — logo pinned to the top, Existing Student and Guest cards side by side.
//   Self-contained: does not depend on the shared Screen component.
// */
// import { useRouter } from "expo-router";
// import { useEffect } from "react";
// import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
// import { SafeAreaView } from "react-native-safe-area-context";
// import GradientText from "../components/GradientText";
// import PrinterSettings from "../components/PrinterSettings";
// import { useVisit } from "../context/VisitContext";
// import { cardShape, colors, fonts, shadow, spacing } from "../theme/theme";

// const DAVUI = require("../assets/images/mytsls-davui-motif.png");

// function ChoiceCard({ title, text, color, onPress }: { title: string; text: string; color: string; onPress: () => void }) {
//   return (
//     <Pressable
//       onPress={onPress}
//       style={({ pressed }) => [styles.card, cardShape, shadow, { backgroundColor: color, opacity: pressed ? 0.9 : 1 }]}
//     >
//       <Image source={DAVUI} style={styles.davuiBg} resizeMode="contain" />
//       <Text style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.6}>{title}</Text>
//       <Text style={styles.cardText}>{text}</Text>
//     </Pressable>
//   );
// }

// export default function Dashboard() {
//   const router = useRouter();
//   const { reset } = useVisit();
//   useEffect(() => reset(), []); // every new visitor starts clean

//   return (
//     <ImageBackground source={require("../assets/images/module-background.png")} resizeMode="cover" style={styles.bg}>
//       <SafeAreaView style={styles.flex} edges={["left", "right"]}>
//         <ScrollView contentContainerStyle={styles.scroll}>
//           <View style={styles.inner}>
//             {/* Logo image has built-in white margins, so it is cropped to sit at the very top */}
//             <View style={styles.logoCrop}>
//               <Image source={require("../assets/images/sidebar-logo.webp")} style={styles.logo} resizeMode="contain" />
//             </View>

//             <GradientText colors={[colors.primary, colors.secondary]} style={styles.title}>Bula, Welcome to TSLS</GradientText>
//             <Text style={styles.sub}>Choose an option to get your queue ticket.</Text>

//             <View style={styles.row}>
//               <ChoiceCard title="Existing Students" text="Sign in with your TIN" color={colors.primary} onPress={() => router.push("/existing")} />
//               <ChoiceCard title="Guest" text="Enter your details" color={colors.primary} onPress={() => router.push("/guest")} />
//             </View>
//           </View>
//         </ScrollView>
//       </SafeAreaView>
//       <PrinterSettings />
//     </ImageBackground>
//   );
// }

// const styles = StyleSheet.create({
//   flex: { flex: 1 },
//   bg: { flex: 1, backgroundColor: colors.background },
//   scroll: { flexGrow: 1, justifyContent: "flex-start", paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
//   inner: { width: "100%", maxWidth: 720, alignSelf: "center" },
//   logoCrop: { height: 205, overflow: "hidden", alignItems: "center", alignSelf: "center", width: 300, left: 40 },
//   logo: { width: 300, height: 262, marginTop: -23 },
//   title: { fontFamily: fonts.heading, fontSize: 28, color: colors.navy, textAlign: "center", marginTop: spacing.sm },
//   sub: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xxl },
//   row: { flexDirection: "row", gap: spacing.lg },
//   card: { flex: 1, minHeight: 320, paddingVertical: spacing.xl, paddingHorizontal: spacing.md, alignItems: "center", justifyContent: "center", overflow: "hidden" },
//   davuiBg: { position: "absolute", right: -64, bottom: -64, width: 280, height: 280, opacity: 0.22 },
//   cardTitle: { color: colors.white, fontFamily: fonts.kaushan, fontSize: 46, lineHeight: 60, textAlign: "center" },
//   cardText: { color: "rgba(255,255,255,0.85)", fontFamily: fonts.regular, fontSize: 16, textAlign: "center", marginTop: spacing.md },
// });

/*
  File Path: src/app/index.tsx
  File Description: Home screen — details form. Uses the kiosk config (branch label) and sends an unconfigured tablet to /setup.
  API: reads config from KioskContext (GET /api/kiosk/config runs at start-up and every 60 s).
*/
import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ImageBackground, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GradientText from "../components/GradientText";
import GuestForm from "../components/GuestForm";
import PrinterSettings from "../components/PrinterSettings";
import { useKiosk } from "../context/KioskContext";
import { useVisit } from "../context/VisitContext";
import { useIdle } from "../hooks/useIdle";
import { colors, fonts, spacing } from "../theme/theme";

export default function Home() {
  const { reset } = useVisit();
  const { loading, isSetUp, config } = useKiosk();
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => reset(), []); // every new customer starts clean

  // A half-filled form is cleared after about 90 seconds without a touch
  const idle = useIdle(90000, () => { Keyboard.dismiss(); setFormKey((k) => k + 1); });

  // When the keyboard opens, hide the logo and title so the card moves up and stays visible
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(showEvt, () => setKeyboardUp(true));
    const b = Keyboard.addListener(hideEvt, () => setKeyboardUp(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  if (loading) return null;
  if (!isSetUp) return <Redirect href="/setup" />;

  return (
    <ImageBackground source={require("../assets/images/module-background.png")} resizeMode="cover" style={styles.bg}>
      <View style={styles.flex} {...idle}>
        <SafeAreaView style={styles.flex} edges={["left", "right"]}>
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={styles.inner}>
                {!keyboardUp && (
                  <>
                    {/* Logo image has built-in white margins, so it is cropped to sit at the very top */}
                    <View style={styles.logoCrop}>
                      <Image source={require("../assets/images/sidebar-logo.webp")} style={styles.logo} resizeMode="contain" />
                    </View>
                    <GradientText colors={[colors.primary, colors.secondary]} style={styles.title}>Bula, Welcome to TSLS</GradientText>
                    <Text style={styles.sub}>Enter your details to get your queue ticket.</Text>
                  </>
                )}
                <View style={keyboardUp && { marginTop: spacing.lg }}>
                  <GuestForm key={formKey} />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      {!!config && !keyboardUp && (
        <View style={styles.branch} pointerEvents="none">
          <Text style={styles.branchText}>{config.branch.name}</Text>
        </View>
      )}
      <PrinterSettings />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bg: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: "flex-start", paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  inner: { width: "100%", maxWidth: 680, alignSelf: "center" },
  logoCrop: { height: 205, overflow: "hidden", alignItems: "center", alignSelf: "center", width: 300, left: 40 },
  logo: { width: 300, height: 262, marginTop: -23 },
  title: { fontFamily: fonts.heading, fontSize: 28, color: colors.navy, textAlign: "center", marginTop: spacing.sm },
  sub: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  branch: { position: "absolute", top: 12, right: 14, backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 14, paddingVertical: 4, paddingHorizontal: 12 },
  branchText: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
});