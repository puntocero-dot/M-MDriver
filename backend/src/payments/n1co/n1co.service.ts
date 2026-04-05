import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  PaymentGateway,
  HoldParams,
  HoldResult,
  CaptureResult,
} from '../interfaces/payment-gateway.interface';

// NOTE: N1co API docs — confirm pre-auth endpoint names with N1co before going live.
// The endpoint paths below (/holds, /holds/{holdId}/capture, /holds/{holdId}/release,
// /refunds) are provisional based on typical payment gateway conventions.

export class PaymentException extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'PaymentException';
  }
}

@Injectable()
export class N1coService implements PaymentGateway {
  private readonly logger = new Logger(N1coService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly merchantId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('n1co.apiUrl') ?? 'https://api.n1co.com';
    this.apiKey = this.configService.get<string>('n1co.apiKey') ?? '';
    this.merchantId = this.configService.get<string>('n1co.merchantId') ?? '';

    if (!this.apiKey) {
      this.logger.warn('N1co API Key is missing. Payments will fail.');
    }
  }

  private get authHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async placeHold(params: HoldParams): Promise<HoldResult> {
    this.logger.log(
      `N1co placeHold — amount: ${params.amount} ${params.currency}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post<HoldResult>(
          `${this.baseUrl}/holds`,
          {
            amount: params.amount,
            currency: params.currency,
            cardToken: params.cardToken,
            merchantId: params.merchantId || this.merchantId,
          },
          { headers: this.authHeaders },
        ),
      );

      this.logger.log(
        `N1co placeHold success — holdId: ${response.data.holdId}`,
      );
      return response.data;
    } catch (err) {
      this.logger.error('N1co placeHold failed', err);
      throw new PaymentException(
        'Error al reservar fondos en N1co',
        'N1CO_HOLD_FAILED',
        err,
      );
    }
  }

  async captureHold(holdId: string, amount: number): Promise<CaptureResult> {
    this.logger.log(`N1co captureHold — holdId: ${holdId}, amount: ${amount}`);

    try {
      const response = await firstValueFrom(
        this.httpService.post<CaptureResult>(
          `${this.baseUrl}/holds/${holdId}/capture`,
          { amount },
          { headers: this.authHeaders },
        ),
      );

      this.logger.log(
        `N1co captureHold success — txId: ${response.data.transactionId}`,
      );
      return response.data;
    } catch (err) {
      this.logger.error(`N1co captureHold failed for holdId: ${holdId}`, err);
      throw new PaymentException(
        'Error al capturar pago en N1co',
        'N1CO_CAPTURE_FAILED',
        err,
      );
    }
  }

  async releaseHold(holdId: string): Promise<void> {
    this.logger.log(`N1co releaseHold — holdId: ${holdId}`);

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/holds/${holdId}/release`,
          {},
          { headers: this.authHeaders },
        ),
      );

      this.logger.log(`N1co releaseHold success — holdId: ${holdId}`);
    } catch (err) {
      this.logger.error(`N1co releaseHold failed for holdId: ${holdId}`, err);
      throw new PaymentException(
        'Error al liberar fondos en N1co',
        'N1CO_RELEASE_FAILED',
        err,
      );
    }
  }

  async refund(transactionId: string, amount: number): Promise<void> {
    this.logger.log(`N1co refund — txId: ${transactionId}, amount: ${amount}`);

    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/refunds`,
          { transactionId, amount },
          { headers: this.authHeaders },
        ),
      );

      this.logger.log(`N1co refund success — txId: ${transactionId}`);
    } catch (err) {
      this.logger.error(`N1co refund failed for txId: ${transactionId}`, err);
      throw new PaymentException(
        'Error al procesar reembolso en N1co',
        'N1CO_REFUND_FAILED',
        err,
      );
    }
  }
}
