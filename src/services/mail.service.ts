import { SendMailOptions } from '@dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMailWithTemplate(options: SendMailOptions) {
    // Ensure context is properly structured
    const context = options.data || {};

    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: context,
      });
      console.log('✅ Mail sent successfully');
    } catch (error) {
      console.error('❌ Error sending mail:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(to: string, name: string) {
    await this.mailerService.sendMail({
      to,
      subject: 'Welcome to Our App!',
      template: './welcome', // corresponds to templates/welcome.hbs
      context: {
        name,
      },
    });
  }
}
