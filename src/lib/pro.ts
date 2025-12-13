// src/lib/pro.ts
import { invoke } from "@tauri-apps/api/core";

export async function unlockPro(license: string): Promise<boolean> {
  try {
    return await invoke<boolean>("unlock_pro_from_license", { license });
  } catch (e) {
    console.error("unlockPro failed:", e);
    return false;
  }
}

export async function getProStatus() {
  try {
    return await invoke("get_pro_status");
  } catch {
    return { is_pro: false };
  }
}
