export interface ShortcutAction {
  id: string;
  label: string;
  description: string;
  defaultKey: string; // e.g. "Mod+K", "Mod+H", "Mod+1"
}

export const SHORTCUT_ACTIONS: ShortcutAction[] = [
  {
    id: "focus_search",
    label: "Focus Search / Inspect",
    description: "Instantly focus the domain input to start a new inspection",
    defaultKey: "Mod+K",
  },
  {
    id: "toggle_history",
    label: "Toggle Inspections Panel",
    description: "Open or close the left history / scans sidebar",
    defaultKey: "Mod+H",
  },
  {
    id: "go_home",
    label: "Go Home",
    description: "Return to the main search dashboard screen",
    defaultKey: "Mod+Shift+H",
  },
  {
    id: "open_shortcuts",
    label: "Keyboard Shortcuts",
    description: "Open this keyboard shortcuts manager",
    defaultKey: "Mod+/",
  },
  {
    id: "open_settings",
    label: "Open Settings and Preferences",
    description: "Open application preferences and settings modal",
    defaultKey: "Mod+,",
  },
  {
    id: "tab_overview",
    label: "Switch to Overview Tab",
    description: "View TLS certificates & connection overview",
    defaultKey: "Mod+1",
  },
  {
    id: "tab_chain",
    label: "Switch to Chain Tab",
    description: "View certificate hierarchy trust chain",
    defaultKey: "Mod+2",
  },
  {
    id: "tab_protocols",
    label: "Switch to Protocols Tab",
    description: "View supported TLS protocols and cipher suites",
    defaultKey: "Mod+3",
  },
  {
    id: "tab_headers",
    label: "Switch to Headers Tab",
    description: "View server HTTP response headers and latency",
    defaultKey: "Mod+4",
  },
  {
    id: "tab_json",
    label: "Switch to Raw JSON Tab",
    description: "View colored raw JSON payload response",
    defaultKey: "Mod+5",
  },
];

export type UserShortcutMap = Record<string, string>;

const SHORTCUTS_STORAGE_KEY = "tls_engine_user_shortcuts";

export function getDefaultShortcuts(): UserShortcutMap {
  const defaults: UserShortcutMap = {};
  for (const action of SHORTCUT_ACTIONS) {
    defaults[action.id] = action.defaultKey;
  }
  return defaults;
}

export function loadUserShortcuts(): UserShortcutMap {
  try {
    const raw = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...getDefaultShortcuts(), ...parsed };
    }
  } catch (e) {
    console.error("Failed to load user shortcuts:", e);
  }
  return getDefaultShortcuts();
}

export function saveUserShortcuts(map: UserShortcutMap): void {
  try {
    localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.error("Failed to save user shortcuts:", e);
  }
}

/**
 * Normalizes keyboard event into a standardized combo string (e.g. "Mod+K", "Ctrl+Alt+S")
 */
export function eventToShortcutKey(e: KeyboardEvent): string | null {
  // Ignore lonely modifier keys
  if (["Control", "Shift", "Alt", "Meta"].includes(e.key)) {
    return null;
  }

  const parts: string[] = [];

  // Mod means Cmd on Mac or Ctrl on Windows/Linux
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const hasCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

  if (hasCmdOrCtrl) {
    parts.push("Mod");
  } else if (e.ctrlKey) {
    parts.push("Ctrl");
  } else if (e.metaKey) {
    parts.push("Meta");
  }

  if (e.altKey) {
    parts.push("Alt");
  }

  if (e.shiftKey) {
    parts.push("Shift");
  }

  let key = e.key;
  if (key === " ") key = "Space";
  else if (key.length === 1) key = key.toUpperCase();

  parts.push(key);
  return parts.join("+");
}

/**
 * Tests whether a KeyboardEvent matches a registered shortcut string (e.g. "Mod+K")
 */
export function matchesShortcut(e: KeyboardEvent, shortcutCombo: string): boolean {
  if (!shortcutCombo) return false;

  const parts = shortcutCombo.split("+");
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const requiresMod = parts.includes("Mod");
  const requiresCtrl = parts.includes("Ctrl");
  const requiresMeta = parts.includes("Meta");
  const requiresAlt = parts.includes("Alt");
  const requiresShift = parts.includes("Shift");
  const expectedKey = parts[parts.length - 1];

  const hasMod = isMac ? e.metaKey : e.ctrlKey;
  if (requiresMod && !hasMod) return false;
  if (!requiresMod && requiresCtrl && !e.ctrlKey) return false;
  if (!requiresMod && requiresMeta && !e.metaKey) return false;
  if (requiresAlt !== e.altKey) return false;
  if (requiresShift !== e.shiftKey) return false;

  let eventKey = e.key;
  if (eventKey === " ") eventKey = "Space";
  else if (eventKey.length === 1) eventKey = eventKey.toUpperCase();

  return eventKey.toUpperCase() === expectedKey.toUpperCase();
}

/**
 * Format shortcut key nicely for UI badges (e.g. "Mod+K" -> "⌘K" on Mac or "Ctrl+K" on Windows/Linux)
 */
export function formatShortcutForDisplay(combo: string): string {
  if (!combo) return "";
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  return combo
    .split("+")
    .map((part) => {
      if (part === "Mod") return isMac ? "⌘" : "Ctrl";
      if (part === "Shift") return isMac ? "⇧" : "Shift";
      if (part === "Alt") return isMac ? "⌥" : "Alt";
      if (part === "Meta") return isMac ? "⌘" : "Win";
      return part;
    })
    .join(isMac ? "" : " + ");
}
