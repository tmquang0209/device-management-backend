import { sanitizeSequelize } from '@common/utils';
import { Injectable } from '@nestjs/common';
import { cloneDeep } from 'lodash';
import { ClsService } from 'nestjs-cls';
import { Model } from 'sequelize';

@Injectable()
export class AuditContextService {
  constructor(private readonly cls: ClsService) {}

  /**
   * Set the "before" state for audit diff tracking
   * Call this before making changes to capture the initial state
   */
  setAuditBefore(data: object): void {
    const beforeState = data instanceof Model ? sanitizeSequelize(data) : data;
    this.cls.set('auditBefore', cloneDeep(beforeState));
  }

  /**
   * Set the "after" state for audit diff tracking
   * Call this after making changes to capture the final state
   */
  setAuditAfter(data: object): void {
    const afterState = data instanceof Model ? sanitizeSequelize(data) : data;
    this.cls.set('auditAfter', cloneDeep(afterState));
  }

  /**
   * Get the "before" state from the current context
   */
  getAuditBefore(): object | undefined {
    return this.cls.get('auditBefore');
  }

  /**
   * Get the "after" state from the current context
   */
  getAuditAfter(): object | undefined {
    return this.cls.get('auditAfter');
  }

  /**
   * Clear audit states from the current context
   */
  clearAuditStates(): void {
    this.cls.set('auditBefore', undefined);
    this.cls.set('auditAfter', undefined);
  }

  /**
   * Set both before and after states in one call
   * Useful when you have both states available
   */
  setAuditStates(before: object | undefined, after: object | undefined): void {
    if (before !== undefined) {
      this.setAuditBefore(before);
    }
    if (after !== undefined) {
      this.setAuditAfter(after);
    }
  }
}
