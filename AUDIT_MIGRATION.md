# Audit System Migration to nest-cls

This document describes the migration from using `req.auditBefore` and `req.auditAfter` to using `nest-cls` for audit context management.

## Changes Made

### 1. Updated Audit Interceptor
- **File**: `src/common/interceptor/audit.interceptor.ts`
- **Changes**:
  - Added `ClsService` dependency injection
  - Replaced `req.auditBefore` with `this.cls.get('auditBefore')`
  - Replaced `req.auditAfter` with `this.cls.get('auditAfter')`
  - Removed audit properties from request type definition

### 2. Added Audit Context Service
- **File**: `src/services/audit-context.service.ts`
- **Purpose**: Provides a clean API for setting and getting audit states
- **Methods**:
  - `setAuditBefore(data: object)`: Set the "before" state
  - `setAuditAfter(data: object)`: Set the "after" state
  - `getAuditBefore()`: Get the "before" state
  - `getAuditAfter()`: Get the "after" state
  - `clearAuditStates()`: Clear both states
  - `setAuditStates(before, after)`: Set both states at once

### 3. Updated App Module
- **File**: `src/app.module.ts`
- **Changes**:
  - Added `ClsService` to AuditLogInterceptor factory injection
  - Added `AuditContextService` to providers
  - ClsModule was already configured

### 4. Explained Usage
- **action**: `update`, `delete`, `create`, etc.
- **resourceType**: Type of resource being audited (e.g., 'User', 'Order')
- **resourceIdParam**: Parameter name in route to extract resource ID
- **captureDiff**: Boolean to enable diff tracking between before and after states

## Migration Guide

### Before (Old Approach)
```typescript
@Put(':id')
@Audit({
  action: 'update',
  resourceType: 'User',
  resourceIdParam: 'id',
  captureDiff: true,
})
async updateUser(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
  // Old way - directly manipulating request object
  const userBefore = await this.userService.findById(id);
  req.auditBefore = userBefore;

  const updatedUser = await this.userService.update(id, updateData);
  req.auditAfter = updatedUser;

  return updatedUser;
}
```

### After (New Approach)
```typescript
@Put(':id')
@Audit({
  action: 'update',
  resourceType: 'User',
  resourceIdParam: 'id',
  captureDiff: true,
})
async updateUser(@Param('id') id: string, @Body() updateData: any) {
  // New way - using AuditContextService
  const userBefore = await this.userService.findById(id);
  this.auditContext.setAuditBefore(userBefore);

  const updatedUser = await this.userService.update(id, updateData);
  this.auditContext.setAuditAfter(updatedUser);

  return updatedUser;
}
```

## Benefits of nest-cls Approach

1. **Better Separation of Concerns**: Audit logic is separated from HTTP request handling
2. **Type Safety**: No need to extend request types with audit properties
3. **Cleaner Code**: Controllers don't need to import Request types
4. **Context Isolation**: Each request gets its own isolated context
5. **Better Testing**: Easier to mock and test audit functionality
6. **Framework Agnostic**: Works with any execution context, not just HTTP

## Usage Instructions

1. **Inject AuditContextService** in your controllers:
   ```typescript
   constructor(
     private readonly auditContext: AuditContextService,
     // ... other services
   ) {}
   ```

2. **Set audit states** in your methods:
   ```typescript
   // Before making changes
   this.auditContext.setAuditBefore(originalData);

   // After making changes
   this.auditContext.setAuditAfter(modifiedData);
   ```

3. **Use @Audit decorator** with `captureDiff: true`:
   ```typescript
   @Audit({
     action: 'update',
     resourceType: 'YourResource',
     captureDiff: true, // This enables diff tracking
   })
   ```

## Notes

- The ClsModule is already configured globally in the application
- The audit interceptor will automatically capture the diff if both before/after states are set
- You can clear audit states manually if needed using `clearAuditStates()`
- The context is automatically isolated per request - no cross-request contamination