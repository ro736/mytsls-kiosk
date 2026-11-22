/*
  File Path: src/context/VisitContext.tsx
  File Description: Holds the current visitor (existing student or guest) while they move through the kiosk flow
*/
import React, { createContext, useContext, useState } from "react";

export type Visitor = {
  type: "student" | "guest";
  tin: string;
  name: string;
  contact: string;
  email: string;
};

export type IssuedTicket = {
  number: string;
  reason: string;
  issuedAt: Date;
  visitor: Visitor;
};

type Ctx = {
  visitor: Visitor | null;
  setVisitor: (v: Visitor | null) => void;
  ticket: IssuedTicket | null;
  setTicket: (t: IssuedTicket | null) => void;
  reset: () => void;
};

const VisitContext = createContext<Ctx | null>(null);

export function VisitProvider({ children }: { children: React.ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [ticket, setTicket] = useState<IssuedTicket | null>(null);
  const reset = () => {
    setVisitor(null);
    setTicket(null);
  };
  return (
    <VisitContext.Provider value={{ visitor, setVisitor, ticket, setTicket, reset }}>
      {children}
    </VisitContext.Provider>
  );
}

export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error("useVisit must be used inside <VisitProvider>");
  return ctx;
}
