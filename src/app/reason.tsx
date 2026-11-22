/*
  File Path: src/app/reason.tsx
  File Description: Reason for visiting — tiles come from config.categories.
  API: POST /api/kiosk/tickets when a tile is tapped (issueTicket). The server returns the ticket number.
*/
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import Screen from "../components/Screen";
import Toast from "../components/Toast";
import { useKiosk } from "../context/KioskContext";
import { useVisit } from "../context/VisitContext";
import { useIdle } from "../hooks/useIdle";
import { ApiError, Category, issueTicket } from "../services/queueApi";
import { colors, fonts, pillShape, shadow, spacing } from "../theme/theme";

function waitText(c: Category) {
  if (c.waiting <= 0 && c.estimatedWaitMinutes <= 0) return "No wait";
  const parts = [`${c.waiting} waiting`];
  if (c.estimatedWaitMinutes > 0) parts.push(`about ${c.estimatedWaitMinutes} min`);
  return parts.join(" · ");
}

export default function Reason() {
  const router = useRouter();
  const { visitor, setTicket } = useVisit();
  const { config, credentials, markNotSetUp } = useKiosk();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [priority, setPriority] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const shake = useRef(new Animated.Value(0)).current;
  const idle = useIdle(90000, () => router.replace("/"));

  if (!visitor) {
    router.replace("/");
    return null;
  }

  const doShake = () =>
    Animated.sequence([10, -10, 8, -8, 0].map((v) => Animated.timing(shake, { toValue: v, duration: 50, useNativeDriver: true }))).start();

  const choose = async (c: Category) => {
    if (busyId !== null || !credentials) return; // one ticket at a time, so a double tap can't create two
    setBusyId(c.id);
    setToast(null);
    try {
      const ticket = await issueTicket(credentials, {
        categoryId: c.id,
        name: visitor.name,
        contact: visitor.contact,
        email: visitor.email || null,
        tin: visitor.tin || null,
        isPriority: priority,
      });
      setTicket(ticket);
      router.replace("/ticket");
    } catch (e) {
      const err = e as ApiError;
      if (err.notSetUp) {
        markNotSetUp(err.message); // 401 / 404: back to set-up
        router.replace("/setup");
        return;
      }
      setToast(err.message || "Something went wrong. Please try again.");
      if (err.status === 400) doShake();
    } finally {
      setBusyId(null);
    }
  };

  const busy = busyId !== null;

  return (
    <View style={{ flex: 1 }} {...idle}>
      <Screen>
        <Image source={require("../assets/images/module-turtle.png")} style={styles.turtle} resizeMode="contain" />
        <Text style={styles.hello}>Bula, {visitor.name}</Text>
        <Text style={styles.sub}>Please select your reason for visiting</Text>

        {!config || config.categories.length === 0 ? (
          <Text style={styles.empty}>Can't reach the queue system—please see the front desk.</Text>
        ) : (
          <Animated.View style={[styles.grid, { transform: [{ translateX: shake }] }]}>
            {config.categories.map((c) => {
              const icon = (c.icon in Ionicons.glyphMap ? c.icon : "help-circle") as keyof typeof Ionicons.glyphMap;
              return (
                <Pressable
                  key={c.id}
                  disabled={busy}
                  onPress={() => choose(c)}
                  style={({ pressed }) => [styles.tile, pillShape, shadow, { backgroundColor: c.color || colors.primary, opacity: busy && busyId !== c.id ? 0.5 : pressed ? 0.88 : 1 }]}
                >
                  <Image source={require("../assets/images/round-masi.png")} style={styles.masi} resizeMode="contain" />
                  {busyId === c.id ? <ActivityIndicator color={colors.white} size="large" /> : <Ionicons name={icon} size={38} color={colors.white} />}
                  <Text style={styles.tileText}>{c.name}</Text>
                  <Text style={styles.wait}>{waitText(c)}</Text>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        <Pressable disabled={busy} onPress={() => setPriority((p) => !p)} style={styles.priority}>
          <View style={[styles.box, priority && styles.boxOn]}>
            {priority && <Ionicons name="checkmark" size={18} color={colors.white} />}
          </View>
          <Text style={styles.priorityText}>
            I need priority assistance <Text style={styles.priorityHint}>(elderly, disability, pregnancy)</Text>
          </Text>
        </Pressable>
      </Screen>
      <Toast message={toast} onHide={() => setToast(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  turtle: { width: 140, height: 90, alignSelf: "center", marginBottom: spacing.md },
  hello: { fontFamily: fonts.heading, fontSize: 28, color: colors.navy, textAlign: "center" },
  sub: { fontFamily: fonts.regular, fontSize: 17, color: colors.muted, textAlign: "center", marginTop: spacing.sm, marginBottom: spacing.xl },
  empty: { fontFamily: fonts.medium, fontSize: 16, color: colors.danger, textAlign: "center", marginVertical: spacing.xl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg, justifyContent: "center" },
  tile: { width: "47%", minHeight: 150, overflow: "hidden", alignItems: "center", justifyContent: "center", gap: spacing.xs, padding: spacing.lg },
  tileText: { color: colors.white, fontFamily: fonts.kaushan, fontSize: 22, lineHeight: 30, textAlign: "center" },
  wait: { color: "rgba(255,255,255,0.9)", fontFamily: fonts.regular, fontSize: 13, textAlign: "center" },
  masi: { position: "absolute", top: -34, left: -34, width: 110, height: 110, opacity: 0.3 },
  priority: { flexDirection: "row", alignItems: "center", alignSelf: "center", gap: spacing.md, marginTop: spacing.xl, backgroundColor: "rgba(255,255,255,0.85)", paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: 14 },
  box: { width: 28, height: 28, borderRadius: 7, borderWidth: 2, borderColor: colors.muted, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  priorityText: { fontFamily: fonts.regular, fontSize: 16, color: colors.text, flexShrink: 1 },
  priorityHint: { color: colors.muted },
});