/*
  File Path: src/app/existing.tsx
  File Description: Existing student — enter TIN, look the student up, continue to reason selection
*/
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";
import Screen from "../components/Screen";
import { useVisit } from "../context/VisitContext";
import { findStudentByTIN } from "../services/students";
import { cardShape, colors, fonts, shadow, spacing } from "../theme/theme";

export default function ExistingStudent() {
  const router = useRouter();
  const { setVisitor } = useVisit();
  const [tin, setTin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (tin.trim().length < 5) return setError("Enter your TIN number.");
    setError("");
    setLoading(true);
    try {
      const s = await findStudentByTIN(tin);
      if (!s) return setError("We could not find that TIN. Check the number and try again, or use Guest.");
      setVisitor({ type: "student", ...s });
      router.push("/reason");
    } catch {
      setError("Something went wrong while looking up your TIN. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={[styles.card, cardShape, shadow]}>
        <Image source={require("../assets/images/mytsls-warclub-motif.png")} style={styles.warclubBg} resizeMode="contain" />
        <Text style={styles.title}>Enter your TIN</Text>
        <TextInput
          value={tin}
          onChangeText={(v) => setTin(v.replace(/\D/g, ""))}
          placeholder="TIN Number"
          placeholderTextColor={colors.muted}
          keyboardType="number-pad"
          maxLength={12}
          style={styles.input}
          onSubmitEditing={submit}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <AppButton label="Continue" onPress={submit} loading={loading} style={{ marginTop: spacing.lg }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, padding: spacing.xxl, alignItems: "stretch", overflow: "hidden" },
  warclubBg: { position: "absolute", top: "50%", left: "50%", width: 260, height: 260, marginTop: -130, marginLeft: -130, opacity: 0.45 },
  title: { fontFamily: fonts.kaushan, fontSize: 34, color: colors.navy, textAlign: "center", marginBottom: spacing.lg },
  input: {
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.subtle, borderRadius: 12,
    fontFamily: fonts.kaushan, fontSize: 24, letterSpacing: 2, textAlign: "center", paddingVertical: 16, color: colors.text,
  },
  error: { color: colors.danger, fontFamily: fonts.medium, marginTop: spacing.md, textAlign: "center" },
});