import { isTauri, invoke } from "@tauri-apps/api/core";
import { HealthStatus, HistoryItemSummary, InspectionEnvelope } from "./types";

export async function inspectHost(host: string): Promise<InspectionEnvelope> {
  if (isTauri()) {
    return await invoke<InspectionEnvelope>("inspect_host", { host });
  }

  // Graceful browser fallback for UI preview
  const res = await fetch(`https://tls.kroatenwerk.com/v1/${encodeURIComponent(host)}`);
  const xCache = res.headers.get("x-cache");
  const server = res.headers.get("server");
  const date = res.headers.get("date");
  const cfCacheStatus = res.headers.get("cf-cache-status");
  const xPoweredBy = res.headers.get("x-powered-by");
  const text = await res.text();

  if (!res.ok) {
    if (res.status >= 500) {
      throw new Error(`The website '${host}' does not have a valid security certificate or is currently offline. Please check the spelling of the domain and try again.`);
    }
    throw new Error(`Could not scan '${host}'. Please check the domain spelling and try again.`);
  }

  const data = JSON.parse(text);
  return {
    id: Date.now(),
    host,
    metadata: {
      x_cache: xCache,
      cf_cache_status: cfCacheStatus,
      server,
      date,
      x_powered_by: xPoweredBy,
      status_code: res.status,
      roundtrip_ms: 120.5,
    },
    data,
    raw_json: text,
    from_cache: false,
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  if (isTauri()) {
    return await invoke<HealthStatus>("check_health");
  }

  try {
    const res = await fetch("https://tls.kroatenwerk.com/health");
    const text = await res.text();
    const isOk = res.ok && text.trim() === "OK";
    return {
      healthy: isOk,
      status_code: res.status,
      message: isOk ? "TLS Engine Service is operational" : text,
      checked_at: new Date().toISOString(),
      x_powered_by: res.headers.get("x-powered-by"),
    };
  } catch (err: any) {
    return {
      healthy: false,
      status_code: 0,
      message: err.message || "Failed to reach health endpoint",
      checked_at: new Date().toISOString(),
      x_powered_by: null,
    };
  }
}

export async function getHistory(search?: string): Promise<HistoryItemSummary[]> {
  if (isTauri()) {
    return await invoke<HistoryItemSummary[]>("get_history", { search: search || null });
  }
  // Browser preview mock
  return [
    {
      id: 1,
      host: "example.com",
      inspected_at: new Date().toISOString(),
      is_trusted: true,
      tls_version: "TLSv1.3",
      cipher_name: "TLS_AES_256_GCM_SHA384",
      x_cache: "HIT",
      duration_ms: 46.2,
    },
  ];
}

export async function getInspectionDetail(id: number): Promise<InspectionEnvelope> {
  if (isTauri()) {
    return await invoke<InspectionEnvelope>("get_inspection_detail", { id });
  }
  throw new Error("Local offline history playback requires desktop Tauri environment");
}

export async function deleteHistoryItem(id: number): Promise<boolean> {
  if (isTauri()) {
    return await invoke<boolean>("delete_history_item", { id });
  }
  return true;
}

export async function clearHistory(): Promise<number> {
  if (isTauri()) {
    return await invoke<number>("clear_history");
  }
  return 0;
}

export async function sanitizeInput(input: string): Promise<string> {
  if (isTauri()) {
    return await invoke<string>("sanitize_input", { input });
  }
  return input.trim().replace(/^https?:\/\//i, "").split(/[/:]/)[0].toLowerCase();
}
