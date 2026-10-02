export type LedgerType = 'utang' | 'piutang' | 'amanah' | 'wasiat';

export const LEDGER_LABEL: Record<LedgerType, string> = {
  utang: 'Utang saya',
  piutang: 'Piutang',
  amanah: 'Amanah',
  wasiat: 'Wasiat',
};

/** Isi catatan — hanya ada di dalam ciphertext. */
export interface LedgerPayload {
  type: LedgerType;
  title: string;
  /** Nama pihak terkait (pemberi/penerima/pemberi amanah). */
  counterparty: string;
  /** Nominal dalam rupiah (opsional). */
  amountIdr: number | null;
  note: string;
  createdDay: string;
  /** Jatuh tempo (opsional; tidak untuk wasiat). */
  dueDay: string | null;
  settled: boolean;
  settledDay: string | null;
}

export interface LedgerView extends LedgerPayload {
  id: string;
}
