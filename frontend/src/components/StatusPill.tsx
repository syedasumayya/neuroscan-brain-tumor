"use client";

import { useEffect, useState } from "react";
import { Activity, CircleAlert, CircleOff, ShieldCheck } from "lucide-react";
import { fetchHealth, type Health } from "@/lib/api";

type State =
  | { kind: "checking" }
  | { kind: "ready"; health: Health }
  | { kind: "degraded"; health: Health }
  | { kind: "offline" };

const POLL_MS = 15_000;

/** A compact system indicator (icon-only on small screens), not a "Models ready" label -
 * the tooltip and the color carry the meaning instead. */
export default function StatusPill() {
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let alive = true;

    async function check() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const health = await fetchHealth(controller.signal);
        if (alive) setState({ kind: health.status === "ok" ? "ready" : "degraded", health });
      } catch {
        if (alive) setState({ kind: "offline" });
      } finally {
        clearTimeout(timer);
      }
    }

    check();
    const id = setInterval(check, POLL_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const view = {
    checking: { Icon: Activity, text: "Connecting", tone: "text-muted", dot: "bg-muted animate-pulse" },
    ready: { Icon: ShieldCheck, text: "Online", tone: "text-clear", dot: "bg-clear" },
    degraded: { Icon: CircleAlert, text: "Limited", tone: "text-caution", dot: "bg-caution" },
    offline: { Icon: CircleOff, text: "Offline", tone: "text-signal", dot: "bg-signal" },
  }[state.kind];

  const detail =
    state.kind === "ready"
      ? `Detection service online - ${state.health.model_status} model on ${state.health.device ?? "cpu"}` +
        (state.health.gate_loaded ? ", MRI check on" : ", MRI check off")
      : state.kind === "degraded"
        ? (state.health.detail ?? "The detection service started without a usable model.")
        : state.kind === "offline"
          ? "Can't reach the detection service. New scans won't work until it's back."
          : "Connecting to the detection service...";

  return (
    <span
      role="status"
      title={detail}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line bg-film px-2.5 py-1.5 text-xs font-medium ${view.tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${view.dot}`} aria-hidden />
      <view.Icon size={13} aria-hidden />
      <span className="hidden sm:inline">{view.text}</span>
    </span>
  );
}