"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { getAccessToken } from "@/lib/cookies";

function getJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.sub ? String(decoded.sub) : null;
  } catch {
    return null;
  }
}

interface MastraDataContextValue {
  thread_id: string;
  resource_id: string;
  setThreadId: (id: string) => void;
  setResourceId: (id: string) => void;
}

export const mastraDataContext = createContext<MastraDataContextValue>({
  thread_id: "",
  // resource_id is intended to be the JWT `sub` claim (e.g. "patient-282714"),
  // but a random UUID is used for now.
  // TODO: Replace with decoded access_token `sub` field when ready.
  resource_id: "",
  setThreadId: () => {},
  setResourceId: () => {},
});

const STORAGE_KEY_RESOURCE = "mastra_resource_id";
const STORAGE_KEY_THREAD = "mastra_thread_id";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage not available (SSR or private mode)
  }
}

interface Props {
  children: React.ReactNode;
}

export function MastraDataContextProvider({ children }: Props) {
  // resource_id: one UUID per browser — represents the user across sessions.
  // Intended to be the JWT `sub` claim; using random UUID for now.
  const [resourceId, setResourceIdState] = useState<string>("");
  // thread_id: one UUID per conversation — reset when starting a new chat.
  const [threadId, setThreadIdState] = useState<string>("");

  useEffect(() => {
    async function init() {
      // Derive resource_id from JWT sub claim
      let resource: string;
      const token = await getAccessToken();
      if (token) {
        resource = getJwtSub(token) ?? readStorage(STORAGE_KEY_RESOURCE) ?? uuidv4();
      } else {
        resource = readStorage(STORAGE_KEY_RESOURCE) ?? uuidv4();
      }
      writeStorage(STORAGE_KEY_RESOURCE, resource);
      setResourceIdState(resource);

      // thread_id is random per conversation
      const storedThread = readStorage(STORAGE_KEY_THREAD);
      const thread = storedThread ?? uuidv4();
      if (!storedThread) writeStorage(STORAGE_KEY_THREAD, thread);
      setThreadIdState(thread);
    }
    init();
  }, []);

  const setResourceId = (id: string) => {
    writeStorage(STORAGE_KEY_RESOURCE, id);
    setResourceIdState(id);
  };

  const setThreadId = (id: string) => {
    writeStorage(STORAGE_KEY_THREAD, id);
    setThreadIdState(id);
  };

  return (
    <mastraDataContext.Provider
      value={{
        resource_id: resourceId,
        thread_id: threadId,
        setResourceId,
        setThreadId,
      }}
    >
      {children}
    </mastraDataContext.Provider>
  );
}

export const useMastraData = () => useContext(mastraDataContext);
