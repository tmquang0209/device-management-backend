/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ALLOW_UNAUTHORIZED_KEY, ENDPOINT_KEY } from '@common/enums';
import { PermissionEntity } from '@entities';
import {
  Injectable,
  Logger,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer, Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/sequelize';

const RequestMethodMap = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
  [RequestMethod.ALL]: 'ALL',
  [RequestMethod.OPTIONS]: 'OPTIONS',
  [RequestMethod.HEAD]: 'HEAD',
} as const;

type RouteRow = {
  method: string;
  path: string;
  key?: string | null;
  isPublic?: boolean;
  controller?: string;
};

function normalizePath(
  controllerPath?: string | string[],
  methodPath?: string | string[],
) {
  const toArr = (x?: string | string[]) =>
    Array.isArray(x) ? x : x != null ? [x] : [''];
  const cps = toArr(controllerPath);
  const mps = toArr(methodPath);

  const results: string[] = [];
  for (const c of cps) {
    for (const m of mps) {
      const a = ('/' + (c ?? '')).replace(/\/+/g, '/').replace(/\/$/, '');
      const b = ('/' + (m ?? '')).replace(/\/+/g, '/').replace(/\/$/, '');
      const full = (a + b).replace(/\/+/g, '/');
      results.push(full === '' ? '/' : full || '/');
    }
  }
  // unique
  return Array.from(new Set(results));
}

@Injectable()
export class RoutesExplorer implements OnModuleInit {
  private readonly logger = new Logger(RoutesExplorer.name);
  constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly reflector: Reflector,
    @InjectModel(PermissionEntity)
    private readonly permissionRepo: typeof PermissionEntity,
  ) {}

  onModuleInit() {
    // sync permissions with routes in codebase
    void (async () => {
      const existingPermissions = await this.permissionRepo.findAll();
      const routes = this.getAllRoutes();

      // Create a set of current route identifiers (endpoint + method)
      const currentRouteIdentifiers = new Set(
        routes.map((r) => `${r.path}:${r.method}`),
      );

      // Find obsolete permissions to delete
      const permissionsToDelete = existingPermissions.filter(
        (p) => !currentRouteIdentifiers.has(`${p.endpoint}:${p.method}`),
      );

      if (permissionsToDelete.length > 0) {
        const idsToDelete = permissionsToDelete.map((p) => p.id);
        await this.permissionRepo.destroy({
          where: { id: idsToDelete },
        });
        this.logger.log(
          `Deleted ${permissionsToDelete.length} obsolete permissions`,
        );
      }

      // Process each route
      for (const route of routes) {
        const existingPermission = existingPermissions.find(
          (p) => p.endpoint === route.path && p.method === route.method,
        );

        if (existingPermission) {
          // Update existing permission if needed
          const needsUpdate =
            existingPermission.key !== route.key ||
            existingPermission.isPublic !== route.isPublic ||
            existingPermission.controller !== route.controller;

          if (needsUpdate) {
            await this.permissionRepo.update(
              {
                key: route.key ?? undefined,
                isPublic: route.isPublic || false,
                controller: route.controller || 'UnknownController',
                description: `${route.method} ${route.path} - ${route.controller}`,
              },
              {
                where: {
                  endpoint: route.path,
                  method: route.method,
                },
              },
            );
          }
        } else {
          // Create new permission
          await this.permissionRepo.create({
            endpoint: route.path,
            key: route.key || null,
            isPublic: route.isPublic || false,
            method: route.method,
            controller: route.controller || 'UnknownController',
            description: `${route.method} ${route.path} - ${route.controller}`,
          } as PermissionEntity);
        }
      }

      this.logger.log(`Synced ${routes.length} routes with permissions`);
    })();
  }

  getAllRoutes(): RouteRow[] {
    const routes: RouteRow[] = [];

    // iterate over all modules
    this.modulesContainer.forEach((module) => {
      module.controllers.forEach((wrapper) => {
        const controller = wrapper.instance;
        const metatype = wrapper.metatype;

        if (!controller || !metatype) return;

        const controllerPath =
          this.reflector.get<string | string[]>(PATH_METADATA, metatype) ?? '';

        // iterate over all methods in the controller
        Object.getOwnPropertyNames(Object.getPrototypeOf(controller)).forEach(
          (methodName) => {
            if (methodName === 'constructor') return;

            const targetCallback = controller[methodName];
            if (typeof targetCallback !== 'function') return;

            const routePath = this.reflector.get<string | string[]>(
              PATH_METADATA,
              targetCallback,
            );
            const requestMethod = this.reflector.get<number | number[]>(
              METHOD_METADATA,
              targetCallback,
            );

            // Output only if path and method are defined
            if (routePath === undefined || requestMethod === undefined) return;

            const methods = this.getMethods(requestMethod);
            const fullPaths = normalizePath(controllerPath, routePath);

            // get metadata key & public
            const key =
              this.reflector.getAllAndOverride<string | undefined>(
                ENDPOINT_KEY,
                [targetCallback, metatype],
              ) ?? null;

            const isPublic = !!this.reflector.getAllAndOverride<boolean>(
              ALLOW_UNAUTHORIZED_KEY,
              [targetCallback, metatype],
            );

            for (const m of methods) {
              const methodStr = RequestMethodMap[m] || 'UNKNOWN';
              for (const p of fullPaths) {
                routes.push({
                  method: methodStr,
                  path: p,
                  key,
                  isPublic,
                  controller: metatype.name || 'UnknownController',
                });
              }
            }
          },
        );
      });
    });

    routes.sort((a, b) =>
      a.path === b.path
        ? a.method.localeCompare(b.method)
        : a.path.localeCompare(b.path),
    );

    return routes;
  }

  private getMethods(requestMethod: number | number[]): RequestMethod[] {
    return (
      Array.isArray(requestMethod) ? requestMethod : [requestMethod]
    ).filter((m) => m in RequestMethodMap) as RequestMethod[];
  }
}
