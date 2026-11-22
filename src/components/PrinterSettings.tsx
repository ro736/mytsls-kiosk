/*
  File Path: src/components/PrinterSettings.tsx
  File Description: Small printer button + popup. Saves the chosen printer so it is remembered (for testing).
*/
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { canPickPrinter, clearPrinter, getPrinter, pickPrinter, SavedPrinter, saveNetworkPrinter } from "../services/printer";
import { printTicket, sampleTicket } from "../services/ticket";
import { cardShape, colors, fonts, shadow, spacing } from "../theme/theme";
import AppButton from "./AppButton";

export default function PrinterSettings() {
  const [open, setOpen] = useState(false);
  const [printer, setPrinter] = useState<SavedPrinter | null>(null);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("9100");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMsg("");
    getPrinter().then((p) => {
      setPrinter(p);
      if (p?.type === "network") { setHost(p.host); setPort(String(p.port)); }
    });
  }, [open]);

  const choose = async () => {
    try {
      const p = await pickPrinter();
      if (p) setPrinter(p);
    } catch {
      setMsg("No printer was selected.");
    }
  };

  const saveNetwork = async () => {
    const h = host.trim();
    const n = parseInt(port, 10);
    if (!/^[\w.\-]+$/.test(h) || !n || n > 65535) return setMsg("Enter a valid printer IP address and port.");
    setPrinter(await saveNetworkPrinter(h, n));
    setMsg("Printer saved. It will be remembered.");
  };

  const forget = async () => {
    await clearPrinter();
    setPrinter(null);
    setMsg("");
  };

  const test = async () => {
    setBusy(true);
    setMsg("");
    try {
      await printTicket(sampleTicket());
      setMsg("Test ticket sent.");
    } catch (e: any) {
      setMsg(e?.message?.includes("development build") ? e.message : "Could not print. Check the printer and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.fab} hitSlop={10} accessibilityLabel="Printer setup">
        <Ionicons name="print" size={20} color={colors.primaryDark} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView contentContainerStyle={styles.overlay} keyboardShouldPersistTaps="handled">
            <View style={[styles.card, cardShape, shadow]}>
              <Text style={styles.title}>Printer setup</Text>
              <Text style={styles.hint}>For testing only</Text>

              <Text style={styles.current}>
                {printer ? `Saved: ${printer.name}` : "No printer saved"}
              </Text>

              {canPickPrinter ? (
                <AppButton label="Select printer" onPress={choose} style={styles.btn} />
              ) : (
                <>
                  <View style={styles.row}>
                    <View style={{ flex: 3 }}>
                      <Text style={styles.label}>Printer IP</Text>
                      <TextInput
                        value={host}
                        onChangeText={setHost}
                        placeholder="192.168.1.50"
                        placeholderTextColor={colors.muted}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="numbers-and-punctuation"
                        style={styles.input}
                      />
                    </View>
                    <View style={{ flex: 1.4 }}>
                      <Text style={styles.label}>Port</Text>
                      <TextInput
                        value={port}
                        onChangeText={(v) => setPort(v.replace(/\D/g, ""))}
                        keyboardType="number-pad"
                        maxLength={5}
                        style={styles.input}
                      />
                    </View>
                  </View>
                  <AppButton label="Save printer" onPress={saveNetwork} style={styles.btn} />
                </>
              )}

              <AppButton label="Test print" onPress={test} loading={busy} style={styles.btn} />
              {!!msg && <Text style={styles.msg}>{msg}</Text>}

              {printer && (
                <Pressable onPress={forget} hitSlop={8}>
                  <Text style={styles.link}>Forget saved printer</Text>
                </Pressable>
              )}
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <Text style={styles.link}>Close</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute", right: 14, bottom: 14, width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.8)",
    borderWidth: 1, borderColor: colors.border,
  },
  overlay: { flexGrow: 1, backgroundColor: "rgba(15,23,42,0.45)", alignItems: "center", justifyContent: "center", padding: spacing.xl },
  card: { width: "100%", maxWidth: 400, backgroundColor: colors.card, padding: spacing.xl, alignItems: "stretch" },
  title: { fontFamily: fonts.kaushan, fontSize: 30, lineHeight: 40, color: colors.navy, textAlign: "center" },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted, textAlign: "center", marginBottom: spacing.sm },
  current: { fontFamily: fonts.medium, fontSize: 13, color: colors.text, textAlign: "center", marginBottom: spacing.md },
  row: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted, marginBottom: 2 },
  input: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.subtle, borderRadius: 10, fontFamily: fonts.regular, fontSize: 16, paddingVertical: 8, paddingHorizontal: 10, color: colors.text },
  btn: { minHeight: 56, marginBottom: spacing.md },
  link: { fontFamily: fonts.medium, fontSize: 14, color: colors.primaryDark, textAlign: "center", marginTop: spacing.xs, padding: spacing.xs },
  msg: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, textAlign: "center", marginBottom: spacing.sm },
});