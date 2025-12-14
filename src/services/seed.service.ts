import { UserEntity } from '@entities';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
  ) {}

  async onModuleInit() {
    await this.seedDefaultAdmin();
  }

  private async seedDefaultAdmin() {
    try {
      // Check if any admin user exists
      const adminExists = await this.userRepo.findOne({
        where: { roleType: 'ADMIN' },
      });

      if (adminExists) {
        this.logger.log('Admin user already exists, skipping seed');
        return;
      }

      // Check if any user exists at all
      const userCount = await this.userRepo.count();
      if (userCount > 0) {
        this.logger.log('Users already exist, skipping admin seed');
        return;
      }

      // Create default admin user
      const hashedPassword = await bcrypt.hash('123456', 10);

      await this.userRepo.create({
        name: 'Admin',
        userName: 'admin',
        email: 'admin@system.local',
        password: hashedPassword,
        roleType: 'ADMIN',
        status: true,
      } as UserEntity);

      this.logger.log(
        'Default admin user created successfully (username: admin, password: 123456)',
      );
    } catch (error) {
      this.logger.error('Failed to seed default admin user', error);
      throw error;
    }
  }
}
