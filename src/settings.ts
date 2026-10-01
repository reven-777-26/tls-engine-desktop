export type FontComboId =
  | "linear"
  | "nextjs"
  | "raycast"
  | "editorial"
  | "cyberpunk"
  | "apple";

export type DateFormatType = "relative" | "iso" | "us" | "eu" | "hh_yy_dd";

export type ThemeAccentType = "cyan" | "emerald" | "violet" | "rose" | "amber" | "blue";

export interface UserAppSettings {
  fontCombo: FontComboId;
  dateFormat: DateFormatType;
  accentColor: ThemeAccentType;
  fontSize: "sm" | "md" | "lg";
  smoothScroll: boolean;
  codeLigatures: boolean;
  showFloatingDock: boolean;
  jsonSyntaxHighlighting: boolean;
}

export const DEFAULT_SETTINGS: UserAppSettings = {
  fontCombo: "linear",
  dateFormat: "relative",
  accentColor: "cyan",
  fontSize: "md",
  smoothScroll: true,
  codeLigatures: true,
  showFloatingDock: true,
  jsonSyntaxHighlighting: true,
};

const SETTINGS_KEY = "tls_engine_user_settings";

export function loadSettings(): UserAppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy fontFamily to fontCombo if present
      if (parsed.fontFamily && !parsed.fontCombo) {
        parsed.fontCombo = "linear";
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: UserAppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}

export interface FontComboDefinition {
  id: FontComboId;
  name: string;
  badge: string;
  description: string;
  uiFont: string;
  monoFont: string;
  previewUi: string;
  previewMono: string;
}

export const FONT_COMBOS: Record<FontComboId, FontComboDefinition> = {
  linear: {
    id: "linear",
    name: "Linear Pro",
    badge: "Most Popular",
    description: "Inter Display for razor-sharp modern UI and metrics",
    uiFont: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    monoFont: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    previewUi: "Clean & High-Contrast Typography",
    previewMono: "sha256: 0xA5A66B... TLSv1.3",
  },
  nextjs: {
    id: "nextjs",
    name: "Vercel / Geist Modern",
    badge: "Modern Tech",
    description: "Geist UI by Vercel for clean minimalist aesthetics",
    uiFont: '"Geist", -apple-system, BlinkMacSystemFont, sans-serif',
    monoFont: '"Geist", -apple-system, BlinkMacSystemFont, sans-serif',
    previewUi: "Minimalist High-Tech Aesthetics",
    previewMono: "certificate_chain -> ECDSA P-256",
  },
  raycast: {
    id: "raycast",
    name: "Raycast Neo",
    badge: "Futuristic",
    description: "Space Grotesk headers + Inter metrics",
    uiFont: '"Space Grotesk", sans-serif',
    monoFont: '"Inter", sans-serif',
    previewUi: "Futuristic Headings & Sharp Lines",
    previewMono: "TLS_AES_256_GCM_SHA384",
  },
  editorial: {
    id: "editorial",
    name: "Manrope Studio",
    badge: "Balanced & Warm",
    description: "Manrope for warm human-readable typography",
    uiFont: '"Manrope", sans-serif',
    monoFont: '"Manrope", sans-serif',
    previewUi: "Comfortable, warm readability",
    previewMono: "CN=*.badssl.com (RSA 2048)",
  },
  cyberpunk: {
    id: "cyberpunk",
    name: "Outfit & Inter",
    badge: "Sleek Dark",
    description: "Outfit geometric curves with Inter details",
    uiFont: '"Outfit", sans-serif',
    monoFont: '"Inter", sans-serif',
    previewUi: "Vibrant UI with deep contrast",
    previewMono: "X-Cache: HIT [edge-iad-01]",
  },
  apple: {
    id: "apple",
    name: "Apple SF Native",
    badge: "macOS Classic",
    description: "SF Pro native Apple styling across all metrics and text",
    uiFont: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
    monoFont: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
    previewUi: "Native macOS Desktop Look & Feel",
    previewMono: "Valid: 2026-09-22 -> 2028-09-21",
  },
};

