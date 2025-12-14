import { EndpointKey, ResponseMessage } from '@common/decorators';
import { DashboardResponseDto } from '@dto';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from '@services';
import { i18nValidationMessage } from 'nestjs-i18n';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @EndpointKey('dashboard.get_stats')
  @Get()
  @ApiOperation({ summary: 'Get dashboard statistics and recent activities' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardResponseDto,
  })
  @ResponseMessage(i18nValidationMessage('dashboard.stats.success'))
  async getDashboardStats(): Promise<DashboardResponseDto> {
    return this.dashboardService.getDashboardStats();
  }
}
