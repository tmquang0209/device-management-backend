import { buildSequelizeQuery } from '@common/utils';
import {
  CreateRoleDto,
  RoleListRequestDto,
  RoleListResponseDto,
  UpdateRoleDto,
} from '@dto';
import { PermissionEntity, RoleEntity, RolePermissionsEntity } from '@entities';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { I18nService } from 'nestjs-i18n';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { AuditContextService } from './audit-context.service';
import { CacheService } from './cache.service';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  constructor(
    @InjectModel(RoleEntity) private readonly roleRepo: typeof RoleEntity,
    @InjectModel(PermissionEntity)
    private readonly permissionRepo: typeof PermissionEntity,
    @InjectModel(RolePermissionsEntity)
    private readonly rolePermissionsRepo: typeof RolePermissionsEntity,
    private readonly sequelize: Sequelize,
    private readonly i18n: I18nService,
    private readonly cacheService: CacheService,
    private readonly auditContext: AuditContextService,
  ) {}

  async findById(id: string) {
    const role = await this.roleRepo.findOne({
      where: { id },
      include: [
        {
          model: PermissionEntity,
          as: 'permissions',
          attributes: ['id', 'key', 'endpoint'],
          through: { attributes: [] },
        },
      ],
      attributes: [
        'id',
        'code',
        'name',
        'description',
        'isDefault',
        'createdAt',
        'updatedAt',
      ],
    });
    return role;
  }

  private async changeDefaultRole(newDefaultRoleId: string, t: Transaction) {
    await this.roleRepo.update(
      { isDefault: false },
      { where: {}, transaction: t },
    );
    await this.roleRepo.update(
      { isDefault: true },
      { where: { id: newDefaultRoleId }, transaction: t },
    );
  }

  async findAll(params: RoleListRequestDto): Promise<RoleListResponseDto> {
    const { page, pageSize, sortBy, orderBy, ...filters } = params;
    const options = buildSequelizeQuery<RoleEntity>(
      {
        page,
        pageSize,
        sortBy,
        sortOrder: orderBy,
        filters,
        include: [
          {
            model: PermissionEntity,
            as: 'permissions',
            attributes: ['id', 'key', 'endpoint'],
            through: { attributes: [] },
          },
        ],
        distinct: true,
      },
      RoleEntity,
    );
    const { rows, count } = await this.roleRepo.findAndCountAll(options);
    return {
      data: rows,
      total: count,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
    };
  }

  async create(params: CreateRoleDto) {
    const { permissions, ...roleInfo } = params;
    const t = await this.sequelize.transaction();
    try {
      this.auditContext.setAuditBefore({});
      const role = await this.roleRepo.create(roleInfo as RoleEntity, {
        transaction: t,
      });
      if (permissions) {
        const foundPermissions = await this.permissionRepo.findAll({
          where: { id: permissions },
        });

        if (foundPermissions.length > 0) {
          const rolePermissions = foundPermissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id,
          }));
          await this.rolePermissionsRepo.bulkCreate(
            rolePermissions as RolePermissionsEntity[],
            { ignoreDuplicates: true, transaction: t },
          );
        }
      }

      if (role.isDefault) {
        await this.changeDefaultRole(role.id, t);
      }
      await t.commit();
      await this.cacheService.delByPattern('*roles*');
      this.auditContext.setAuditAfter(role);
      return this.findById(role.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async update(params: UpdateRoleDto) {
    const { permissions, ...roleInfo } = params;
    const role = await this.roleRepo.findByPk(roleInfo.id);
    if (!role) throw new NotFoundException(this.i18n.t('role.role_not_found'));
    const t = await this.sequelize.transaction();
    try {
      this.auditContext.setAuditBefore(role);
      delete roleInfo.code; // prevent update code
      const updatedRole = await role.update(roleInfo as RoleEntity, {
        transaction: t,
      });
      if (permissions) {
        // Remove permissions not in the new list
        const deleted = await this.rolePermissionsRepo.destroy({
          where: {
            roleId: role.id,
            permissionId: { [Op.notIn]: permissions },
          },
          transaction: t,
        });
        this.logger.debug(`Deleted ${deleted} role permissions`);

        // Find existing permissions for the role
        const existingRolePermissions = await this.rolePermissionsRepo.findAll({
          where: { roleId: role.id },
          attributes: ['permissionId'],
          transaction: t,
        });
        const existingPermissionIds = existingRolePermissions.map(
          (rp) => rp.permissionId,
        );

        // Find permissions to add (not already assigned)
        const newPermissionIds = permissions.filter(
          (pid) => !existingPermissionIds.includes(pid),
        );

        if (newPermissionIds.length > 0) {
          const mappedNewPermissions = newPermissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          }));
          const created = await this.rolePermissionsRepo.bulkCreate(
            mappedNewPermissions as RolePermissionsEntity[],
            { ignoreDuplicates: true, transaction: t },
          );
          this.logger.debug(`Created ${created.length} new role permissions`);
        }
      }

      if (roleInfo.isDefault) {
        await this.changeDefaultRole(roleInfo.id, t);
      }
      await t.commit();
      await this.cacheService.delByPattern('*roles*');
      const data = await this.findById(updatedRole.id);
      this.auditContext.setAuditAfter(data as RoleEntity);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async delete(id: string) {
    const role = await this.roleRepo.findByPk(id);
    if (!role) throw new NotFoundException(this.i18n.t('role.role_not_found'));
    const t = await this.sequelize.transaction();
    try {
      this.auditContext.setAuditBefore(role);
      if (role.isDefault) {
        throw new ConflictException(this.i18n.t('role.cannot_delete_default'));
      }
      const deleted = await role.destroy({ transaction: t });
      await t.commit();
      await this.cacheService.delByPattern('*roles*');
      this.auditContext.setAuditAfter({});
      return deleted;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  async getPermissions() {
    const permissions = await this.permissionRepo.findAll({
      attributes: {
        exclude: ['createdAt', 'updatedAt', 'deletedAt'],
      },
    });
    return permissions;
  }
}
