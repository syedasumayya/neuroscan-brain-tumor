"use client";

import { useState } from "react";
import { Building2, ExternalLink, MapPin, ShieldAlert, TriangleAlert } from "lucide-react";
import { groupHospitals, guidanceFor, toTumorKind, PROVINCES } from "@/lib/care";
import type { Province } from "@/lib/hospitals";

export default function HospitalSuggestions({ tumorType }: { tumorType: string | null }) {
  const kind = toTumorKind(tumorType);
  const [province, setProvince] = useState<Province | "all">("all");
  const guidance = guidanceFor(kind);
  const groups = groupHospitals(kind, province === "all" ? null : province);
  const hasAny = groups.some((g) => g.hospitals.length > 0);

  return (
    <section aria-labelledby="care-heading" className="rounded-2xl border border-line bg-film p-6">
      <h2 id="care-heading" className="font-display text-lg font-semibold">
        Where to go next in Pakistan
      </h2>
      <p className="mt-1 text-sm text-muted">{guidance.intro}</p>
      {guidance.specific && <p className="mt-2 text-sm text-ink/80">{guidance.specific}</p>}

      <div className="mt-4 flex items-start gap-2 rounded-lg border border-signal/30 bg-signal-soft px-3 py-2.5 text-sm text-signal">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
        <p>
          Go to an emergency room now if there is {guidance.redFlags.slice(0, -1).join(", ")}, or{" "}
          {guidance.redFlags[guidance.redFlags.length - 1]}.
        </p>
      </div>

      <ol className="mt-4 space-y-1.5 text-sm text-ink/80">
        {guidance.steps.map((s, i) => (
          <li key={s} className="flex gap-2">
            <span className="font-medium text-cortex">{i + 1}.</span> {s}
          </li>
        ))}
      </ol>

      <div className="mt-5 flex items-center gap-2">
        <MapPin size={14} className="text-muted" aria-hidden />
        <label htmlFor="province-filter" className="text-xs font-medium text-muted">
          Province
        </label>
        <select
          id="province-filter"
          value={province}
          onChange={(e) => setProvince(e.target.value as Province | "all")}
          className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
        >
          <option value="all">All provinces</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      {!hasAny && (
        <p className="mt-4 text-sm text-muted">No hospitals in this list match that province. Try &quot;All provinces&quot;.</p>
      )}

      {groups.map(
        (group) =>
          group.hospitals.length > 0 && (
            <div key={group.key} className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">{group.title}</p>
              <p className="mb-2 text-xs text-muted">{group.blurb}</p>
              <ul className="space-y-2">
                {group.hospitals.map((h) => (
                  <li key={h.id} className="rounded-xl border border-line bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Building2 size={16} className="mt-0.5 shrink-0 text-cortex" aria-hidden />
                        <div>
                          <p className="text-sm font-medium">{h.name}</p>
                          <p className="text-xs text-muted">
                            {h.city}, {h.province} - {h.sector}
                          </p>
                          <p className="mt-1 text-xs text-ink/70">{h.summary}</p>
                        </div>
                      </div>
                      <a
                        href={h.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-cortex hover:underline"
                      >
                        {h.websiteLabel} <ExternalLink size={11} aria-hidden />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ),
      )}

      <p className="mt-5 flex items-start gap-2 text-xs text-muted">
        <TriangleAlert size={13} className="mt-0.5 shrink-0" aria-hidden />
        This is a general starting list, not a directory or a personal recommendation. Confirm specialists,
        availability and costs directly with the hospital.
      </p>
    </section>
  );
}