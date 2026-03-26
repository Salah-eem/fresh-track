import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private mailerService: MailerService) {
    this.logger.log('EmailService initialized with MailerModule');
  }

  async sendExpiryNotification(
    userEmail: string,
    itemName: string,
    brand: string | null,
    expiryDate: Date,
    daysUntilExpiry: number,
  ): Promise<boolean> {
    try {
      const subject =
        daysUntilExpiry === 0
          ? `⚠️ ${itemName} expire AUJOURD'HUI !`
          : `⚠️ ${itemName} expire dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}`;

      const expiryDateFormatted = expiryDate.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const html = `
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #FF6B6B; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
              .content { background-color: #f9f9f9; padding: 20px; border-radius: 5px; }
              .item-details { background-color: #fff; border-left: 4px solid #FF6B6B; padding: 15px; margin: 15px 0; }
              .button { display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
              .footer { margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>🔔 Alerte d'Expiration</h2>
              </div>
              
              <div class="content">
                <p>Bonjour,</p>
                
                <p>${
                  daysUntilExpiry === 0
                    ? `<strong>${itemName}</strong> expire <strong>aujourd'hui</strong> ! Pensez à vérifier votre inventaire.`
                    : `<strong>${itemName}</strong> va expirer <strong>dans ${daysUntilExpiry} jour${daysUntilExpiry > 1 ? 's' : ''}</strong>.`
                }</p>

                <div class="item-details">
                  <p><strong>Détails du produit :</strong></p>
                  <p>
                    <strong>Nom :</strong> ${itemName}<br>
                    ${brand ? `<strong>Marque :</strong> ${brand}<br>` : ''}
                    <strong>Date d'expiration :</strong> ${expiryDateFormatted}
                  </p>
                </div>

                <p>${
                  daysUntilExpiry === 0
                    ? 'Merci de vérifier cet article dans votre inventaire.'
                    : 'Nous vous recommandez de vérifier cet article et de le consommer ou le jeter avant la date d\'expiration.'
                }</p>

                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/inventory" class="button">
                  Consulter mon inventaire
                </a>
              </div>

              <div class="footer">
                <p>Vous recevez cet email parce que vous avez activé les notifications d'expiration dans Fresh Track.</p>
                <p>&copy; ${new Date().getFullYear()} Fresh Track. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.mailerService.sendMail({
        to: userEmail,
        subject,
        html,
      });

      this.logger.log(
        `Expiry notification email sent to ${userEmail} for item ${itemName}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send expiry notification email to ${userEmail}:`,
        error,
      );
      return false;
    }
  }

  async sendTestEmail(email: string): Promise<boolean> {
    try {
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif;">
            <h2>Email de test réussi !</h2>
            <p>Cet email confirme que la configuration du service d'email fonctionne correctement.</p>
          </body>
        </html>
      `;

      await this.mailerService.sendMail({
        to: email,
        subject: 'Test Email - Fresh Track',
        html,
      });

      this.logger.log(`Test email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send test email to ${email}:`, error);
      return false;
    }
  }
}
