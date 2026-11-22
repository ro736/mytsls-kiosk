/*
  File Path: src/components/Screen.tsx
  File Description: Shared page frame — leaf/masi background, optional back button, keyboard handling
*/
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ImageBackground, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, spacing } from "../theme/theme";

export default function Screen({ children, back = true, top = false }: { children: React.ReactNode; back?: boolean; top?: boolean }) {
  const router = useRouter();
  const [keyboardUp, setKeyboardUp] = useState(false);

  // When the keyboard opens, lift the content to the top so the card stays visible while typing
  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(showEvt, () => setKeyboardUp(true));
    const b = Keyboard.addListener(hideEvt, () => setKeyboardUp(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  return (
    <ImageBackground
      source={require("../assets/images/module-background.png")}
      resizeMode="cover"
      style={styles.bg}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {back && (
            <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
              <Ionicons name="chevron-back" size={22} color={colors.primaryDark} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          )}
          <ScrollView contentContainerStyle={[styles.scroll, (top || keyboardUp) && { justifyContent: "flex-start", paddingTop: spacing.md }]} keyboardShouldPersistTaps="handled">
            <View style={styles.inner}>{children}</View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.xl, justifyContent: "center" },
  inner: { width: "100%", maxWidth: 720, alignSelf: "center" },
  back: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  backText: { fontFamily: fonts.medium, color: colors.primaryDark, fontSize: 16 },
});