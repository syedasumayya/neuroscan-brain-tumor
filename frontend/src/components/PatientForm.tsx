"use client";

import { GENDER_OPTIONS, type PatientErrors, type PatientInfo } from "@/lib/patient";

const inputClass =
  "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 outline-none " +
  "transition focus:ring-2 focus:ring-cortex/20";

function fieldBorder(hasError: boolean): string {
  return hasError ? "border-signal focus:border-signal" : "border-line focus:border-cortex";
}

type Props = {
  value: PatientInfo;
  onChange: (next: PatientInfo) => void;
  /** Only fields the visitor has left, so a required field isn't red before they've touched it. */
  errors: PatientErrors;
  touched: Partial<Record<keyof PatientInfo, boolean>>;
  onBlur: (field: keyof PatientInfo) => void;
};

export default function PatientForm({ value, onChange, errors, touched, onBlur }: Props) {
  const show = (field: keyof PatientInfo) => touched[field] && errors[field];

  return (
    <section aria-labelledby="patient-heading" className="rounded-2xl border border-line bg-film p-6">
      <h2 id="patient-heading" className="text-xs font-semibold uppercase tracking-wide text-muted">
        Patient information
      </h2>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Full name <span className="text-signal">*</span>
          </span>
          <input
            type="text"
            value={value.fullName}
            onChange={(e) => onChange({ ...value, fullName: e.target.value })}
            onBlur={() => onBlur("fullName")}
            placeholder="e.g. Test Patient 01"
            aria-invalid={Boolean(show("fullName"))}
            aria-describedby={show("fullName") ? "fullName-error" : undefined}
            className={`${inputClass} ${fieldBorder(Boolean(show("fullName")))}`}
          />
          {show("fullName") && (
            <p id="fullName-error" role="alert" className="mt-1 text-xs text-signal">
              {errors.fullName}
            </p>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Age <span className="text-signal">*</span>
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={value.age}
            onChange={(e) => onChange({ ...value, age: e.target.value })}
            onBlur={() => onBlur("age")}
            placeholder="45"
            aria-invalid={Boolean(show("age"))}
            aria-describedby={show("age") ? "age-error" : undefined}
            className={`${inputClass} ${fieldBorder(Boolean(show("age")))}`}
          />
          {show("age") && (
            <p id="age-error" role="alert" className="mt-1 text-xs text-signal">
              {errors.age}
            </p>
          )}
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            Gender <span className="text-signal">*</span>
          </span>
          <select
            value={value.gender}
            onChange={(e) => onChange({ ...value, gender: e.target.value as PatientInfo["gender"] })}
            onBlur={() => onBlur("gender")}
            aria-invalid={Boolean(show("gender"))}
            aria-describedby={show("gender") ? "gender-error" : undefined}
            className={`${inputClass} ${fieldBorder(Boolean(show("gender")))}`}
          >
            <option value="" disabled>
              Select
            </option>
            {GENDER_OPTIONS.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
          {show("gender") && (
            <p id="gender-error" role="alert" className="mt-1 text-xs text-signal">
              {errors.gender}
            </p>
          )}
        </label>
      </div>

      <p className="mt-4 text-xs text-muted">
        Use anonymized or made-up patient details. Do not enter identifiable real patient information.
      </p>
    </section>
  );
}