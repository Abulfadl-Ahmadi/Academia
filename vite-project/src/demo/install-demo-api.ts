/**
 * Offline demo mode.
 *
 * Swaps the axios adapter for one that replays a snapshot of real API
 * responses (`api-snapshot.json`, recorded from the running site while signed
 * in as the demo student) instead of talking to Django. That is what lets the
 * single-file build open straight from disk — no server, no login — and still
 * show the signed-in experience.
 *
 * Only loaded when the bundle is built with VITE_DEMO_MODE=true; the normal
 * build never imports this module or the snapshot.
 */
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from "axios";

import axiosInstance from "@/lib/axios";
import snapshot from "./api-snapshot.json";

const responses = snapshot as Record<string, unknown>;

/** An empty DRF page, for endpoints the recording never hit. */
const EMPTY_PAGE = { count: 0, next: null, previous: null, results: [] };

const READ_ONLY_MESSAGE =
  "این نسخهٔ نمایشی است و امکان ثبت تغییر در آن وجود ندارد.";

/** Normalise whatever axios was handed into the "/api/…" key the snapshot uses. */
function snapshotKey(config: AxiosRequestConfig): string {
  const base = config.baseURL ?? "";
  const raw = config.url ?? "";
  const joined = /^https?:\/\//.test(raw)
    ? raw
    : `${base.replace(/\/+$/, "")}/${raw.replace(/^\/+/, "")}`;

  // A relative base ("/api/") needs an origin before URL can parse it.
  const url = new URL(joined, "http://demo.local");
  let path = url.pathname.replace(/\/{2,}/g, "/");
  if (!path.startsWith("/api/")) path = `/api${path}`;
  if (!path.endsWith("/")) path += "/";

  const params = new URLSearchParams(url.search);
  for (const [key, value] of Object.entries(config.params ?? {})) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

function lookup(key: string): unknown | undefined {
  if (key in responses) return responses[key];
  // Recorded with a query string the caller didn't repeat (or vice versa).
  const bare = key.split("?")[0];
  if (bare in responses) return responses[bare];
  const match = Object.keys(responses).find((k) => k.split("?")[0] === bare);
  return match ? responses[match] : undefined;
}

function reply(config: AxiosRequestConfig, data: unknown, status = 200): AxiosResponse {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : "Demo",
    headers: {},
    config: config as AxiosResponse["config"],
  };
}

const demoAdapter: AxiosAdapter = async (config) => {
  const method = (config.method ?? "get").toUpperCase();
  const key = snapshotKey(config);

  if (method !== "GET") {
    // Surface the app's own error toast with a sentence that explains the
    // build, rather than pretending the write succeeded and leaving the UI
    // in a state the data never reaches.
    const error = new Error(READ_ONLY_MESSAGE) as Error & {
      response: AxiosResponse;
      config: AxiosRequestConfig;
      isAxiosError: boolean;
    };
    error.config = config;
    error.isAxiosError = true;
    // 403 rather than 401: a 401 would send the interceptor down the
    // token-refresh path and log the demo visitor out.
    error.response = reply(config, { error: READ_ONLY_MESSAGE, detail: READ_ONLY_MESSAGE }, 403);
    throw error;
  }

  const hit = lookup(key);
  if (hit === undefined) {
    console.info("[demo] no snapshot for", key, "- returning an empty list");
    return reply(config, EMPTY_PAGE);
  }
  return reply(config, hit);
};

axiosInstance.defaults.adapter = demoAdapter;

// The service worker caches network requests that no longer exist here, and a
// stale cache would out-live the demo file itself.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations?.().then((regs) => {
    regs.forEach((reg) => reg.unregister());
  });
}

console.info(
  `[demo] offline demo mode: ${Object.keys(responses).length} recorded endpoints, writes disabled`
);
