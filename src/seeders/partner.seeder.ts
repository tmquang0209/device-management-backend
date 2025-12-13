import { PartnerEntity, UserEntity } from '@entities';
import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

export enum EPartnerType {
  SUPPLIER = 1,
  CUSTOMER = 2,
  MAINTENANCE = 3,
  WARRANTY = 4,
}

@Injectable()
export class PartnerSeeder {
  private readonly logger = new Logger(PartnerSeeder.name);

  constructor(
    @InjectModel(PartnerEntity)
    private readonly partnerModel: typeof PartnerEntity,
    @InjectModel(UserEntity)
    private readonly userModel: typeof UserEntity,
  ) {}

  /**
   * Seed partners with random data
   * @param count Number of partners to create
   * @returns Created partner entities
   */
  async seed(count: number = 10): Promise<PartnerEntity[]> {
    this.logger.log(`Seeding ${count} partners...`);

    // Get existing user IDs for createdBy field
    const users = await this.userModel.findAll({
      attributes: ['id'],
      limit: 10,
    });

    if (users.length === 0) {
      this.logger.warn('No users found. Please seed users first.');
      return [];
    }

    const userIds = users.map((user) => user.id);
    const partnerTypes = Object.values(EPartnerType).filter(
      (value) => typeof value === 'number',
    ) as number[];
    const partners: Partial<PartnerEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const randomUserId = faker.helpers.arrayElement(userIds);

      partners.push({
        partnerType: faker.helpers.arrayElement(partnerTypes),
        userId: faker.datatype.boolean({ probability: 0.7 })
          ? faker.helpers.arrayElement(userIds)
          : undefined,
        status: faker.helpers.arrayElement([1, 2]), // 1: Active, 2: Inactive
        createdById: randomUserId,
        updatedById: randomUserId,
      });
    }

    const createdPartners = await this.partnerModel.bulkCreate(
      partners as PartnerEntity[],
      {
        ignoreDuplicates: true,
      },
    );

    this.logger.log(`Successfully seeded ${createdPartners.length} partners`);
    return createdPartners;
  }

  /**
   * Seed partners by type
   * @param type Partner type
   * @param count Number of partners to create
   * @returns Created partner entities
   */
  async seedByType(
    type: EPartnerType,
    count: number = 5,
  ): Promise<PartnerEntity[]> {
    this.logger.log(
      `Seeding ${count} partners of type ${EPartnerType[type]}...`,
    );

    const users = await this.userModel.findAll({
      attributes: ['id'],
      limit: 10,
    });

    if (users.length === 0) {
      this.logger.warn('No users found. Please seed users first.');
      return [];
    }

    const userIds = users.map((user) => user.id);
    const partners: Partial<PartnerEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const randomUserId = faker.helpers.arrayElement(userIds);

      partners.push({
        partnerType: type,
        userId: faker.datatype.boolean({ probability: 0.7 })
          ? faker.helpers.arrayElement(userIds)
          : undefined,
        status: 1,
        createdById: randomUserId,
        updatedById: randomUserId,
      });
    }

    const createdPartners = await this.partnerModel.bulkCreate(
      partners as PartnerEntity[],
      {
        ignoreDuplicates: true,
      },
    );

    this.logger.log(`Successfully seeded ${createdPartners.length} partners`);
    return createdPartners;
  }

  /**
   * Clear all seeded partners
   */
  async clear(): Promise<void> {
    this.logger.log('Clearing all partners...');
    await this.partnerModel.destroy({
      where: {},
      force: true,
    });
    this.logger.log('Partners cleared');
  }

  /**
   * Get random partner IDs
   * @param count Number of random partner IDs to get
   * @returns Array of partner IDs
   */
  async getRandomPartnerIds(count: number): Promise<string[]> {
    const partners = await this.partnerModel.findAll({
      attributes: ['id'],
      order: this.partnerModel.sequelize?.random(),
      limit: count,
    });
    return partners.map((partner) => partner.id);
  }
}
