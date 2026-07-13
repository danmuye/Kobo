type Listener = () => void;

export type ConnectionState = "connected" | "disconnected" | "connecting";

export interface FirebaseStatus {
  connection: ConnectionState;
  isOnline: boolean;
  isConfigured: boolean;
  isInitialized: boolean;
}

let status: FirebaseStatus = {
  connection: "disconnected",
  isOnline: navigator.onLine,
  isConfigured: false,
  isInitialized: false,
};

const listeners = new Set<Listener>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function getFirebaseStatus(): FirebaseStatus {
  return { ...status };
}

export function updateFirebaseStatus(patch: Partial<FirebaseStatus>): FirebaseStatus {
  status = { ...status, ...patch };
  notify();
  return getFirebaseStatus();
}

export function onFirebaseStatusChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function startConnectionMonitoring(): () => void {
  const handleOnline = () => {
    updateFirebaseStatus({ isOnline: true });
  };
  const handleOffline = () => {
    updateFirebaseStatus({ isOnline: false, connection: "disconnected" });
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}
