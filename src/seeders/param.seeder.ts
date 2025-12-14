import { ParamEntity } from '@entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class ParamSeeder {
  private readonly logger = new Logger(ParamSeeder.name);

  constructor(
    @InjectModel(ParamEntity)
    private readonly paramModel: typeof ParamEntity,
  ) {}

  /**
   * Seed user role params
   */
  async seedUserRoles(): Promise<void> {
    this.logger.log('Seeding user roles...');

    const userRoles = [
      {
        type: 'user_role',
        code: 'ADMIN',
        value: 'ADMIN',
        description: 'Administrator with full system access',
      },
      {
        type: 'user_role',
        code: 'STAFF',
        value: 'STAFF',
        description: 'Staff member with limited access',
      },
    ];

    for (const role of userRoles) {
      const existing = await this.paramModel.findOne({
        where: { type: role.type, code: role.code },
      });

      if (!existing) {
        await this.paramModel.create(role as unknown as ParamEntity);
        this.logger.log(`Created user role param: ${role.code}`);
      } else {
        this.logger.log(`User role param already exists: ${role.code}`);
      }
    }

    this.logger.log('Successfully seeded user roles');
  }

  /**
   * Clear all user role params
   */
  async clearUserRoles(): Promise<void> {
    this.logger.log('Clearing user roles...');
    await this.paramModel.destroy({
      where: { type: 'user_role' },
    });
    this.logger.log('User roles cleared');
  }
}
