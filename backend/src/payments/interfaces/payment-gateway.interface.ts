export interface HoldParams {
  amount: number;
  currency: string;
  cardToken: string;
  merchantId: string;
}

export interface HoldResult {
  holdId: string;
  status: string;
  amount: number;
  currency: string;
  expiresAt?: string;
}

export interface CaptureResult {
  transactionId: string;
  holdId: string;
  capturedAmount: number;
  status: string;
  capturedAt: string;
}

export interface PaymentGateway {
  placeHold(params: HoldParams): Promise<HoldResult>;
  captureHold(holdId: string, amount: number): Promise<CaptureResult>;
  releaseHold(holdId: string): Promise<void>;
  refund(transactionId: string, amount: number): Promise<void>;
}
