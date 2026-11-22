/*
  File Path: src/app/setup.tsx
  File Description: One-time kiosk set-up — scan the set-up QR code, open the mytslskiosk://setup link, or type the key.
  API call: GET /api/kiosk/config (to check the key) via saveSetup(); then the server address + key are saved.
*/
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import AppButton from "../components/AppButton";
import Screen from "../components/Screen";
import { useKiosk } from "../context/KioskContext";
import { parseSetupLink } from "../services/queueApi";
import { cardShape, colors, fonts, shadow, spacing } from "../theme/theme";

const safeDecode = (v: string) => { try { return decodeURIComponent(v); } catch { return v; } };

export default function Setup() {
  const router = useRouter();
  const params = useLocalSearchParams<{ server?: string; key?: string }>();
  const { credentials, isSetUp, setupMessage, saveSetup } = useKiosk();

  const [server, setServer] = useState(credentials?.server ?? "http://sdip.tsls.com.fj/");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [Cam, setCam] = useState<any>(null);
  const scanned = useRef(false);

  const connect = async (s: string, k: string) => {
    if (!s.trim() || !k.trim()) return setError("Enter the server address and the kiosk key.");
    setBusy(true);
    setError("");
    try {
      await saveSetup(s, k); // GET /api/kiosk/config
      router.replace("/");
    } catch (e: any) {
      setError(e?.message || "Could not connect. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  };

  // mytslskiosk://setup?server=...&key=... opens this screen with the values filled in
  useEffect(() => {
    if (params.server && params.key) {
      const s = safeDecode(String(params.server));
      const k = String(params.key);
      setServer(s);
      setKey(k);
      connect(s, k);
    }
  }, [params.server, params.key]);

  const startScan = async () => {
    setError("");
    try {
      const mod = require("expo-camera");
      const request = mod.Camera?.requestCameraPermissionsAsync ?? mod.CameraView?.requestCameraPermissionsAsync;
      const perm = await request();
      if (!perm.granted) return setError("Camera permission is needed to scan the QR code. You can type the key instead.");
      scanned.current = false;
      setCam(() => mod.CameraView);
      setScanning(true);
    } catch {
      setError("QR scanning isn't available in this build. Type the key instead.");
    }
  };

  const onScan = ({ data }: { data: string }) => {
    if (scanned.current) return;
    const p = parseSetupLink(data);
    if (!p) return setError("That QR code isn't a kiosk set-up code.");
    scanned.current = true;
    setScanning(false);
    setServer(p.server);
    setKey(p.key);
    connect(p.server, p.key);
  };

  return (
    <Screen back={isSetUp}>
      <View style={[styles.card, cardShape, shadow]}>
        <Text style={styles.title}>Kiosk set-up</Text>
        {!!setupMessage && <Text style={styles.notice}>{setupMessage}</Text>}

        {scanning && Cam ? (
          <>
            <View style={styles.cameraBox}>
              <Cam style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={onScan} />
            </View>
            <AppButton label="Cancel" color={colors.navy} onPress={() => setScanning(false)} style={styles.btn} />
          </>
        ) : (
          <>
            <Text style={styles.label}>Server address</Text>
            <TextInput value={server} onChangeText={setServer} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} />

            <Text style={styles.label}>Kiosk key</Text>
            <TextInput value={key} onChangeText={setKey} autoCapitalize="none" autoCorrect={false} placeholder="tslsk_..." placeholderTextColor={colors.muted} style={styles.input} />

            {!!error && <Text style={styles.error}>{error}</Text>}

            <AppButton label="Scan QR code" color={colors.primaryDark} onPress={startScan} disabled={busy} style={styles.btn} />
            <AppButton label="Connect" onPress={() => connect(server, key)} loading={busy} style={styles.btn} />
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, padding: spacing.xl },
  title: { fontFamily: fonts.kaushan, fontSize: 34, lineHeight: 46, color: colors.navy, textAlign: "center", marginBottom: spacing.sm },
  notice: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, textAlign: "center", marginBottom: spacing.md },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.muted, marginBottom: 2, marginTop: spacing.sm },
  input: { borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.subtle, borderRadius: 12, fontFamily: fonts.regular, fontSize: 16, padding: 12, color: colors.text },
  error: { fontFamily: fonts.medium, fontSize: 14, color: colors.danger, textAlign: "center", marginTop: spacing.md },
  btn: { minHeight: 60, marginTop: spacing.md },
  cameraBox: { height: 320, borderRadius: 16, overflow: "hidden", backgroundColor: "#000", marginTop: spacing.sm },
});