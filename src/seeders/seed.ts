import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DeviceSeeder } from './device.seeder';
import { ParamSeeder } from './param.seeder';
import { PartnerSeeder } from './partner.seeder';
import { UserSeeder } from './user.seeder';

async function bootstrap() {
  const logger = new Logger('Seeder');

  try {
    logger.log('Starting seeding process...');

    // Create app context with full module to get database connection
    const app = await NestFactory.createApplicationContext(AppModule);

    // Get seeders
    const paramSeeder = app.get(ParamSeeder);
    const userSeeder = app.get(UserSeeder);
    const partnerSeeder = app.get(PartnerSeeder);
    const deviceSeeder = app.get(DeviceSeeder);

    // Parse command line arguments
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');
    const userCount = parseInt(
      args.find((arg) => arg.startsWith('--users='))?.split('=')[1] || '20',
    );
    const partnerCount = parseInt(
      args.find((arg) => arg.startsWith('--partners='))?.split('=')[1] || '15',
    );
    const deviceCount = parseInt(
      args.find((arg) => arg.startsWith('--devices='))?.split('=')[1] || '50',
    );

    // Clear existing data if requested
    if (shouldClear) {
      logger.log('Clearing existing data...');
      await deviceSeeder.clear();
      await deviceSeeder.clearDeviceTypes();
      await partnerSeeder.clear();
      await userSeeder.clear();
      await paramSeeder.clearUserRoles();
      logger.log('Data cleared successfully');
    }

    // Seed data in order (params first, then users, partners and devices)
    logger.log('Seeding user role params...');
    await paramSeeder.seedUserRoles();

    logger.log('Seeding users...');
    await userSeeder.seedAdmin();
    await userSeeder.seed(userCount);

    logger.log('Seeding device types...');
    await deviceSeeder.seedDeviceTypes();

    logger.log('Seeding partners...');
    await partnerSeeder.seed(partnerCount);

    logger.log('Seeding devices...');
    await deviceSeeder.seed(deviceCount);

    logger.log('✅ Seeding completed successfully!');
    logger.log(`  - Users: ${userCount} + 1 admin`);
    logger.log(`  - Partners: ${partnerCount}`);
    logger.log(`  - Devices: ${deviceCount}`);

    await app.close();
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

void bootstrap();
