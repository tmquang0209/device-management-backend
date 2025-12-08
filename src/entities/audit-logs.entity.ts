import { BaseEntity } from '@common/database';
import { Column, DataType, ForeignKey, Table } from 'sequelize-typescript';
import { UserEntity } from './user.entity';

@Table({
  tableName: 'audit_logs',
  timestamps: true,
})
export class AuditLogsEntity extends BaseEntity<AuditLogsEntity> {
  @ForeignKey(() => UserEntity)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare tenantId?: string;

  @Column({ type: DataType.STRING(32), allowNull: false })
  declare actorType: string;

  @Column(DataType.STRING(64))
  declare actorId?: string | null;

  @Column(DataType.STRING(255))
  declare actorName?: string | null;

  @Column({ type: DataType.STRING(64), allowNull: false })
  declare resourceType: string;

  @Column(DataType.STRING(128))
  declare resourceId?: string | null;

  @Column({ type: DataType.STRING(32), allowNull: false })
  declare action: string;

  @Column({ type: DataType.STRING(16), allowNull: false })
  declare status: 'success' | 'failure';

  @Column(DataType.STRING(512))
  declare reason?: string | null;

  @Column(DataType.STRING(64))
  declare requestId?: string | null;

  @Column(DataType.STRING(64))
  declare correlationId?: string | null;

  @Column(DataType.STRING(45))
  declare ip?: string | null;

  @Column(DataType.STRING(512))
  declare userAgent?: string | null;

  @Column(DataType.STRING(32))
  declare origin?: string | null;

  @Column(DataType.INTEGER)
  declare latencyMs?: number | null;

  @Column(DataType.JSON)
  declare diffJson?: any;

  @Column(DataType.JSON)
  declare requestSnapshot?: {
    params?: Record<string, any>;
    query?: Record<string, any>;
    body?: Record<string, any>;
    headers?: Record<string, string>;
  } | null;
}
