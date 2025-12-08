import { BaseEntity } from '@common/database';
import {
  BeforeCreate,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Table,
} from 'sequelize-typescript';
import { PermissionEntity } from './permission.entity';
import { RolePermissionsEntity } from './role-permissions.entity';

@Table({ tableName: 'roles', timestamps: true })
export class RoleEntity extends BaseEntity<RoleEntity> {
  @Column({
    field: 'code',
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  declare code: string;

  @Column({ field: 'name', type: DataType.STRING(255), allowNull: false })
  declare name: string;

  @Column({ field: 'description', type: DataType.STRING(500), allowNull: true })
  declare description: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isDefault: boolean;

  @HasMany(() => RolePermissionsEntity, {
    foreignKey: 'roleId',
    sourceKey: 'id',
  })
  rolePermissions: RolePermissionsEntity[];

  @BelongsToMany(() => PermissionEntity, {
    through: () => RolePermissionsEntity,
    foreignKey: 'roleId',
    otherKey: 'permissionId',
  })
  permissions: PermissionEntity[];

  @BeforeCreate
  static async checkRoleName(role: RoleEntity) {
    const existingRole = await RoleEntity.findOne({
      where: { name: role.name },
    });
    if (existingRole) {
      throw new Error('Role name already exists');
    }
  }
}
