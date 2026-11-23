/*
  File Path: src/app/_layout.tsx
  File Description: Root layout — registers fonts, hides the Android navigation/status bars (kiosk mode)
  and wraps the app in the visit state.
*/
import { DancingScript_700Bold } from "@expo-google-fonts/dancing-script";
import { KaushanScript_400Regular } from "@expo-google-fonts/kaushan-script";
import { Merriweather_400Regular, Merriweather_700Bold } from "@expo-google-fonts/merriweather";
import { Poppins_600SemiBold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from "@expo-google-fonts/roboto";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, Keyboard, Platform } from "react-native";
import { KioskProvider } from "../context/KioskContext";
import { VisitProvider } from "../context/VisitContext";

async function hideAndroidBars() {
  // (setBehaviorAsync was removed in newer expo-navigation-bar; swiping from the edge shows the bar briefly by default)
  if (Platform.OS !== "android") return;
  try { await NavigationBar.setVisibilityAsync("hidden"); } catch {}
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Roboto_400Regular, Roboto_500Medium, Roboto_700Bold,
    Merriweather_700Bold, Merriweather_400Regular,
    DancingScript_700Bold, KaushanScript_400Regular, Poppins_800ExtraBold, Poppins_600SemiBold,
  });

  // Hide the navigation bar now, and again whenever it comes back (app resumed, keyboard closed, edge swipe)
  useEffect(() => {
    hideAndroidBars();
    const app = AppState.addEventListener("change", (s) => s === "active" && hideAndroidBars());
    const kb = Keyboard.addListener("keyboardDidHide", hideAndroidBars);
    let vis: { remove: () => void } | undefined;
    try {
      if (Platform.OS === "android") {
        vis = NavigationBar.addVisibilityListener(({ visibility }) => {
          if (visibility === "visible") setTimeout(hideAndroidBars, 1500);
        });
      }
    } catch {}
    return () => { app.remove(); kb.remove(); vis?.remove(); };
  }, []);

  if (!loaded) return null;
  return (
    <KioskProvider>
      <VisitProvider>
        <StatusBar hidden />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }} />
      </VisitProvider>
    </KioskProvider>
  );
}