export const ACCENT_DEFINITIONS: Record<ThemeAccentType, { label: string; primary: string; hover: string; dim: string; border: string }> = {
  cyan: {
    label: "Electric Cyan",
    primary: "#28A9FF",
    hover: "#52baff",
    dim: "rgba(40, 169, 255, 0.12)",
    border: "rgba(40, 169, 255, 0.35)",
  },
  emerald: {
    label: "Emerald Green",
    primary: "#10b981",
    hover: "#34d399",
    dim: "rgba(16, 185, 129, 0.12)",
    border: "rgba(16, 185, 129, 0.35)",
  },
  blue: {
    label: "Sky Blue",
    primary: "#28A9FF",
    hover: "#52baff",
    dim: "rgba(40, 169, 255, 0.12)",
    border: "rgba(40, 169, 255, 0.35)",
  },
  violet: {
    label: "Neon Purple",
    primary: "#a855f7",
    hover: "#c084fc",
    dim: "rgba(168, 85, 247, 0.12)",
    border: "rgba(168, 85, 247, 0.35)",
  },
  rose: {
    label: "Vibrant Rose",
    primary: "#f43f5e",
    hover: "#fb7185",
    dim: "rgba(244, 63, 94, 0.12)",
    border: "rgba(244, 63, 94, 0.35)",
  },
  amber: {
    label: "Warm Amber",
    primary: "#f59e0b",
    hover: "#fbbf24",
    dim: "rgba(245, 158, 11, 0.12)",
    border: "rgba(245, 158, 11, 0.35)",
  },
};

export function applySettingsToDOM(settings: UserAppSettings): void {
  const root = document.documentElement;

  // 1. Font Combo
  const combo = FONT_COMBOS[settings.fontCombo] || FONT_COMBOS.linear;
  root.style.setProperty("--app-font-family", combo.uiFont);
  root.style.setProperty("--app-font-mono", combo.monoFont);

  // 2. Font Size scale
  if (settings.fontSize === "sm") {
    root.style.setProperty("--app-font-size", "12px");
  } else if (settings.fontSize === "lg") {
    root.style.setProperty("--app-font-size", "14px");
  } else {
    root.style.setProperty("--app-font-size", "13px");
  }

  // 3. Accent Color
  const accent = ACCENT_DEFINITIONS[settings.accentColor] || ACCENT_DEFINITIONS.cyan;
  root.style.setProperty("--blue-primary", accent.primary);
  root.style.setProperty("--blue-hover", accent.hover);
  root.style.setProperty("--blue-dim", accent.dim);
  root.style.setProperty("--blue-border", accent.border);
  root.style.setProperty("--text-blue", accent.primary);
  root.style.setProperty("--btn-blue", accent.primary);
  root.style.setProperty("--btn-blue-hover", accent.hover);

  // 4. Code Ligatures
  if (settings.codeLigatures) {
    root.style.setProperty("--code-ligatures", "normal");
  } else {
    root.style.setProperty("--code-ligatures", "none");
  }
}

export function formatCustomDate(isoString: string, format: DateFormatType): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const time24Str = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
    const time12Str = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    if (format === "iso") {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d} ${time24Str}`;
    }

    if (format === "us") {
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      const y = date.getFullYear();
      return `${m}/${d}/${y} ${time12Str}`;
    }

    if (format === "eu") {
      const d = String(date.getDate()).padStart(2, "0");
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const y = date.getFullYear();
      return `${d}/${m}/${y} ${time12Str}`;
    }

    if (format === "hh_yy_dd") {
      const d = String(date.getDate()).padStart(2, "0");
      const yy = String(date.getFullYear()).slice(-2);
      return `${time24Str} ${yy}/${d}`;
    }

    // Default "relative"
    const now = new Date();
    const isToday =
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate();

    if (isToday) return `Today ${time24Str}`;
    if (isYesterday) return `Yesterday ${time24Str}`;

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${date.getDate()} ${time24Str}`;
  } catch {
    return isoString;
  }
}
