export type Gender = "female" | "male" | "other" | "unspecified";

export type PatientInfo = {
  fullName: string;
  age: string;   // kept as a string while editing; parsed only for validation
  gender: Gender | "";
};

export const EMPTY_PATIENT: PatientInfo = { fullName: "", age: "", gender: "" };

export type PatientErrors = Partial<Record<keyof PatientInfo, string>>;

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
  { value: "unspecified", label: "Prefer not to say" },
];

/** Pure validation so it can be unit-tested without rendering anything. */
export function validatePatient(p: PatientInfo): PatientErrors {
  const errors: PatientErrors = {};

  const name = p.fullName.trim();
  if (!name) errors.fullName = "Enter the patient's name.";
  else if (name.length < 2) errors.fullName = "That name looks too short.";
  else if (name.length > 120) errors.fullName = "That name is too long.";

  if (p.age.trim() === "") {
    errors.age = "Enter an age.";
  } else {
    const n = Number(p.age);
    if (!Number.isInteger(n) || String(n) !== p.age.trim()) errors.age = "Age must be a whole number.";
    else if (n < 0 || n > 120) errors.age = "Enter an age between 0 and 120.";
  }

  if (!p.gender) errors.gender = "Select a gender.";

  return errors;
}

export const isPatientValid = (p: PatientInfo): boolean => Object.keys(validatePatient(p)).length === 0;