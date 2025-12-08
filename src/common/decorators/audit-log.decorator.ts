import { AUDIT_META_KEY } from '@common/enums';
import { AuditMeta } from '@dto';
import { SetMetadata } from '@nestjs/common';

export const Audit = (meta: AuditMeta) => SetMetadata(AUDIT_META_KEY, meta);
