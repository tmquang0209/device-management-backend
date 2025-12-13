import * as dayjs from 'dayjs';
import {
  FindAndCountOptions,
  IncludeOptions,
  Model,
  Op,
  Order,
  WhereOptions,
} from 'sequelize';

interface QueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
  include?: Array<{
    model: any; // Sequelize model
    as?: string;
    attributes?: string[];
    filters?: Record<string, any>;
    required?: boolean;
    include?: QueryParams['include'];
    through?: Record<string, any>;
  }>;
  exclude?: string[];
  subQuery?: boolean;
  distinct?: boolean;
}

export function buildSequelizeQuery<T extends Model>(
  params: QueryParams,
  baseModel: any, // Sequelize model class
): FindAndCountOptions<T> {
  const {
    page = 1,
    pageSize = 10,
    sortBy = 'createdAt',
    sortOrder = 'DESC',
    filters = {},
    include = [],
  } = params;

  const modelAttributes = Object.keys(baseModel.rawAttributes as object);

  const where: WhereOptions<T> = {};
  for (const key of Object.keys(filters)) {
    if (modelAttributes.includes(key) && filters[key] !== undefined) {
      const keyType = typeof filters[key];
      // Check if it's a UUID field (common UUID field names)
      const isUuidField =
        key.toLowerCase().includes('id') || key.toLowerCase().endsWith('uuid');

      if (keyType === 'string' && !isUuidField) {
        // Use LIKE for text search fields only
        (where as any)[key] = {
          [Op.like]: `%${filters[key]}%`,
        };
      } else if (filters[key] instanceof Date) {
        (where as any)[key] = {
          [Op.between]: [
            dayjs(filters[key]).startOf('day').toDate(),
            dayjs(filters[key]).endOf('day').toDate(),
          ],
        };
      } else {
        // Use exact match for UUIDs, numbers, booleans, etc.
        (where as any)[key] = filters[key];
      }
    }
  }

  const order: Order = modelAttributes.includes(sortBy)
    ? [[sortBy, sortOrder]]
    : [['createdAt', 'DESC']];

  // Pagination
  const limit = pageSize === -1 ? undefined : pageSize;
  const offset = pageSize === -1 ? undefined : (page - 1) * pageSize;

  const buildIncludes = (includes: QueryParams['include']): IncludeOptions[] =>
    (includes ?? []).map((inc) => {
      const incAttrs = Object.keys(inc.model.rawAttributes as object);
      const incWhere: Record<string, any> = {};

      if (inc.filters) {
        for (const f of Object.keys(inc.filters)) {
          if (incAttrs.includes(f) && inc.filters[f] !== undefined) {
            const keyType = typeof inc.filters[f];
            const isUuidField =
              f.toLowerCase().includes('id') ||
              f.toLowerCase().endsWith('uuid');

            if (keyType === 'string' && !isUuidField) {
              // Use LIKE for text search fields
              incWhere[f] = {
                [Op.like]: `%${inc.filters[f]}%`,
              };
            } else {
              incWhere[f] = inc.filters[f];
            }
          }
        }
      }

      return {
        model: inc.model,
        as: inc.as,
        attributes: inc.attributes,
        required: inc.required ?? false,
        where: Object.keys(incWhere).length > 0 ? incWhere : undefined,
        include: buildIncludes(inc.include),
        through: inc.through,
      } as IncludeOptions;
    });

  return {
    where,
    limit,
    offset,
    order,
    include: buildIncludes(include),
    attributes: { exclude: params.exclude || [] },
    subQuery: params.subQuery,
    distinct: params.distinct || true,
  };
}
