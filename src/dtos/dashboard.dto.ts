import { ApiProperty } from '@nestjs/swagger';

export class DashboardCountsDto {
  @ApiProperty({ description: 'Total number of users' })
  users: number;

  @ApiProperty({ description: 'Total number of devices' })
  devices: number;

  @ApiProperty({ description: 'Total number of device types' })
  deviceTypes: number;

  @ApiProperty({ description: 'Total number of device locations' })
  deviceLocations: number;

  @ApiProperty({ description: 'Total number of partners' })
  partners: number;

  @ApiProperty({ description: 'Total number of racks' })
  racks: number;

  @ApiProperty({ description: 'Total number of loan slips' })
  loanSlips: number;

  @ApiProperty({ description: 'Total number of return slips' })
  returnSlips: number;

  @ApiProperty({ description: 'Total number of maintenance slips' })
  maintenanceSlips: number;

  @ApiProperty({ description: 'Total number of maintenance return slips' })
  maintenanceReturnSlips: number;

  @ApiProperty({ description: 'Number of active devices' })
  activeDevices: number;

  @ApiProperty({ description: 'Number of devices in maintenance' })
  devicesInMaintenance: number;

  @ApiProperty({ description: 'Number of devices on loan' })
  devicesOnLoan: number;

  @ApiProperty({ description: 'Number of pending loan slips' })
  pendingLoanSlips: number;

  @ApiProperty({ description: 'Number of pending maintenance slips' })
  pendingMaintenanceSlips: number;
}

export class RecentActivityDto {
  @ApiProperty({ description: 'Activity ID' })
  id: string;

  @ApiProperty({ description: 'Activity type' })
  type: string;

  @ApiProperty({ description: 'Activity message' })
  message: string;

  @ApiProperty({ description: 'Activity timestamp' })
  date: string;

  @ApiProperty({
    description: 'User who performed the activity',
    required: false,
  })
  user?: string;
}

export class DashboardResponseDto {
  @ApiProperty({ description: 'Dashboard statistics counts' })
  counts: DashboardCountsDto;

  @ApiProperty({ description: 'Recent activities', type: [RecentActivityDto] })
  recent: RecentActivityDto[];
}
