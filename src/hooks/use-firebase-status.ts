import { useState, useEffect } from "react";
import {
  getFirebaseInitStatus,
  onBackendStatusChange,
} from "@/services/service-provider";
import type { FirebaseStatus } from "@/services/firebase/status";

export function useFirebaseStatus(): FirebaseStatus {
  const [status, setStatus] = useState<FirebaseStatus>(getFirebaseInitStatus);

  useEffect(() => {
    const unsub = onBackendStatusChange(setStatus);
    return unsub;
  }, []);

  return status;
}
