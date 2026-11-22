/*
  File Path: src/components/AppButton.tsx
  File Description: Big brand button using the signature buttonShape, with optional image icon
*/
import { ActivityIndicator, Image, ImageSourcePropType, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import { buttonShape, colors, fonts, shadow, spacing } from "../theme/theme";

type Props = {
  label: string;
  onPress: () => void;
  color?: string;
  icon?: ImageSourcePropType;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function AppButton({ label, onPress, color = colors.primary, icon, loading, disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        buttonShape,
        shadow,
        { backgroundColor: color, opacity: disabled ? 0.5 : pressed ? 0.88 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <>
          {icon && <Image source={icon} style={styles.icon} resizeMode="contain" />}
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { minHeight: 88, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.md, paddingHorizontal: spacing.xl },
  icon: { width: 44, height: 44 },
  label: { color: colors.white, fontFamily: fonts.kaushan, fontSize: 26 },
});