import { useState, useEffect } from "react";
import {
  getFirebaseInitStatus,
  onBackendStatusChange,
  type FirebaseStatus,
} from "@/services/service-provider";

export function useFirebaseStatus(): FirebaseStatus {
  const [status, setStatus] = useState<FirebaseStatus>(getFirebaseInitStatus);

  useEffect(() => {
    const unsub = onBackendStatusChange(setStatus);
    return unsub;
  }, []);

  return status;
}
