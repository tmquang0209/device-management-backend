import {
  DeviceEntity,
  DeviceLocationEntity,
  DeviceTypeEntity,
  ParamEntity,
  PartnerEntity,
  UserEntity,
} from '@entities';
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DeviceSeeder } from './device.seeder';
import { ParamSeeder } from './param.seeder';
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
      ParamEntity,
    ]),
  ],
  providers: [UserSeeder, PartnerSeeder, DeviceSeeder, ParamSeeder],
  exports: [UserSeeder, PartnerSeeder, DeviceSeeder, ParamSeeder],
})
export class SeederModule {}
