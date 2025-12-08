import { SendMailOptions } from '@dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class MailProducer {
  private readonly logger = new Logger(MailProducer.name);

  constructor(@InjectQueue('mail') private readonly mailQueue: Queue) {}
  async sendMailJob(data: SendMailOptions) {
    this.logger.log(`📧 Adding mail job to queue: ${JSON.stringify(data)}`);
    await this.mailQueue.add('send-mail', data);
  }
}
