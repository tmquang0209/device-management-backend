import { BasicInfoDto } from '@dto';
import { PermissionEntity, RoleEntity, UserEntity } from '@entities';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  async (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const decoded = request?.user;
    if (!decoded?.sub) return null;

    const user = await UserEntity.findOne({
      where: { id: decoded.sub },
      attributes: [
        'id',
        'fullName',
        'email',
        'phoneNumber',
        'birthday',
        'status',
      ],
      include: [
        {
          model: RoleEntity,
          attributes: ['id', 'code', 'name'],
          include: [
            {
              required: false,
              model: PermissionEntity,
              attributes: ['id', 'key', 'endpoint'],
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) return null;

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      birthday: user.birthday,
      status: user.status,
      role: user.role && {
        id: user.role.id,
        name: user.role.name,
        code: user.role.code,
        permissions: user.role.permissions?.map((p) => ({
          id: p.id,
          key: p.key,
          endpoint: p.endpoint,
        })),
      },
    } as BasicInfoDto;
  },
);
