export type TSLog = {
  ts: number;
  level: "info" | "error";
  source: string;
  event: string;
  data?: any;
};

let logs: TSLog[] = [];

export function tsInfo(source: string, event: string, data?: any) {
  logs.push({ ts: Date.now(), level: "info", source, event, data });
  if (logs.length > 500) logs.shift();
}

export function tsError(source: string, event: string, data?: any) {
  logs.push({ ts: Date.now(), level: "error", source, event, data });
  if (logs.length > 500) logs.shift();
}

export function tsGet() {
  return [...logs];
}

export function tsClear() {
  logs = [];
}

export function tsReport(extra?: Record<string, any>) {
  const env = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    buildTime: new Date().toISOString(),
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : "n/a",
    origin: typeof window !== "undefined" ? window.location.origin : "n/a",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  const body = {
    env,
    extra: extra ?? {},
    logs: logs.map((l) => ({
      ts: new Date(l.ts).toISOString(),
      level: l.level,
      source: l.source,
      event: l.event,
      data: l.data,
    })),
  };
  return JSON.stringify(body, null, 2);
}
