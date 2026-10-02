import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { getFirestoreDb } from "@/lib/firebase";
import type { PatientInfo } from "@/lib/patient";
import type { PredictionResponse } from "@/lib/predict";

export type ScanRecord = {
  id: string;
  patient: PatientInfo;
  result: PredictionResponse;
  createdAt: string; // ISO string
};

function scansCollection(uid: string) {
  return collection(getFirestoreDb(), "users", uid, "scans");
}

/** The scan's own scan_id is used as the Firestore document id, so saving twice overwrites, not duplicates. */
export async function saveScanRecord(uid: string, patient: PatientInfo, result: PredictionResponse): Promise<void> {
  await setDoc(doc(scansCollection(uid), result.scan_id), { patient, result, createdAt: serverTimestamp() });
}

function toRecord(id: string, data: DocumentData): ScanRecord {
  const createdAt = data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : new Date().toISOString();
  return { id, patient: data.patient as PatientInfo, result: data.result as PredictionResponse, createdAt };
}

export async function listScanRecords(uid: string, max = 50): Promise<ScanRecord[]> {
  const snap = await getDocs(query(scansCollection(uid), orderBy("createdAt", "desc"), fsLimit(max)));
  return snap.docs.map((d) => toRecord(d.id, d.data()));
}

export async function getScanRecord(uid: string, id: string): Promise<ScanRecord | null> {
  const snap = await getDoc(doc(scansCollection(uid), id));
  return snap.exists() ? toRecord(snap.id, snap.data()) : null;
}

export async function deleteScanRecord(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(scansCollection(uid), id));
}