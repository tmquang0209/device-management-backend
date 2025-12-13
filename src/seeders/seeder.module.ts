import {
  DeviceEntity,
  DeviceLocationEntity,
  DeviceTypeEntity,
  PartnerEntity,
  UserEntity,
} from '@entities';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeviceSeeder } from './device.seeder';
import { PartnerSeeder } from './partner.seeder';
import { UserSeeder } from './user.seeder';

@Module({
  imports: [
    SequelizeModule.forFeature([
      UserEntity,
      PartnerEntity,
      DeviceEntity,
      DeviceTypeEntity,
      DeviceLocationEntity,
    ]),
  ],
  providers: [UserSeeder, PartnerSeeder, DeviceSeeder],
  exports: [UserSeeder, PartnerSeeder, DeviceSeeder],
})
export class SeederModule {}
