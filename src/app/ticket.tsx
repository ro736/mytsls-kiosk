/*
  File Path: src/app/ticket.tsx
  File Description: "Please take your ticket" — shows the number the server issued and prints the receipt.
  No API call here: the ticket came from POST /api/kiosk/tickets on the reason screen. Printing uses config.printer.
*/
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import AppButton from "../components/AppButton";
import PrintingTicket from "../components/PrintingTicket";
import Screen from "../components/Screen";
import { useKiosk } from "../context/KioskContext";
import { useVisit } from "../context/VisitContext";
import { printIssuedTicket } from "../services/ticket";
import { colors, fonts, spacing } from "../theme/theme";

const RESET_SECONDS = 45;

function Cell({ k, v, full }: { k: string; v: string; full?: boolean }) {
  return (
    <View style={[styles.cell, full && { width: "100%" }]}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v} numberOfLines={1}>{v}</Text>
    </View>
  );
}

export default function Ticket() {
  const router = useRouter();
  const { ticket, reset } = useVisit();
  const { config } = useKiosk();
  const [left, setLeft] = useState(RESET_SECONDS);
  const [printMsg, setPrintMsg] = useState("");
  const printed = useRef(false);

  const finish = () => { reset(); router.replace("/"); };

  // Back to the details screen after about 45 seconds
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { if (left <= 0) finish(); }, [left]);

  // Print once. A failed print must not undo the ticket, so just tell the customer to see the front desk.
  useEffect(() => {
    if (!ticket || !config || printed.current) return;
    printed.current = true;
    printIssuedTicket(ticket, config).catch(() =>
      setPrintMsg("We couldn't print your ticket. Please remember your number and see the front desk."),
    );
  }, []);

  if (!ticket) {
    router.replace("/");
    return null;
  }

  const ahead =
    ticket.peopleAhead === 0
      ? "You're next!"
      : `${ticket.peopleAhead} ${ticket.peopleAhead === 1 ? "person" : "people"} ahead of you` +
        (ticket.estimatedWaitMinutes > 0 ? ` · about ${ticket.estimatedWaitMinutes} min` : "");

  return (
    <Screen back={false}>
      <View style={styles.layout}>
        {/* Message */}
        <View style={styles.message}>
          <Image source={require("../assets/images/mytsls-mascot.webp")} style={styles.mascot} resizeMode="contain" />
          <Text style={styles.take}>Please take your ticket</Text>
          <Text style={styles.wait}>Wait for your number to be called. Vinaka!</Text>
          <Text style={styles.ahead}>{ahead}</Text>
          {!!printMsg && <Text style={styles.printMsg}>{printMsg}</Text>}
          <AppButton label="Done" color={colors.primary} onPress={finish} style={{ minHeight: 64, marginTop: spacing.lg, alignSelf: "stretch" }} />
          <Text style={styles.reset}>This screen resets in {Math.max(left, 0)}s</Text>
        </View>

        {/* Receipt */}
        <PrintingTicket>
          <Text style={styles.org}>Tertiary Scholarships & Loans Service</Text>
          <Text style={styles.tag}>Empowering Fiji's Future</Text>
          <Text style={styles.tag}>{ticket.branchName}</Text>
          <View style={styles.dash} />
          <Text style={styles.number}>{ticket.number}</Text>
          <Text style={styles.reason}>{ticket.category}</Text>
          <View style={styles.dash} />
          <View style={styles.grid}>
            <Cell k="Name" v={ticket.visitorName} full />
            {!!ticket.visitorTin && <Cell k="TIN" v={ticket.visitorTin} />}
            <Cell k="Contact" v={ticket.visitorContact} full={!ticket.visitorTin} />
            {!!ticket.visitorEmail && <Cell k="Email" v={ticket.visitorEmail} full />}
            <Cell k="Date" v={ticket.issuedDateLocal} />
            <Cell k="Time" v={ticket.issuedTimeLocal} />
          </View>
        </PrintingTicket>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: spacing.xxl },
  message: { flex: 1, minWidth: 260, alignItems: "center" },
  mascot: { width: 130, height: 130 },
  take: { fontFamily: fonts.kaushan, fontSize: 40, lineHeight: 54, color: colors.primary, textAlign: "center", marginTop: spacing.md },
  wait: { fontFamily: fonts.regular, fontSize: 16, color: colors.muted, textAlign: "center", marginTop: spacing.sm },
  ahead: { fontFamily: fonts.bold, fontSize: 17, color: colors.navy, textAlign: "center", marginTop: spacing.lg },
  printMsg: { fontFamily: fonts.medium, fontSize: 14, color: colors.warning, textAlign: "center", marginTop: spacing.md },
  reset: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: spacing.md },

  org: { fontFamily: fonts.bold, fontSize: 12, color: colors.text, textAlign: "center" },
  tag: { fontFamily: fonts.regular, fontSize: 10, color: colors.muted, textAlign: "center" },
  dash: { borderTopWidth: 1, borderStyle: "dashed", borderColor: colors.border, marginVertical: spacing.sm },
  number: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.text, textAlign: "center" },
  reason: { fontFamily: fonts.bold, fontSize: 13, color: colors.maroon, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "50%", paddingVertical: 2, paddingRight: 6 },
  k: { fontFamily: fonts.regular, fontSize: 9, color: colors.muted },
  v: { fontFamily: fonts.medium, fontSize: 12, color: colors.text },
});