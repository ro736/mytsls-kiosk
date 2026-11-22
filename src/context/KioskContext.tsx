/*
  File Path: src/context/KioskContext.tsx
  File Description: Loads the saved kiosk key, then calls GET /api/kiosk/config at start-up and every 60 seconds.
  Keeps the last good copy so the screens keep working through a short network drop.
*/
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
    ApiError, Credentials, KioskConfig, getCachedConfig, getCredentials, getKioskConfig,
    normalizeServer, saveCachedConfig, saveCredentials,
} from "../services/queueApi";

type Ctx = {
  loading: boolean;
  isSetUp: boolean;
  credentials: Credentials | null;
  config: KioskConfig | null;
  offline: boolean;
  setupMessage: string;
  saveSetup: (server: string, key: string) => Promise<void>;
  markNotSetUp: (message?: string) => void;
  refresh: () => Promise<void>;
};

const KioskContext = createContext<Ctx | null>(null);

export function KioskProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [config, setConfig] = useState<KioskConfig | null>(null);
  const [offline, setOffline] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupMessage, setSetupMessage] = useState("");

  // Saved key + last good config
  useEffect(() => {
    (async () => {
      const [c, cfg] = await Promise.all([getCredentials(), getCachedConfig()]);
      setCredentials(c);
      setConfig(cfg);
      setLoading(false);
    })();
  }, []);

  // 401 / 404 anywhere: stop and send the tablet to the set-up screen
  const markNotSetUp = useCallback((message?: string) => {
    setNeedsSetup(true);
    setSetupMessage(message || "This kiosk is not set up—please see staff.");
  }, []);

  const refresh = useCallback(async () => {
    if (!credentials) return;
    try {
      const cfg = await getKioskConfig(credentials);
      setConfig(cfg);
      setOffline(false);
      saveCachedConfig(cfg);
    } catch (e) {
      const err = e as ApiError;
      if (err.notSetUp) markNotSetUp(err.message);
      else setOffline(true); // keep showing the last good config
    }
  }, [credentials, markNotSetUp]);

  const isSetUp = !!credentials && !needsSetup;

  useEffect(() => {
    if (!isSetUp) return;
    refresh();
    const id = setInterval(refresh, 60000);
    return () => clearInterval(id);
  }, [isSetUp, refresh]);

  /** Checks the key against the server first; throws an ApiError if it is not accepted. */
  const saveSetup = useCallback(async (server: string, key: string) => {
    const cred = { server: normalizeServer(server), key: key.trim() };
    const cfg = await getKioskConfig(cred);
    await saveCredentials(cred);
    saveCachedConfig(cfg);
    setCredentials(cred);
    setConfig(cfg);
    setNeedsSetup(false);
    setSetupMessage("");
    setOffline(false);
  }, []);

  return (
    <KioskContext.Provider value={{ loading, isSetUp, credentials, config, offline, setupMessage, saveSetup, markNotSetUp, refresh }}>
      {children}
    </KioskContext.Provider>
  );
}

export function useKiosk() {
  const ctx = useContext(KioskContext);
  if (!ctx) throw new Error("useKiosk must be used inside <KioskProvider>");
  return ctx;
}