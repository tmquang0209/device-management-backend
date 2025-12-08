import { BaseEntity } from '@common/database';
import { RoleEntity, RolePermissionsEntity } from '@entities';
import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Table,
} from 'sequelize-typescript';

@Table({ tableName: 'permissions', timestamps: true })
export class PermissionEntity extends BaseEntity<PermissionEntity> {
  @Column({ type: DataType.STRING(255), allowNull: true })
  declare key: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare endpoint: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isPublic: boolean;

  @Column({ type: DataType.STRING(10), allowNull: false })
  declare method: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  declare controller: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: true,
  })
  declare description: string;

  @HasMany(() => RolePermissionsEntity, {
    foreignKey: 'permissionId',
    sourceKey: 'id',
  })
  rolePermissions: RolePermissionsEntity[];

  @BelongsToMany(() => RoleEntity, {
    through: () => RolePermissionsEntity,
    foreignKey: 'permissionId',
    otherKey: 'roleId',
  })
  roles: RoleEntity[];
}
