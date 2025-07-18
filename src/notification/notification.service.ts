import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../entity/user.entity';
// Import the service account JSON as an object
import * as dotenv from 'dotenv';
dotenv.config();
// const serviceAccount = require('../../db-wsb-project-firebase-adminsdk-go6gm-2ffa83b8b0.json');
const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {
    // Initialize Firebase Admin SDK if not already initialized
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(
          serviceAccount as admin.ServiceAccount,
        ),
      });
    }
  }

  /**
   * Send notification to all admin FCM tokens
   * @param title Notification title
   * @param body Notification body
   * @param data Optional data payload
   */
  async sendToAdmin(title: string, body: string, data?: Record<string, any>) {
    // Fetch admin FCM tokens from DB
    const admins = await this.userModel
      .find({ role: 'admin', fcmToken: { $ne: null } })
      .lean();
    const adminFcmTokens: string[] = admins
      .map((a) => a.fcmToken)
      .filter(Boolean);
    if (adminFcmTokens.length === 0) {
      this.logger.warn('No admin FCM tokens found. Notification not sent.');
      return;
    }
    const message = {
      notification: { title, body },
      data: data
        ? Object.fromEntries(
            Object.entries(data).map(([k, v]) => [k, String(v)]),
          )
        : undefined,
      tokens: adminFcmTokens,
    };
    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(
        `Sent notification to admin: ${response.successCount} success, ${response.failureCount} failed.`,
      );
      this.logger.log(
        `Sent notification to admin: ${response.successCount} success, ${response.failureCount} failed.`,
      );
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          this.logger.error(
            `Failed token #${idx}: error: ${resp.error?.message}`,
          );
        }
      });
    } catch (error) {
      this.logger.error('Failed to send notification to admin:', error);
    }
  }
}
