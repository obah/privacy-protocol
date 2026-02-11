export type DemoTransactionSource = "dao" | "defi";

export interface NormalTransactionEvent {
  hash: `0x${string}`;
  source: DemoTransactionSource;
  methodHint: string;
  parametersHint: string;
  privacyLevel: "Public";
}

export type NormalTransactionReporter = (
  transaction: NormalTransactionEvent,
) => void;
