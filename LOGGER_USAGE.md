# InCloud Web Logger Usage Guide

## Overview
The InCloud Web application now has comprehensive terminal logging to track all operations, data fetching, and API calls.

## Logger Features

### Log Levels
- **DEBUG** 🔍 - Development-only detailed information
- **INFO** 📋 - General information about operations
- **SUCCESS** ✅ - Successful operation completion
- **WARN** ⚠️ - Warning messages
- **ERROR** ❌ - Error messages with stack traces
- **FATAL** 💀 - Critical errors (always logged, even in production)

### Special Logging Methods
- **db()** 💾 - Database operations
- **api()** 🌐 - API route requests
- **fetch()** 🔄 - Data fetching operations
- **time() / timeEnd()** ⏱️ - Performance timing

## Usage Examples

### Basic Logging
```typescript
import { logger } from '@/lib/logger'

// Info message
logger.info('Processing order')

// Success message
logger.success('Order processed successfully')

// Warning
logger.warn('Stock level low')

// Error with error object
logger.error('Failed to process order', error)
```

### Child Logger (Preset Context)
```typescript
// Create a child logger with default context
const serviceLogger = logger.child({
  service: 'DashboardService',
  operation: 'getDashboardMetrics'
})

// All logs from this logger will include the preset context
serviceLogger.info('Fetching metrics')  // Automatically includes service + operation
serviceLogger.success('Metrics fetched')
```

### Performance Timing
```typescript
// Start a timer
logger.time('database-query')

// ... perform operation ...

// End timer and log duration
const duration = logger.timeEnd('database-query')
// Output: ⏱️  Timer ended: database-query - 245ms
```

### Database Operations
```typescript
// Log database queries
logger.db('SELECT', 'products')
logger.db('INSERT', 'orders')
logger.db('UPDATE', 'inventory')

// Output: 💾 [INFO] Database DB SELECT: products
```

### API Routes
```typescript
// Log API requests
logger.api('POST', '/api/admin/create-user')
logger.api('GET', '/api/products')

// Output: 🌐 [INFO] API POST /api/admin/create-user
```

### Data Fetching
```typescript
// Log data fetching
logger.fetch('Fetching dashboard metrics')
logger.fetch('Loading product inventory')

// Output: 🔄 [INFO] DataFetch Fetching dashboard metrics
```

## Example Terminal Output

When you run your application, you'll see colored output like this:

```
[14:23:45] 🌐 [INFO] API POST /api/admin/create-user
[14:23:45] 📋 [INFO] DashboardService (getDashboardMetrics) Fetching comprehensive dashboard metrics
[14:23:45] 🔄 [INFO] DashboardService (getDashboardMetrics) Fetching current metrics
[14:23:45] 💾 [INFO] Database DB SELECT: products
[14:23:45] 💾 [INFO] Database DB SELECT: orders
[14:23:45] ⏱️  Timer ended: getDashboardMetrics - 245ms
[14:23:45] ✅ [SUCCESS] DashboardService Dashboard metrics fetched successfully
  └─ Duration: 245ms
[14:23:46] ❌ [ERROR] API Failed to create user
  └─ Error: Invalid email format
```

## Integration Examples

### Service Layer (dashboardService.ts)
```typescript
static async getDashboardMetrics(): Promise<DashboardMetrics> {
  const serviceLogger = logger.child({
    service: 'DashboardService',
    operation: 'getDashboardMetrics'
  })
  serviceLogger.time('getDashboardMetrics')

  try {
    serviceLogger.info('Fetching comprehensive dashboard metrics')

    const branchId = await getMainBranchId()
    serviceLogger.debug('Retrieved branch ID', { branchId })

    serviceLogger.fetch('Fetching current metrics')
    const currentMetrics = await this.getCurrentMetrics(branchId)

    const duration = serviceLogger.timeEnd('getDashboardMetrics')
    serviceLogger.success('Dashboard metrics fetched successfully', {
      duration,
      totalProducts: result.totalProducts
    })

    return result
  } catch (error) {
    serviceLogger.error('Failed to fetch dashboard metrics', error as Error)
    throw error
  }
}
```

### API Route (create-user/route.ts)
```typescript
export async function POST(request: NextRequest) {
  const apiLogger = logger.child({
    service: 'API',
    operation: 'POST /api/admin/create-user'
  })
  apiLogger.time('create-user')

  try {
    apiLogger.api('POST', '/api/admin/create-user')
    apiLogger.info('Validating super admin permissions')

    // ... operation logic ...

    const duration = apiLogger.timeEnd('create-user')
    apiLogger.success('Admin user created successfully', {
      duration,
      adminId: result.admin_id,
      email,
      role
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    apiLogger.error('Unexpected error in create-user API', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

## Advanced Features

### Log Grouping (Development Only)
```typescript
logger.group('Processing Batch Import')
logger.info('Step 1: Validating data')
logger.info('Step 2: Creating records')
logger.info('Step 3: Updating inventory')
logger.groupEnd()
```

### Separator Lines (Development Only)
```typescript
logger.separator('Order Processing')
// ... logs ...
logger.separator()
```

### Debug Logging (Development Only)
```typescript
// Only shows in development (NODE_ENV !== 'production')
logger.debug('Detailed debug information', {
  userId: '123',
  requestData: data
})
```

## Configuration

The logger automatically detects the environment:
- **Development**: Shows all log levels, detailed context, colorful output
- **Production**: Hides DEBUG logs, shows essential logs only

## Files Modified

### New Files Created
- `src/lib/logger.ts` - Core logger utility

### Services Updated (with logging)
- `src/lib/services/dashboardService.ts`
- `src/lib/services/analyticsService.ts`

### API Routes Updated (with logging)
- `src/app/api/admin/create-user/route.ts`

## Next Steps

To add logging to additional files:

1. Import the logger:
   ```typescript
   import { logger } from '@/lib/logger'
   ```

2. Create a child logger with context:
   ```typescript
   const serviceLogger = logger.child({
     service: 'YourService',
     operation: 'yourOperation'
   })
   ```

3. Add logging to key operations:
   - Start: `serviceLogger.info('Starting operation')`
   - Timing: `serviceLogger.time('operation')` and `serviceLogger.timeEnd('operation')`
   - Success: `serviceLogger.success('Operation completed')`
   - Errors: `serviceLogger.error('Operation failed', error)`

## Benefits

✅ **Complete Visibility** - See exactly what's happening in your application
✅ **Performance Tracking** - Identify slow operations with timing logs
✅ **Easy Debugging** - Rich context helps troubleshoot issues faster
✅ **Production Ready** - Automatic log level filtering for production
✅ **Color-Coded** - Easy to scan and identify issues in terminal
✅ **Contextual** - Every log includes service, operation, and custom context

## Color Guide

- 🔍 DEBUG - Gray (dev only)
- 📋 INFO - Blue
- ✅ SUCCESS - Green
- ⚠️ WARN - Yellow
- ❌ ERROR - Red
- 💀 FATAL - Bright Red
- 💾 DB - Blue
- 🌐 API - Blue
- 🔄 FETCH - Blue
- ⏱️ TIME - Green/Yellow/Red based on duration
