/*
  File Path: src/theme/theme.ts
  File Description: myTSLS Mobile — colours, fonts and the signature shapes, matching the web portal
*/
 
import type { ViewStyle } from "react-native";
 
export const colors = {
  // Brand (same tokens as the web)
  primary: "#2e9696",
  primaryDark: "#1f6f6f",
  primarySoft: "#e6f3f3",
  secondary: "#f28c7d",
  brown: "#c39f65",
  // Student portal palette
  navy: "#1F3A5F",
  maroon: "#8F1D36",
 
  // Neutrals
  background: "#f7f9fb",
  card: "#ffffff",
  text: "#1e293b",
  muted: "#64748b",
  border: "#e2e8f0",
  subtle: "#f1f5f9",
  white: "#ffffff",
 
  // States
  success: "#059669",
  successSoft: "#d1fae5",
  warning: "#d97706",
  warningSoft: "#fef3c7",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
  info: "#0284c7",
  infoSoft: "#e0f2fe",
} as const;
 
/** Font family names, registered in src/app/_layout.tsx. */
export const fonts = {
  regular: "Roboto_400Regular",
  medium: "Roboto_500Medium",
  bold: "Roboto_700Bold",
  heading: "Merriweather_700Bold",
  headingRegular: "Merriweather_400Regular",
  dancing: "DancingScript_700Bold",
  kaushan: "KaushanScript_400Regular",
  display: "Poppins_800ExtraBold",
  displaySemi: "Poppins_600SemiBold",
} as const;
 
/** The web's CARD_SHAPE: rounded-tl-[30px] rounded-tr-[8px] rounded-br-[30px] rounded-bl-[8px]. */
export const cardShape: ViewStyle = {
  borderTopLeftRadius: 30,
  borderTopRightRadius: 8,
  borderBottomRightRadius: 30,
  borderBottomLeftRadius: 8,
};
 
/** The web's PILL_SHAPE: rounded-tl-[20px] rounded-tr-[5px] rounded-br-[20px] rounded-bl-[5px]. */
export const pillShape: ViewStyle = {
  borderTopLeftRadius: 20,
  borderTopRightRadius: 5,
  borderBottomRightRadius: 20,
  borderBottomLeftRadius: 5,
};
 
/** Buttons: 30px top-left and bottom-right, 5px on the other two corners. */
export const buttonShape: ViewStyle = {
  borderTopLeftRadius: 30,
  borderTopRightRadius: 5,
  borderBottomRightRadius: 30,
  borderBottomLeftRadius: 5,
};
 
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
 
export const shadow: ViewStyle = {
  shadowColor: "#0f172a",
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};