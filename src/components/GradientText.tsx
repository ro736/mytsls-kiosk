/*
  File Path: src/components/GradientText.tsx
  File Description: Text filled with a left-to-right colour gradient (native via MaskedView, web via CSS background-clip)
*/
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Platform, StyleProp, Text, TextStyle } from "react-native";

// MaskedView is a class component whose typings clash with newer @types/react (TS2607), so cast it.
const Masked = MaskedView as unknown as React.ComponentType<any>;

type Props = {
  children: string;
  colors: readonly [string, string, ...string[]];
  style?: StyleProp<TextStyle>;
};

export default function GradientText({ children, colors, style }: Props) {
  if (Platform.OS === "web") {
    const flat = (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style) as TextStyle;
    return React.createElement(
      "span",
      {
        style: {
          display: "block",
          textAlign: flat?.textAlign ?? "center",
          fontFamily: flat?.fontFamily,
          fontSize: flat?.fontSize,
          lineHeight: flat?.lineHeight ? `${flat.lineHeight}px` : undefined,
          marginTop: flat?.marginTop,
          backgroundImage: `linear-gradient(90deg, ${colors.join(", ")})`,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        },
      },
      children,
    );
  }

  return (
    <Masked
      style={{ alignSelf: "center", marginTop: (StyleSheetFlat(style).marginTop as number) ?? 0 }}
      maskElement={<Text style={[style, { marginTop: 0, backgroundColor: "transparent" }]}>{children}</Text>}
    >
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
        <Text style={[style, { marginTop: 0, opacity: 0 }]}>{children}</Text>
      </LinearGradient>
    </Masked>
  );
}

function StyleSheetFlat(style: StyleProp<TextStyle>): TextStyle {
  return (Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style || {}) as TextStyle;
}