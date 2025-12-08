import { BasicInfoDto } from '@dto';
import { UserEntity } from '@entities';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  async (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const decoded = request?.user;
    if (!decoded?.sub) return null;

    const user = await UserEntity.findOne({
      where: { id: decoded.sub },
      attributes: ['id', 'name', 'userName', 'email', 'roleType', 'status'],
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      userName: user.userName,
      email: user.email,
      roleType: user.roleType,
      status: user.status,
    } as unknown as BasicInfoDto;
  },
);
