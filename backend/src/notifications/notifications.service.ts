import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { FcmToken, DeviceType } from './entities/fcm-token.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(FcmToken)
    private readonly fcmTokenRepository: Repository<FcmToken>,
    private readonly configService: ConfigService,
  ) {
    // Initialize Firebase Admin SDK only once (singleton pattern)
    if (!admin.apps.length) {
      const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
      const privateKey = this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')
        ?.replace(/\\n/g, '\n');
      const clientEmail = this.configService.get<string>(
        'FIREBASE_CLIENT_EMAIL',
      );

      const isRealKey =
        privateKey?.startsWith('-----BEGIN') ||
        privateKey?.includes('PRIVATE KEY');

      if (projectId && isRealKey && clientEmail) {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              privateKey,
              clientEmail,
            }),
          });
          this.logger.log('Firebase Admin SDK initialized');
        } catch (err) {
          this.logger.warn(
            `Firebase Admin SDK init failed (push notifications disabled): ${(err as Error).message}`,
          );
        }
      } else {
        this.logger.warn(
          'Firebase credentials not configured — push notifications disabled in this environment',
        );
      }
    }
  }

  // ─── Token Management ──────────────────────────────────────────────────────

  async registerToken(
    userId: string,
    token: string,
    deviceType: DeviceType,
  ): Promise<FcmToken> {
    // Upsert: update existing token record if token already exists
    const existing = await this.fcmTokenRepository.findOne({
      where: { token },
    });

    if (existing) {
      existing.userId = userId;
      existing.deviceType = deviceType;
      return this.fcmTokenRepository.save(existing);
    }

    const fcmToken = this.fcmTokenRepository.create({
      userId,
      token,
      deviceType,
    });
    return this.fcmTokenRepository.save(fcmToken);
  }

  async getTokensForUser(userId: string): Promise<string[]> {
    const tokens = await this.fcmTokenRepository.find({ where: { userId } });
    return tokens.map((t) => t.token);
  }

  // ─── Core Send Methods ─────────────────────────────────────────────────────

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    const tokens = await this.getTokensForUser(userId);
    if (!tokens.length) {
      this.logger.debug(`No FCM tokens for user ${userId} — skipping push`);
      return;
    }
    await this.sendToMultiple(tokens, title, body, data);
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!admin.apps.length) return;

    try {
      await admin.messaging().send({
        topic,
        notification: { title, body },
        data,
      });
      this.logger.log(`Push sent to topic '${topic}': ${title}`);
    } catch (err) {
      this.logger.error(
        `Failed to send push to topic '${topic}': ${(err as Error).message}`,
      );
    }
  }

  async sendToMultiple(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<void> {
    if (!admin.apps.length || !tokens.length) return;

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data,
      });
      this.logger.log(
        `Multicast push: ${response.successCount} sent, ${response.failureCount} failed`,
      );

      // Clean up invalid tokens
      response.responses.forEach((resp, idx) => {
        if (
          !resp.success &&
          (resp.error?.code === 'messaging/invalid-registration-token' ||
            resp.error?.code === 'messaging/registration-token-not-registered')
        ) {
          void this.removeInvalidToken(tokens[idx]);
        }
      });
    } catch (err) {
      this.logger.error(`Multicast push failed: ${(err as Error).message}`);
    }
  }

  private async removeInvalidToken(token: string): Promise<void> {
    await this.fcmTokenRepository.delete({ token });
    this.logger.debug(`Removed invalid FCM token: ${token.slice(0, 20)}...`);
  }

  // ─── Domain-Specific Notification Helpers ─────────────────────────────────

  async notifyTripAssigned(
    driverId: string,
    tripId: string,
    clientName: string,
  ): Promise<void> {
    await this.sendToUser(
      driverId,
      'Nuevo viaje asignado',
      `Tienes un nuevo viaje de ${clientName}`,
      { tripId, event: 'TRIP_ASSIGNED' },
    );
  }

  async notifyDriverArriving(
    clientId: string,
    tripId: string,
    eta: number,
  ): Promise<void> {
    await this.sendToUser(
      clientId,
      'Tu conductor está llegando',
      `Tu conductor llegará en aproximadamente ${eta} minutos`,
      { tripId, eta: String(eta), event: 'DRIVER_ARRIVING' },
    );
  }

  async notifyTripCompleted(
    clientId: string,
    tripId: string,
    finalPrice: number,
  ): Promise<void> {
    await this.sendToUser(
      clientId,
      'Viaje completado',
      `Tu viaje ha finalizado. Total: $${finalPrice.toFixed(2)} USD`,
      { tripId, finalPrice: String(finalPrice), event: 'TRIP_COMPLETED' },
    );
  }

  async notifySOSAlert(
    supervisorTopic: string,
    tripId: string,
    location: { lat: number; lng: number },
  ): Promise<void> {
    await this.sendToTopic(
      supervisorTopic,
      '🚨 Alerta SOS',
      `Alerta SOS activa en el viaje ${tripId}`,
      {
        tripId,
        lat: String(location.lat),
        lng: String(location.lng),
        event: 'SOS_ALERT',
      },
    );
  }
}
