import { buildSequelizeQuery } from '@common/utils';
import {
  CreatePaymentProviderDto,
  CreatePaymentTransactionDto,
  PaymentProviderInfoDto,
  PaymentProviderListRequestDto,
  PaymentProviderListResponseDto,
  PaymentTransactionInfoDto,
  PaymentTransactionListRequestDto,
  PaymentTransactionListResponseDto,
  UpdatePaymentProviderDto,
  UpdatePaymentTransactionDto,
} from '@dto';
import {
  PaymentProviderEntity,
  PaymentTransactionEntity,
  UserEntity,
} from '@entities';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CacheService, ConfigService } from '@services';
import { I18nService, i18nValidationMessage } from 'nestjs-i18n';
import { I18nTranslations } from 'src/generated/i18n.generated';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(PaymentProviderEntity)
    private readonly paymentProviderRepo: typeof PaymentProviderEntity,
    @InjectModel(PaymentTransactionEntity)
    private readonly paymentTransactionRepo: typeof PaymentTransactionEntity,
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly i18n: I18nService,
  ) {}

  async createProvider(
    params: CreatePaymentProviderDto,
  ): Promise<PaymentProviderInfoDto> {
    const existing = await this.paymentProviderRepo.findOne({
      where: { code: params.code },
    });
    if (existing)
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>(
          'payment.create.duplicate_code',
        ),
      );
    await this.cacheService.delByPattern('*payments*');
    return this.paymentProviderRepo.create(params as PaymentProviderEntity);
  }

  async findAllProviders(
    params: PaymentProviderListRequestDto,
  ): Promise<PaymentProviderListResponseDto> {
    const { page, pageSize, orderBy, sortBy, ...filters } = params;
    const options = buildSequelizeQuery<PaymentProviderEntity>(
      {
        page,
        pageSize,
        distinct: true,
        sortOrder: orderBy,
        sortBy,
        filters,
        subQuery: false,
      },
      PaymentProviderEntity,
    );

    const { rows, count } =
      await this.paymentProviderRepo.findAndCountAll(options);

    return {
      data: rows,
      total: count,
      page: options.offset! / options.limit! + 1,
      pageSize: options.limit!,
    };
  }

  async findOneProvider(id: string): Promise<PaymentProviderInfoDto> {
    const data = await this.paymentProviderRepo.findByPk(id);
    if (!data)
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>('payment.details.not_found'),
      );

    return data;
  }

  async updateProvider(params: UpdatePaymentProviderDto) {
    const { id, ...updateData } = params;
    const provider = await this.paymentProviderRepo.findOne({ where: { id } });
    if (!provider)
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>('payment.details.not_found'),
      );

    // check duplicate code
    if (updateData.code && updateData.code !== provider.code) {
      const existing = await this.paymentProviderRepo.findOne({
        where: { code: updateData.code },
      });
      if (existing)
        throw new NotFoundException(
          i18nValidationMessage<I18nTranslations>(
            'payment.update.duplicate_code',
          ),
        );
    }
    await this.paymentProviderRepo.update(updateData, { where: { id } });
    await this.cacheService.delByPattern('*payments*');
    return this.paymentProviderRepo.findByPk(id);
  }

  async removeProvider(id: string): Promise<void> {
    await this.paymentProviderRepo.destroy({ where: { id } });
  }

  /**
   * ============================================
   * PAYMENT TRANSACTIONS
   * ============================================
   */
  async createTransaction(
    params: CreatePaymentTransactionDto,
  ): Promise<PaymentTransactionEntity> {
    // make sure payment enable for purchase
    const paymentEnabledConfig =
      await this.configService.getConfigByKey('ENABLE_PAYMENT');
    if (!paymentEnabledConfig || paymentEnabledConfig.value !== 'true') {
      throw new ConflictException(this.i18n.translate('payment.disabled'));
    }
    // check user
    const userDetails = await this.userRepo.findByPk(params.userId);
    if (!userDetails) {
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>('user.details.not_found'),
      );
    }

    // check provider
    const providerDetails = await this.paymentProviderRepo.findByPk(
      params.providerId,
    );
    if (!providerDetails) {
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>('payment.details.not_found'),
      );
    } else if (!providerDetails.isActive) {
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>('payment.details.inactive'),
      );
    }

    const transaction = await this.paymentTransactionRepo.create(
      params as PaymentTransactionEntity,
    );
    return transaction;
  }

  async findAllTransactions(
    params: PaymentTransactionListRequestDto,
  ): Promise<PaymentTransactionListResponseDto> {
    const { page, pageSize, orderBy, sortBy, ...filters } = params;
    const options = buildSequelizeQuery<PaymentTransactionEntity>(
      {
        page,
        pageSize,
        distinct: true,
        sortOrder: orderBy,
        sortBy,
        filters,
        subQuery: false,
        include: [
          {
            model: UserEntity,
            attributes: ['id', 'email', 'fullName'],
          },
          {
            model: PaymentProviderEntity,
            attributes: ['id', 'name', 'code'],
          },
        ],
      },
      PaymentTransactionEntity,
    );

    const { rows, count } =
      await this.paymentTransactionRepo.findAndCountAll(options);

    return {
      data: rows,
      total: count,
      page,
      pageSize,
    };
  }

  async findOneTransaction(id: string): Promise<PaymentTransactionInfoDto> {
    const data = await this.paymentTransactionRepo.findByPk(id);
    if (!data) {
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>(
          'payment.transaction.not_found',
        ),
      );
    }
    return data;
  }

  async updateTransaction(
    params: UpdatePaymentTransactionDto,
  ): Promise<PaymentTransactionInfoDto> {
    const transaction = await this.paymentTransactionRepo.findByPk(params.id);
    if (!transaction) {
      throw new NotFoundException(
        i18nValidationMessage<I18nTranslations>(
          'payment.transaction.not_found',
        ),
      );
    }
    await this.paymentTransactionRepo.update(params, {
      where: { id: params.id },
    });
    return (await this.paymentTransactionRepo.findByPk(
      params.id,
    )) as PaymentTransactionInfoDto;
  }
}
