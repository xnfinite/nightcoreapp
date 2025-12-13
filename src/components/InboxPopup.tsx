import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import useProStatus from "../hooks/useProStatus";
import "./inboxPopup.css";

interface InboxEntry {
  tenant: string;
  signed: boolean;
}

export default function InboxPopup() {
  const pro = useProStatus();
  const navigate = useNavigate();

  const [visible, setVisible] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!pro.is_pro) return;

    const check = async () => {
      try {
        const entries = await invoke<InboxEntry[]>("list_agent_inbox");
        const pending = (entries || []).filter(e => !e.signed);

        if (pending.length > 0 && !visible) {
          setCount(pending.length);
          setVisible(true);
        }
      } catch {}
    };

    check();
    const id = setInterval(check, 4000);
    return () => clearInterval(id);
  }, [pro.is_pro, visible]);

  if (!visible) return null;

  return (
    <div className="inbox-popup" onClick={() => navigate("/inbox")}>
      <strong>Agent Submission</strong>
      <p>{count} WASM module awaiting approval</p>
      <span>Click to review</span>

      <button
        className="popup-close"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
        }}
      >
        ✕
      </button>
    </div>
  );
}
