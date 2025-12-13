interface TauriShellCommand {
  spawn: () => Promise<any>;
}

interface TauriShellAPI {
  Command: {
    create: (cmd: string, args?: string[]) => TauriShellCommand;
  };
}

interface TauriGlobal {
  shell: TauriShellAPI;
}

declare global {
  interface Window {
    __TAURI__?: TauriGlobal;
  }
}

export {};
