import { EUserRole } from '@common/enums';
import { UserEntity } from '@entities';
import { faker } from '@faker-js/faker';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserSeeder {
  private readonly logger = new Logger(UserSeeder.name);

  constructor(
    @InjectModel(UserEntity)
    private readonly userModel: typeof UserEntity,
  ) {}

  /**
   * Seed users with random data
   * @param count Number of users to create
   * @returns Created user entities
   */
  async seed(count: number = 10): Promise<UserEntity[]> {
    this.logger.log(`Seeding ${count} users...`);

    const hashedPassword = await bcrypt.hash('password123', 10);
    const roles = Object.values(EUserRole);
    const users: Partial<UserEntity>[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      users.push({
        name: `${firstName} ${lastName}`,
        userName:
          faker.internet.username({ firstName, lastName }).toLowerCase() +
          '_' +
          i,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        password: hashedPassword,
        roleType: faker.helpers.arrayElement(roles),
        status: faker.datatype.boolean({ probability: 0.9 }), // 90% active
      });
    }

    const createdUsers = await this.userModel.bulkCreate(
      users as UserEntity[],
      {
        ignoreDuplicates: true,
      },
    );

    this.logger.log(`Successfully seeded ${createdUsers.length} users`);
    return createdUsers;
  }

  /**
   * Seed admin user if not exists
   * @returns Admin user entity
   */
  async seedAdmin(): Promise<UserEntity> {
    this.logger.log('Seeding admin user...');

    const existingAdmin = await this.userModel.findOne({
      where: { userName: 'admin' },
    });

    if (existingAdmin) {
      this.logger.log('Admin user already exists');
      return existingAdmin;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await this.userModel.create({
      name: 'Administrator',
      userName: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      roleType: EUserRole.ADMIN,
      status: true,
    } as UserEntity);

    this.logger.log('Successfully seeded admin user');
    return admin;
  }

  /**
   * Clear all seeded users (except admin)
   */
  async clear(): Promise<void> {
    this.logger.log('Clearing all users except admin...');
    await this.userModel.destroy({
      where: {},
      force: true,
    });
    this.logger.log('Users cleared');
  }

  /**
   * Get random user IDs for seeding other entities
   * @param count Number of random user IDs to get
   * @returns Array of user IDs
   */
  async getRandomUserIds(count: number): Promise<string[]> {
    const users = await this.userModel.findAll({
      attributes: ['id'],
      order: this.userModel.sequelize?.random(),
      limit: count,
    });
    return users.map((user) => user.id);
  }
}
