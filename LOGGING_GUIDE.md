# Logging Guide

This project uses a centralized logging system with configurable log levels.

## Log Levels

The logger supports four log levels (from most verbose to least):

- **`debug`**: Detailed debugging information (development only)
- **`info`**: General informational messages
- **`warn`**: Warning messages
- **`error`**: Error messages

## Configuration

### Environment Variable

Set the `LOG_LEVEL` environment variable in your `.env.local` file:

```bash
# Show all logs (debug, info, warn, error)
LOG_LEVEL=debug

# Show info and above (info, warn, error) - recommended for production
LOG_LEVEL=info

# Show only warnings and errors
LOG_LEVEL=warn

# Show only errors
LOG_LEVEL=error
```

### Default Behavior

- **Development** (`NODE_ENV=development`): Defaults to `debug` level
- **Production** (`NODE_ENV=production`): Defaults to `info` level

If `LOG_LEVEL` is not set, the logger automatically chooses based on `NODE_ENV`.

## Usage

### Import the Logger

```typescript
import { logger } from '@/lib/logger';
```

### Basic Logging

```typescript
// Debug level - detailed information (only shown when LOG_LEVEL=debug)
logger.debug('Detailed debug information');
logger.debug('Cookie value:', cookieValue);

// Info level - general information
logger.info('User logged in successfully');
logger.info('Processing order:', orderId);

// Warn level - warnings
logger.warn('Cookie value is not in JWT format');
logger.warn('Fallback authentication method used');

// Error level - errors
logger.error('Authentication failed');
logger.error('Database connection error:', error);
```

### Formatted Sections

For formatted section headers (like the current `═══` style):

```typescript
// Default section (info level)
logger.section('🔐 OAUTH CALLBACK - Processing authentication...');

// Section with specific level
logger.section('❌ OAUTH FAILED - Code exchange error', 'error');
```

## Log Level Examples

### With `LOG_LEVEL=debug` (Development)
```
[2025-01-16T14:10:59.736Z] [DEBUG] 🔍 Setting cookie: sb-xxx-auth-token.1
[2025-01-16T14:10:59.736Z] [DEBUG]   Value length: 843
[2025-01-16T14:10:59.736Z] [INFO] ✅ Step 1: OAuth code exchange successful
[2025-01-16T14:10:59.736Z] [INFO]   📧 User email: user@example.com
[2025-01-16T14:10:59.736Z] [ERROR] ❌ OAUTH FAILED - Code exchange error
```

### With `LOG_LEVEL=info` (Production)
```
[2025-01-16T14:10:59.736Z] [INFO] ✅ Step 1: OAuth code exchange successful
[2025-01-16T14:10:59.736Z] [INFO]   📧 User email: user@example.com
[2025-01-16T14:10:59.736Z] [ERROR] ❌ OAUTH FAILED - Code exchange error
```

### With `LOG_LEVEL=warn`
```
[2025-01-16T14:10:59.736Z] [WARN] ⚠️ WARNING: Cookie value is NOT a JWT!
[2025-01-16T14:10:59.736Z] [ERROR] ❌ OAUTH FAILED - Code exchange error
```

### With `LOG_LEVEL=error`
```
[2025-01-16T14:10:59.736Z] [ERROR] ❌ OAUTH FAILED - Code exchange error
```

## Best Practices

1. **Use `debug` for:**
   - Detailed cookie analysis
   - Step-by-step process details
   - Internal state information
   - Values that might contain sensitive data

2. **Use `info` for:**
   - Important milestones (login success, authorization granted)
   - User-facing actions
   - General flow information

3. **Use `warn` for:**
   - Non-critical issues
   - Fallback mechanisms
   - Deprecated features

4. **Use `error` for:**
   - Authentication failures
   - Authorization failures
   - Critical errors that require attention

## Migration from console.log

Replace existing `console.log` statements:

```typescript
// Before
console.log('✅ Step 1: OAuth code exchange successful');
console.log('  📧 User email:', data.user.email);

// After
logger.info('✅ Step 1: OAuth code exchange successful');
logger.info('  📧 User email:', data.user.email);
```

Replace `console.error`:

```typescript
// Before
console.error('❌ OAUTH FAILED - Code exchange error');

// After
logger.error('❌ OAUTH FAILED - Code exchange error');
```

## Files Using Logger

- `app/api/auth/callback/route.ts` - OAuth callback handler
- `middleware.ts` - Request middleware (to be updated)
- `lib/supabase/middleware.ts` - Supabase session middleware (to be updated)

