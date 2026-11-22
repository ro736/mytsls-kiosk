/*
  File Path: src/components/Toast.tsx
  File Description: Short message pop-up (droplet-shaped corners) for server messages
*/
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { buttonShape, colors, fonts, shadow, spacing } from "../theme/theme";

export default function Toast({ message, onHide, tone = "error" }: { message: string | null; onHide: () => void; tone?: "error" | "info" }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const t = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => onHide());
    }, 5000);
    return () => clearTimeout(t);
  }, [message]);

  if (!message) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast, buttonShape, shadow,
        { backgroundColor: tone === "error" ? colors.danger : colors.navy, opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: { position: "absolute", top: 28, alignSelf: "center", maxWidth: 560, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, zIndex: 50 },
  text: { color: colors.white, fontFamily: fonts.medium, fontSize: 16, textAlign: "center" },
});