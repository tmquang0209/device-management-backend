import {
  EDeviceStatus,
  EEquipmentLoanSlipStatus,
  EMaintenanceSlipStatus,
} from '@common/enums';
import { DashboardCountsDto, DashboardResponseDto } from '@dto';
import {
  AuditLogsEntity,
  DeviceEntity,
  DeviceLocationEntity,
  DeviceTypeEntity,
  EquipmentLoanSlipEntity,
  EquipmentReturnSlipEntity,
  MaintenanceReturnSlipEntity,
  MaintenanceSlipEntity,
  PartnerEntity,
  RackEntity,
  UserEntity,
} from '@entities';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(UserEntity)
    private readonly userRepo: typeof UserEntity,
    @InjectModel(DeviceEntity)
    private readonly deviceRepo: typeof DeviceEntity,
    @InjectModel(DeviceTypeEntity)
    private readonly deviceTypeRepo: typeof DeviceTypeEntity,
    @InjectModel(DeviceLocationEntity)
    private readonly deviceLocationRepo: typeof DeviceLocationEntity,
    @InjectModel(PartnerEntity)
    private readonly partnerRepo: typeof PartnerEntity,
    @InjectModel(RackEntity)
    private readonly rackRepo: typeof RackEntity,
    @InjectModel(EquipmentLoanSlipEntity)
    private readonly loanSlipRepo: typeof EquipmentLoanSlipEntity,
    @InjectModel(EquipmentReturnSlipEntity)
    private readonly returnSlipRepo: typeof EquipmentReturnSlipEntity,
    @InjectModel(MaintenanceSlipEntity)
    private readonly maintenanceSlipRepo: typeof MaintenanceSlipEntity,
    @InjectModel(MaintenanceReturnSlipEntity)
    private readonly maintenanceReturnSlipRepo: typeof MaintenanceReturnSlipEntity,
    @InjectModel(AuditLogsEntity)
    private readonly auditLogRepo: typeof AuditLogsEntity,
  ) {}

  async getDashboardStats(): Promise<DashboardResponseDto> {
    // Execute all count queries in parallel
    const [
      usersCount,
      devicesCount,
      deviceTypesCount,
      deviceLocationsCount,
      partnersCount,
      racksCount,
      loanSlipsCount,
      returnSlipsCount,
      maintenanceSlipsCount,
      maintenanceReturnSlipsCount,
      activeDevicesCount,
      devicesInMaintenanceCount,
      devicesOnLoanCount,
      pendingLoanSlipsCount,
      pendingMaintenanceSlipsCount,
    ] = await Promise.all([
      this.userRepo.count(),
      this.deviceRepo.count(),
      this.deviceTypeRepo.count(),
      this.deviceLocationRepo.count(),
      this.partnerRepo.count(),
      this.rackRepo.count(),
      this.loanSlipRepo.count(),
      this.returnSlipRepo.count(),
      this.maintenanceSlipRepo.count(),
      this.maintenanceReturnSlipRepo.count(),
      this.deviceRepo.count({
        where: { status: EDeviceStatus.AVAILABLE },
      }),
      this.deviceRepo.count({
        where: { status: EDeviceStatus.MAINTENANCE },
      }),
      this.deviceRepo.count({
        where: { status: EDeviceStatus.ON_LOAN },
      }),
      this.loanSlipRepo.count({
        where: {
          status: {
            [Op.in]: [
              EEquipmentLoanSlipStatus.BORROWING,
              EEquipmentLoanSlipStatus.PARTIAL_RETURNED,
            ],
          },
        },
      }),
      this.maintenanceSlipRepo.count({
        where: {
          status: {
            [Op.in]: [
              EMaintenanceSlipStatus.SENDING,
              EMaintenanceSlipStatus.PARTIAL_RETURNED,
            ],
          },
        },
      }),
    ]);

    const counts: DashboardCountsDto = {
      users: usersCount,
      devices: devicesCount,
      deviceTypes: deviceTypesCount,
      deviceLocations: deviceLocationsCount,
      partners: partnersCount,
      racks: racksCount,
      loanSlips: loanSlipsCount,
      returnSlips: returnSlipsCount,
      maintenanceSlips: maintenanceSlipsCount,
      maintenanceReturnSlips: maintenanceReturnSlipsCount,
      activeDevices: activeDevicesCount,
      devicesInMaintenance: devicesInMaintenanceCount,
      devicesOnLoan: devicesOnLoanCount,
      pendingLoanSlips: pendingLoanSlipsCount,
      pendingMaintenanceSlips: pendingMaintenanceSlipsCount,
    };

    return { counts };
  }

  private formatAuditMessage(log: AuditLogsEntity): string {
    const action = log.action || 'action';
    const entity = log.actorName || 'entity';
    const user = 'User';

    switch (action.toLowerCase()) {
      case 'create':
        return `${user} created a new ${entity}`;
      case 'update':
        return `${user} updated ${entity}`;
      case 'delete':
        return `${user} deleted ${entity}`;
      case 'login':
        return `${user} logged in`;
      case 'logout':
        return `${user} logged out`;
      default:
        return `${user} performed ${action} on ${entity}`;
    }
  }
}
