/*
  File Path: src/app/guest.tsx
  File Description: Guest form — TIN (optional) + Full name, Contact + Email (optional)
*/
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";
import Screen from "../components/Screen";
import { useVisit } from "../context/VisitContext";
import { cardShape, colors, fonts, shadow, spacing } from "../theme/theme";

// RN's TextInput class type and its ref instance type differ in newer typings, so derive the instance type
type InputRef = React.ComponentRef<typeof TextInput>;
type Form = { tin: string; name: string; contact: string; email: string };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Guest() {
  const router = useRouter();
  const { setVisitor } = useVisit();
  const [f, setF] = useState<Form>({ tin: "", name: "", contact: "", email: "" });
  const [errors, setErrors] = useState<Partial<Form>>({});
  const refs = { name: useRef<InputRef>(null), contact: useRef<InputRef>(null), email: useRef<InputRef>(null) };

  const set = (k: keyof Form) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  const submit = () => {
    const e: Partial<Form> = {};
    // TIN and email are optional, but must be valid when filled in
    if (f.tin.trim() && f.tin.trim().length < 5) e.tin = "TIN is too short";
    if (f.name.trim().length < 2) e.name = "Enter your full name";
    if (f.contact.trim().length < 7) e.contact = "Enter a valid contact number";
    if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = "Enter a valid email address";
    setErrors(e);
    if (Object.keys(e).length) return;
    setVisitor({ type: "guest", tin: f.tin.trim(), name: f.name.trim(), contact: f.contact.trim(), email: f.email.trim() });
    router.push("/reason");
  };

  const field = (
    k: keyof Form, label: string, optional: boolean, props: React.ComponentProps<typeof TextInput>,
    ref?: React.RefObject<InputRef | null>, next?: React.RefObject<InputRef | null>,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={styles.optional}>  (optional)</Text>}
      </Text>
      <TextInput
        ref={ref}
        value={f[k]}
        onChangeText={set(k)}
        placeholderTextColor={colors.muted}
        style={[styles.input, errors[k] && { borderColor: colors.danger }]}
        returnKeyType={next ? "next" : "done"}
        onSubmitEditing={() => (next ? next.current?.focus() : submit())}
        {...props}
      />
      {!!errors[k] && <Text style={styles.error}>{errors[k]}</Text>}
    </View>
  );

  return (
    <Screen>
      <View style={[styles.card, cardShape, shadow]}>
        <Text style={styles.title}>Guest details</Text>

        <View style={styles.row}>
          {field("tin", "TIN", true, { keyboardType: "number-pad", maxLength: 12, onChangeText: (v) => set("tin")(v.replace(/\D/g, "")) }, undefined, refs.name)}
          {field("name", "Full Name", false, { autoCapitalize: "words" }, refs.name, refs.contact)}
        </View>

        <View style={styles.row}>
          {field("contact", "Contact Number", false, { keyboardType: "phone-pad" }, refs.contact, refs.email)}
          {field("email", "Email", true, { keyboardType: "email-address", autoCapitalize: "none" }, refs.email)}
        </View>

        <AppButton label="Continue" onPress={submit} style={{ minHeight: 68, marginTop: spacing.sm }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, paddingVertical: spacing.xl, paddingHorizontal: spacing.xl },
  title: { fontFamily: fonts.kaushan, fontSize: 34, lineHeight: 46, color: colors.navy, textAlign: "center", marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.md },
  field: { flex: 1, marginBottom: spacing.md },
  label: { fontFamily: fonts.kaushan, color: colors.text, marginBottom: spacing.xs, fontSize: 17 },
  optional: { fontFamily: fonts.regular, fontSize: 11, color: colors.muted },
  input: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.subtle, borderRadius: 12, fontFamily: fonts.kaushan, fontSize: 17, paddingVertical: 10, paddingHorizontal: 12, color: colors.text },
  error: { color: colors.danger, fontFamily: fonts.regular, fontSize: 12, marginTop: spacing.xs },
});