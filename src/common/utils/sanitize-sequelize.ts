import {
  fromPairs,
  isArray,
  isDate,
  isPlainObject,
  map,
  sortBy,
  transform,
} from 'lodash';
import type { Model } from 'sequelize';

export type SanitizeOptions = {
  /** Fields to remove. Default: createdAt, updatedAt, deletedAt */
  exclude?: string[];
  /** If set, only keep these fields (applies at the current object level). */
  include?: string[];
  /** Drop fields whose value === null. */
  dropNull?: boolean;
  /** Drop fields whose value === undefined. Default: true */
  dropUndefined?: boolean;
  /** Drop empty objects/arrays after processing. */
  dropEmpty?: boolean;
  /** Convert Date to ISO string. Default: true */
  stringifyDates?: boolean;
  /** Convert Buffer to base64/hex. Set false to keep Buffer. Default: base64 */
  bufferEncoding?: 'base64' | 'hex' | false;
  /** Alphabetically sort keys for stable diffs. Default: true */
  sortKeys?: boolean;
};

const DEFAULT_EXCLUDE = ['createdAt', 'updatedAt', 'deletedAt'];

/** Heuristic: detect a Sequelize Model instance (has .get and internal options). */
const isSequelizeModel = (v: any): v is Model =>
  !!v &&
  typeof v?.get === 'function' &&
  ('_options' in v || '_modelOptions' in v);

/** Decide whether to drop a value based on null/undefined policy. */
const shouldDrop = (v: any, opts: SanitizeOptions) =>
  (opts.dropUndefined !== false && v === undefined) ||
  (opts.dropNull && v === null);

/** Normalize scalars so diffs are deterministic across environments. */
const normalizeScalar = (v: any, opts: SanitizeOptions) => {
  // Dates ⇒ ISO strings (or keep if disabled)
  if (isDate(v)) return opts.stringifyDates === false ? v : v.toISOString();

  // Buffers ⇒ base64/hex (or keep Buffer if disabled)
  if (Buffer.isBuffer(v)) {
    if (!opts.bufferEncoding) return v;
    return v.toString(opts.bufferEncoding);
  }

  // BigInt ⇒ string
  if (typeof v === 'bigint') return v.toString();

  // Popular numeric wrappers (Decimal.js/BigNumber) ⇒ string
  if (v && typeof v === 'object' && typeof v.toString === 'function') {
    const name = v.constructor?.name;
    if (name === 'Decimal' || name === 'BigNumber') return v.toString();
  }

  return v;
};

/** Return a new object with keys sorted alphabetically. */
const sortObjectKeys = (obj: Record<string, any>) =>
  fromPairs(sortBy(Object.entries(obj), ([k]) => k));

/**
 * Remove Sequelize noise & internal/meta fields, producing a clean JSON-ready value
 * ideal for diffing (e.g., deep-equal or text diff).
 *
 * Handles:
 * - Model instances (uses .get({plain:true}))
 * - Arrays & nested associations
 * - Drop internal keys (_*, $*)
 * - include/exclude filtering
 * - Normalize Date/Buffer/BigInt/Decimal
 * - Optional empty node removal and stable key ordering
 */
export function sanitizeSequelize<T = unknown>(
  input: any,
  options: SanitizeOptions = {},
): T {
  // Merge defaults
  const opts: SanitizeOptions = {
    exclude: DEFAULT_EXCLUDE,
    dropUndefined: true,
    stringifyDates: true,
    bufferEncoding: 'base64',
    sortKeys: true,
    ...options,
  };

  // DFS visitor
  const visit = (val: any): any => {
    if (val == null) return val;

    // Sequelize Model ⇒ plain object
    if (isSequelizeModel(val)) return visit(val.get({ plain: true }));

    // Arrays: visit each element; optionally drop empty arrays
    if (isArray(val)) {
      const arr = map(val, visit).filter((x) => !shouldDrop(x, opts));
      return opts.dropEmpty && arr.length === 0 ? undefined : arr;
    }

    // Plain objects: filter keys then visit children
    if (isPlainObject(val)) {
      // Remove internal/private keys (start with _ or $)
      const keys = Object.keys(val as Record<string, any>).filter(
        (k) => !k.startsWith('_') && !k.startsWith('$'),
      );

      // Apply include/exclude at this depth
      const kept = opts.include
        ? keys.filter((k) => opts.include!.includes(k))
        : keys.filter((k) => !opts.exclude!.includes(k));

      // Build sanitized object
      const out = transform(
        kept,
        (acc, k) => {
          const child = visit(val[k]);
          if (shouldDrop(child, opts)) return;

          // Optionally drop empty arrays/objects
          if (opts.dropEmpty) {
            if (isArray(child) && child.length === 0) return;
            if (
              isPlainObject(child) &&
              Object.keys(child as Record<string, any>).length === 0
            ) {
              return;
            }
          }
          (acc as any)[k] = child;
        },
        {} as Record<string, any>,
      );

      // Stable key ordering for predictable diffs
      return opts.sortKeys ? sortObjectKeys(out) : out;
    }

    // Scalars & special numerics
    return normalizeScalar(val, opts);
  };

  const result = visit(input);
  // If root becomes undefined due to dropping, return null for safety
  return (result === undefined ? null : result) as T;
}

/** Stable stringify (keys already sorted above). */
export const stableStringify = (value: any) => JSON.stringify(value);
