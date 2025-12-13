import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ProStatus {
  is_pro: boolean;
  tier: string;
  activated_at: string | null;
}

/**
 * Guardian PRO status hook.
 * Reads from Tauri command `tauri_get_pro_status`.
 */
export default function useProStatus() {
  const [status, setStatus] = useState<ProStatus>({
    is_pro: false,
    tier: "Open Core",
    activated_at: null,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await invoke<ProStatus>("tauri_get_pro_status");   // ⭐ FIXED
      console.log("PRO STATUS:", res);                               // ⭐ Debug log
      setStatus(res);
    } catch (err) {
      console.error("tauri_get_pro_status failed:", err);
      setStatus({
        is_pro: false,
        tier: "Open Core",
        activated_at: null,
      });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...status, refresh };
}
