import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { N1coService } from './n1co/n1co.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly n1coService: N1coService,
  ) {}

  /**
   * Create a new payment record in PENDING state.
   */
  async createPaymentRecord(
    tripId: string,
    clientId: string,
    amount: number,
    method: string,
    currency = 'USD',
  ): Promise<Payment> {
    const payment = this.paymentsRepository.create({
      tripId,
      clientId,
      amount,
      currency,
      paymentMethod: method,
      status: PaymentStatus.PENDING,
    });

    const saved = await this.paymentsRepository.save(payment);
    this.logger.log(`Payment record created: ${saved.id} for trip ${tripId}`);
    return saved;
  }

  /**
   * Place a hold on the payment via N1co.
   * Requires payment to have a cardToken in metadata.
   */
  async placeHold(
    paymentId: string,
    cardToken: string,
    merchantId?: string,
  ): Promise<Payment> {
    const payment = await this.findById(paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `El pago ${paymentId} no está en estado PENDING (actual: ${payment.status})`,
      );
    }

    const holdResult = await this.n1coService.placeHold({
      amount: payment.amount,
      currency: payment.currency,
      cardToken,
      merchantId: merchantId ?? '',
    });

    payment.n1coHoldId = holdResult.holdId;
    payment.status = PaymentStatus.HOLD_PLACED;
    payment.metadata = { ...payment.metadata, holdResult };

    const updated = await this.paymentsRepository.save(payment);
    this.logger.log(
      `Hold placed for payment ${paymentId} — holdId: ${holdResult.holdId}`,
    );
    return updated;
  }

  /**
   * Capture the payment (after trip completes) via N1co.
   */
  async capturePayment(
    paymentId: string,
    finalAmount: number,
  ): Promise<Payment> {
    const payment = await this.findById(paymentId);

    if (payment.status !== PaymentStatus.HOLD_PLACED) {
      throw new BadRequestException(
        `El pago ${paymentId} no tiene hold activo (actual: ${payment.status})`,
      );
    }

    if (!payment.n1coHoldId) {
      throw new BadRequestException(
        `El pago ${paymentId} no tiene holdId registrado`,
      );
    }

    const captureResult = await this.n1coService.captureHold(
      payment.n1coHoldId,
      finalAmount,
    );

    payment.n1coTransactionId = captureResult.transactionId;
    payment.amount = finalAmount;
    payment.status = PaymentStatus.CAPTURED;
    payment.metadata = { ...payment.metadata, captureResult };

    const updated = await this.paymentsRepository.save(payment);
    this.logger.log(
      `Payment captured: ${paymentId} — txId: ${captureResult.transactionId}`,
    );
    return updated;
  }

  /**
   * Release hold (e.g. trip cancelled) via N1co.
   */
  async releaseHold(paymentId: string): Promise<Payment> {
    const payment = await this.findById(paymentId);

    if (payment.status !== PaymentStatus.HOLD_PLACED) {
      throw new BadRequestException(
        `El pago ${paymentId} no tiene hold activo para liberar (actual: ${payment.status})`,
      );
    }

    if (!payment.n1coHoldId) {
      throw new BadRequestException(
        `El pago ${paymentId} no tiene holdId registrado`,
      );
    }

    await this.n1coService.releaseHold(payment.n1coHoldId);

    payment.status = PaymentStatus.REFUNDED;
    payment.metadata = {
      ...payment.metadata,
      releasedAt: new Date().toISOString(),
    };

    const updated = await this.paymentsRepository.save(payment);
    this.logger.log(`Hold released for payment ${paymentId}`);
    return updated;
  }

  async findById(paymentId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException(`Pago ${paymentId} no encontrado`);
    }

    return payment;
  }

  async findByTripId(tripId: string): Promise<Payment[]> {
    return this.paymentsRepository.find({ where: { tripId } });
  }
}
