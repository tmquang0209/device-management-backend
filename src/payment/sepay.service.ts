import {
  EPaymentMethod,
  EPaymentStatus,
  EReconciliationStatus,
} from '@common/enums';
import { SepayWebhookDto } from '@dto/payment.dto';
import { PaymentProviderEntity, PaymentTransactionEntity } from '@entities';
import {
  ForbiddenException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigService } from '@services';
import * as dayjs from 'dayjs';
import { v7 as uuidv7 } from 'uuid';
@Injectable()
export class SepayService implements OnModuleInit {
  private readonly logger = new Logger(SepayService.name);
  private provider: PaymentProviderEntity | null = null;
  private prefix: string;
  private counter: number;

  constructor(
    @InjectModel(PaymentProviderEntity)
    private readonly paymentProviderRepo: typeof PaymentProviderEntity,
    @InjectModel(PaymentTransactionEntity)
    private readonly paymentTransactionRepo: typeof PaymentTransactionEntity,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.initProvider();
    await this.initPrefixAndCounter();
  }

  private async initProvider() {
    const existing = await this.paymentProviderRepo.findOne({
      where: { code: 'SEPAY' },
    });
    if (!existing) {
      this.provider = await this.paymentProviderRepo.create({
        name: 'Sepay',
        code: 'SEPAY',
        authorizedKey: uuidv7(),
      } as PaymentProviderEntity);
      this.logger.log('Sepay payment provider initialized.');
    } else {
      this.provider = existing;
      this.logger.log('Sepay payment provider already exists.');
    }
    return this.provider;
  }

  private async initPrefixAndCounter() {
    // Initialize prefix
    let prefixData =
      await this.configService.getConfigByKey('SEPAY_TXN_PREFIX');

    prefixData ??= await this.configService.setConfig({
      key: 'SEPAY_TXN_PREFIX',
      value: 'SP',
      description: 'Prefix for Sepay transaction IDs',
    });

    this.prefix = prefixData.value;

    // Initialize counter
    let counterData =
      await this.configService.getConfigByKey('SEPAY_TXN_COUNTER');
    counterData ??= await this.configService.setConfig({
      key: 'SEPAY_TXN_COUNTER',
      value: '0001',
      description: 'Counter for Sepay transaction IDs',
    });
    this.counter = parseInt(counterData.value, 10);
  }

  async handleWebhook(payload: SepayWebhookDto) {
    this.logger.debug('Received Sepay webhook payload:', payload);

    const isSignatureValid = true; // Placeholder for actual validation logic
    if (!isSignatureValid) {
      this.logger.error('Invalid webhook signature received from Sepay.');
      throw new ForbiddenException('Invalid webhook signature.');
    }

    const dataToUpdate = {
      providerTxnId: payload.id.toString(),
      amount: payload.transferAmount,
      currency: 'VND',
      paymentMethod: EPaymentMethod.BANK_TRANSFER,
      status:
        payload.transferType === 'in'
          ? EPaymentStatus.PAID
          : EPaymentStatus.FAILED,
      lastWebhookAt: dayjs().toDate(),
      metadata: payload,
      paidAt: dayjs(payload.transactionDate).toDate(),
      reconStatus: EReconciliationStatus.MATCHED,
      webhookSignatureOk: isSignatureValid,
    };

    const [updatedCount] = await this.paymentTransactionRepo.update(
      dataToUpdate as unknown as PaymentTransactionEntity,
      {
        where: {
          description: payload.referenceCode,
          status: EPaymentStatus.PENDING,
        },
      },
    );

    if (updatedCount === 0) {
      return this._handleUnmatchedTransaction(payload, isSignatureValid);
    }

    this.logger.log(
      `Transaction with description ${payload.referenceCode} updated successfully.`,
    );

    return { status: 'success' };
  }

  private async _handleUnmatchedTransaction(
    payload: SepayWebhookDto,
    isSignatureValid: boolean,
  ) {
    this.logger.warn(
      `No pending transaction found for Sepay webhook with referenceCode: ${payload.referenceCode}. Creating a new unmatched transaction for manual review.`,
    );

    // Increment and update the transaction counter for the new orphan transaction
    this.counter++;
    await this.configService.updateConfig({
      key: 'SEPAY_TXN_COUNTER',
      value: String(this.counter).padStart(4, '0'),
      id: '',
    });

    const newTransactionData = {
      providerId: this.provider?.id,
      userId: null, // This is an orphan payment and requires manual reconciliation
      transactionId: `${this.prefix}${String(this.counter).padStart(4, '0')}`,
      providerTxnId: payload.id.toString(),
      providerRefId: payload.referenceCode,
      amount: payload.transferAmount,
      description: payload.content,
      currency: 'VND',
      paymentMethod: EPaymentMethod.BANK_TRANSFER,
      status:
        payload.transferType === 'in'
          ? EPaymentStatus.PAID
          : EPaymentStatus.FAILED,
      lastWebhookAt: dayjs().toDate(),
      metadata: payload,
      paidAt: dayjs(payload.transactionDate).toDate(),
      reconStatus: EReconciliationStatus.MISMATCHED,
      webhookSignatureOk: isSignatureValid,
    };

    const newTransaction = await this.paymentTransactionRepo.create(
      newTransactionData as unknown as PaymentTransactionEntity,
    );

    this.logger.log(
      `Created new unmatched transaction with ID: ${newTransaction.id}`,
    );

    return { status: 'unmatched_transaction_created' };
  }
}
