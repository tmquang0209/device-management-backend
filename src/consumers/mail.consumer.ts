import { SendMailOptions } from '@dto';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MailService } from '@services';
import { Worker } from 'bullmq';

@Injectable()
export class MailConsumer implements OnModuleInit {
  private readonly logger = new Logger(MailConsumer.name);
  constructor(private readonly mailService: MailService) {}

  onModuleInit() {
    const worker = new Worker(
      'mail',
      async (job) => {
        if (job.name === 'send-mail') {
          const { to, subject, data, template }: SendMailOptions = job.data;
          this.logger.log(`📧 Sending mail to: ${to}, subject: ${subject}`);
          await this.mailService.sendMailWithTemplate({
            to,
            subject,
            data,
            template,
          });
        }
        return Promise.resolve();
      },
      {
        connection: {
          host: process.env.REDIS_HOST,
          db: Number(process.env.REDIS_DB) || 0,
          username: process.env.REDIS_USERNAME || undefined,
          password: process.env.REDIS_PASSWORD || undefined,
          port: Number(process.env.REDIS_PORT),
        },
      },
    );

    worker.on('completed', (job) => {
      this.logger.log(`✅ Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      this.logger.error(`❌ Job ${job?.id} failed: ${err.message}`);
    });
  }
}
