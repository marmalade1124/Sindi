/**
 * Sindí API Client
 * Centralized service for communicating with the FastAPI backend
 */

// Uses environment variable for production/local, falls back to production
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://sindi-production.up.railway.app";

export interface OutageArea {
  id: number;
  city: string;
  barangay: string;
}

export interface Outage {
  id: number;
  source_post_url: string;
  post_text: string;
  outage_type: "planned" | "emergency" | "advisory";
  start_datetime: string | null;
  estimated_restore_datetime: string | null;
  reason: string | null;
  confidence_score: number;
  status: "upcoming" | "active" | "resolved";
  created_at: string;
  affected_areas: OutageArea[];
}

export interface UserProfile {
  id: number;
  device_id: string;
  city: string | null;
  barangay: string | null;
  emergency_only: boolean;
  created_at: string;
}

export interface LocationOption {
  city: string;
  barangays: string[];
}

// ──────── Outage API ────────

export async function fetchOutages(status?: string, limit = 50): Promise<Outage[]> {
  try {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    params.append("limit", String(limit));
    const res = await fetch(`${BASE_URL}/api/outages?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] fetchOutages failed:", err);
    return [];
  }
}

export async function fetchActiveOutages(): Promise<Outage[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/outages/active`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] fetchActiveOutages failed:", err);
    return [];
  }
}

export async function fetchOutageById(id: number): Promise<Outage | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/outages/${id}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] fetchOutageById failed:", err);
    return null;
  }
}

export async function searchOutages(query: string): Promise<Outage[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/outages/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] searchOutages failed:", err);
    return [];
  }
}

// ──────── Location API ────────

export async function fetchLocations(): Promise<LocationOption[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/locations`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] fetchLocations failed:", err);
    return [];
  }
}

// ──────── User API ────────

export async function registerUser(data: {
  device_id: string;
  city?: string;
  barangay?: string;
  emergency_only?: boolean;
}): Promise<UserProfile | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[API] registerUser failed:", err);
    return null;
  }
}

// ──────── Dev/Debug ────────

export async function triggerScrape(): Promise<void> {
  try {
    await fetch(`${BASE_URL}/api/scrape/trigger`, { method: "POST" });
  } catch (err) {
    console.warn("[API] triggerScrape failed:", err);
  }
}

// ──────── Helpers ────────

export function formatOutageTime(isoString: string | null): string {
  if (!isoString) return "Unknown";
  try {
    const date = new Date(isoString);
    return date.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

export function getStatusColor(status: string): { bg: string; text: string; label: string } {
  switch (status) {
    case "active":
      return { bg: "bg-red-50", text: "text-red-700", label: "Active" };
    case "upcoming":
      return { bg: "bg-yellow-50", text: "text-yellow-700", label: "Upcoming" };
    case "resolved":
      return { bg: "bg-green-50", text: "text-green-700", label: "Resolved" };
    default:
      return { bg: "bg-slate-50", text: "text-slate-700", label: status };
  }
}

export function getOutageTypeIcon(type: string): string {
  switch (type) {
    case "emergency":
      return "warning";
    case "planned":
      return "build";
    default:
      return "info";
  }
}
