/*
  File Path: src/components/PrintingTicket.tsx
  File Description: Animated printer — the ticket prints out of a slot, then is torn off. Tap the printer to replay.
  Children are the ticket's contents.
*/
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { colors, shadow } from "../theme/theme";

const TICKET_W = 264;
const TEETH = Math.floor(TICKET_W / 14);
const PRINT_STEPS = 14;
const EXTRA = 44; // room below the slot for the torn ticket to drop into

export default function PrintingTicket({ children }: { children: React.ReactNode }) {
  const [h, setH] = useState(0);
  const y = useRef(new Animated.Value(0)).current;
  const tx = useRef(new Animated.Value(0)).current;
  const rot = useRef(new Animated.Value(0)).current;
  const stub = useRef(new Animated.Value(0)).current;
  const jitter = useRef(new Animated.Value(0)).current;
  const led = useRef(new Animated.Value(1)).current;
  const running = useRef<Animated.CompositeAnimation | null>(null);
  const loops = useRef<Animated.CompositeAnimation[]>([]);

  const play = () => {
    if (!h) return;
    running.current?.stop();
    loops.current.forEach((l) => l.stop());
    y.setValue(-h); tx.setValue(0); rot.setValue(0); stub.setValue(0); jitter.setValue(0); led.setValue(1);

    // Printer shakes and the light blinks while printing
    const shake = Animated.loop(Animated.sequence([
      Animated.timing(jitter, { toValue: 1.2, duration: 45, useNativeDriver: true }),
      Animated.timing(jitter, { toValue: -1.2, duration: 45, useNativeDriver: true }),
    ]));
    const blink = Animated.loop(Animated.sequence([
      Animated.timing(led, { toValue: 0.2, duration: 220, useNativeDriver: true }),
      Animated.timing(led, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]));
    loops.current = [shake, blink];

    // Paper feeds out in short bursts, like a thermal printer
    const feed: Animated.CompositeAnimation[] = [];
    for (let i = 1; i <= PRINT_STEPS; i++) {
      feed.push(
        Animated.timing(y, { toValue: -h + (h * i) / PRINT_STEPS, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.delay(45),
      );
    }

    const seq = Animated.sequence([
      Animated.delay(500),
      Animated.parallel([Animated.sequence(feed), Animated.delay(PRINT_STEPS * 175)]),
      Animated.delay(250),
      // stop shaking, light goes solid
      Animated.parallel([
        Animated.timing(jitter, { toValue: 0, duration: 60, useNativeDriver: true }),
        Animated.timing(led, { toValue: 1, duration: 60, useNativeDriver: true }),
      ]),
      Animated.delay(500),
      // the tug before the tear
      Animated.sequence([
        Animated.timing(tx, { toValue: -4, duration: 70, useNativeDriver: true }),
        Animated.timing(tx, { toValue: 4, duration: 70, useNativeDriver: true }),
        Animated.timing(tx, { toValue: -3, duration: 60, useNativeDriver: true }),
      ]),
      // rip: the ticket jerks down and away, a paper stub stays in the slot
      Animated.parallel([
        Animated.timing(y, { toValue: 30, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(rot, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(tx, { toValue: 12, duration: 240, useNativeDriver: true }),
        Animated.timing(stub, { toValue: 1, duration: 40, useNativeDriver: true }),
      ]),
      Animated.timing(y, { toValue: 24, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]);

    running.current = seq;
    loops.current.forEach((l) => l.start());
    seq.start(() => loops.current.forEach((l) => l.stop()));
  };

  useEffect(() => {
    play();
    return () => {
      running.current?.stop();
      loops.current.forEach((l) => l.stop());
    };
  }, [h]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "5deg"] });

  return (
    <Pressable onPress={play} style={styles.wrap}>
      {/* Printer body */}
      <Animated.View style={[styles.printer, shadow, { transform: [{ translateX: jitter }] }]}>
        <View style={styles.printerTop}>
          <Animated.View style={[styles.led, { opacity: led }]} />
          <View style={styles.vent} />
          <View style={styles.vent} />
          <View style={styles.vent} />
        </View>
        <View style={styles.slot} />
      </Animated.View>

      {/* Window the paper comes out of */}
      <View style={[styles.stage, { height: h + EXTRA }]}>
        <Animated.View
          onLayout={(e) => { const nh = Math.round(e.nativeEvent.layout.height); if (nh !== h) setH(nh); }}
          style={[styles.paperWrap, { opacity: h ? 1 : 0, transform: [{ translateY: y }, { translateX: tx }, { rotate }] }]}
        >
          <View style={styles.teeth} pointerEvents="none">
            {Array.from({ length: TEETH }).map((_, i) => (
              <View key={i} style={[styles.tooth, { left: i * 14 + 2 }]} />
            ))}
          </View>
          <View style={[styles.paper, shadow]}>{children}</View>
        </Animated.View>

        {/* Little piece of paper left behind in the slot after the tear */}
        <Animated.View style={[styles.stub, { opacity: stub }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { width: TICKET_W + 50, alignItems: "center" },
  printer: { width: TICKET_W + 50, backgroundColor: "#334155", borderRadius: 16, paddingTop: 12, paddingBottom: 10, zIndex: 3 },
  printerTop: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 8, marginBottom: 12 },
  led: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#22c55e", marginRight: 6 },
  vent: { width: 26, height: 5, borderRadius: 3, backgroundColor: "#1e293b" },
  slot: { alignSelf: "center", width: TICKET_W + 14, height: 9, borderRadius: 5, backgroundColor: "#0f172a" },
  stage: { width: TICKET_W + 50, marginTop: -4, overflow: "hidden", alignItems: "center", zIndex: 1 },
  paperWrap: { position: "absolute", top: 0, width: TICKET_W },
  paper: { width: TICKET_W, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 14 },
  teeth: { position: "absolute", top: -6, left: 0, right: 0, height: 10, zIndex: 2 },
  tooth: { position: "absolute", top: 0, width: 10, height: 10, backgroundColor: colors.card, transform: [{ rotate: "45deg" }] },
  stub: { position: "absolute", top: 0, width: TICKET_W - 40, height: 8, backgroundColor: colors.card, borderBottomWidth: 2, borderStyle: "dashed", borderColor: colors.border },
});