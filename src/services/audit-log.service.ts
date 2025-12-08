import { buildSequelizeQuery } from '@common/utils';
import {
  AuditLogsListRequestDto,
  AuditLogsListResponseDto,
  CreateAuditLog,
} from '@dto';
import { AuditLogsEntity } from '@entities';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectModel(AuditLogsEntity)
    private readonly auditRepo: typeof AuditLogsEntity,
  ) {}

  private allowAuditHeaders(headers: Record<string, any> = {}) {
    const h: Record<string, string> = {};
    for (const k of Object.keys(headers || {})) {
      h[k.toLowerCase()] = String(headers[k]);
    }
    const kept: Record<string, string> = {};
    if (h['x-request-id']) kept['x-request-id'] = h['x-request-id'];
    if (h['x-correlation-id']) kept['x-correlation-id'] = h['x-correlation-id'];
    if (h['user-agent']) kept['user-agent'] = h['user-agent'];
    if (h['referer']) kept['referer'] = h['referer'];
    if (h['origin']) kept['origin'] = h['origin'];
    if (h['x-lang']) kept['x-lang'] = h['x-lang'];
    if (h['accept-language']) kept['accept-language'] = h['accept-language'];
    return kept;
  }

  async create(data: CreateAuditLog) {
    try {
      if (data.requestSnapshot) {
        data.requestSnapshot.headers = this.allowAuditHeaders(
          data.requestSnapshot.headers,
        );
      }

      return await this.auditRepo.create(data as AuditLogsEntity);
    } catch (e) {
      this.logger.error('Failed to write audit log', e.stack || e);
    }
  }

  async findById(params: { id: string }) {
    return this.auditRepo.findByPk(params.id);
  }

  async findAll(
    params: AuditLogsListRequestDto,
  ): Promise<AuditLogsListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<AuditLogsEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        subQuery: false,
      },
      AuditLogsEntity,
    );

    const { rows, count } = await this.auditRepo.findAndCountAll(options);

    return {
      data: rows,
      total: count,
      page: params.page,
      pageSize: params.pageSize,
    };
  }
}
