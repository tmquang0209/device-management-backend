import { BaseEntity } from '@common/database';
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Table,
} from 'sequelize-typescript';
import { PermissionEntity } from './permission.entity';
import { RoleEntity } from './role.entity';

@Table({ tableName: 'role_permissions', timestamps: false })
export class RolePermissionsEntity extends BaseEntity<RolePermissionsEntity> {
  @ForeignKey(() => RoleEntity)
  @Column({ field: 'role_id', type: DataType.UUID, allowNull: false })
  declare roleId: string;

  @ForeignKey(() => PermissionEntity)
  @Column({ field: 'permission_id', type: DataType.UUID, allowNull: false })
  declare permissionId: string;

  @BelongsTo(() => RoleEntity, {
    foreignKey: 'roleId',
    targetKey: 'id',
  })
  role: RoleEntity;

  @BelongsTo(() => PermissionEntity, {
    foreignKey: 'permissionId',
    targetKey: 'id',
  })
  permission: PermissionEntity;
}
