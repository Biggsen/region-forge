# 🔒 Security Enhancement Specification

## Overview

This document outlines remaining security enhancements for the MC Region Maker application. These items are improvements and hardening measures beyond the critical vulnerabilities that have already been addressed.

---

## High Priority Enhancements

### 1. File Upload Validation

**File**: `src/utils/exportUtils.ts`, `src/components/MainApp.tsx`

**Issue**: File imports lack comprehensive validation:
- No file size limits
- No MIME type validation
- Potential JSON DoS via large files
- No timeout on file parsing

**Current Code**:
```typescript
reader.readAsText(file)  // No size check before reading
const data = JSON.parse(e.target?.result as string)  // No size limit
```

**Specification for Fix**:

1. **File Size Validation**
   - Maximum file size: 10MB (configurable)
   - Check size before reading file
   - Show user-friendly error if exceeded

2. **MIME Type Validation**
   - Validate file type is `application/json`
   - Fallback to file extension check
   - Reject non-JSON files

3. **JSON Parsing Limits**
   - Set timeout on parsing operation
   - Limit maximum JSON depth (prevent stack overflow)
   - Use streaming parser for very large files (if needed)

4. **Content Validation**
   - Validate imported data structure before processing
   - Reject files with unexpected structure
   - Sanitize imported data

**Implementation Example**:
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_JSON_SIZE = 50 * 1024 * 1024 // 50MB

export function importMapData(file: File): Promise<MapExportData> {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    return Promise.reject(new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`))
  }
  
  // MIME type check
  if (file.type && file.type !== 'application/json') {
    return Promise.reject(new Error('Invalid file type. Please upload a JSON file.'))
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    let timeout: NodeJS.Timeout
    
    reader.onload = (e) => {
      clearTimeout(timeout)
      try {
        const content = e.target?.result as string
        
        // Size check on content
        if (content.length > MAX_JSON_SIZE) {
          reject(new Error('File content too large'))
          return
        }
        
        // Parse with error handling
        const data = JSON.parse(content)
        
        // Validate structure
        if (!validateImportData(data)) {
          reject(new Error('Invalid import data format'))
          return
        }
        
        resolve(data)
      } catch (error) {
        reject(new Error('Failed to parse file. Please ensure it is valid JSON.'))
      }
    }
    
    reader.onerror = () => {
      clearTimeout(timeout)
      reject(new Error('Failed to read file'))
    }
    
    // Timeout after 30 seconds
    timeout = setTimeout(() => {
      reader.abort()
      reject(new Error('File reading timed out'))
    }, 30000)
    
    reader.readAsText(file)
  })
}
```

**Priority**: HIGH  
**Estimated Effort**: 2-3 hours  
**Testing**: Test with large files, invalid JSON, non-JSON files

---

## Medium Priority Enhancements

### 2. Missing Security Headers

**File**: `vercel.json`

**Issue**: Missing security headers that protect against:
- MIME type sniffing
- Clickjacking
- XSS attacks
- Information disclosure

**Current Status**: Only CSP header is set. Missing:
- X-Frame-Options
- X-XSS-Protection
- Referrer-Policy
- Permissions-Policy

**Specification for Fix**:

Add the following headers to `vercel.json`:

1. **X-Content-Type-Options**: Prevent MIME type sniffing
2. **X-Frame-Options**: Prevent clickjacking
3. **X-XSS-Protection**: Enable XSS filter (legacy browsers)
4. **Referrer-Policy**: Control referrer information
5. **Permissions-Policy**: Control browser features

**Implementation**:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "geolocation=(), microphone=(), camera=()"
        }
      ]
    }
  ]
}
```

**Priority**: MEDIUM  
**Estimated Effort**: 1 hour  
**Testing**: Verify headers are present in response

---

### 3. Weak URL Validation in Frontend

**File**: `src/utils/imageUtils.ts`, `src/components/MapLoaderControls.tsx`, `src/components/ImageImportHandler.tsx`

**Issue**: Simple string checks can be bypassed:
```typescript
imageUrl.startsWith('http') && !imageUrl.includes('localhost')
```

This allows:
- `http://evil.com@localhost/`
- `http://localhost.evil.com`
- Protocol-relative URLs

**Specification for Fix**:

1. **Use URL Constructor**
   - Validate URL format using `new URL()`
   - Check protocol explicitly
   - Validate hostname properly

2. **Hostname Validation**
   - Block localhost variations
   - Block private IPs
   - Allowlist common CDN domains (optional)

**Implementation Example**:
```typescript
function validateImageURL(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim())
    
    // Protocol check
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false
    }
    
    // Hostname validation
    const hostname = url.hostname.toLowerCase()
    const localhostPatterns = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1'
    ]
    
    if (localhostPatterns.includes(hostname) || 
        hostname.endsWith('.local') ||
        hostname.endsWith('.localhost')) {
      return false
    }
    
    // Block private IP ranges (basic check)
    const privateIPPattern = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/
    if (privateIPPattern.test(hostname)) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}
```

**Priority**: MEDIUM  
**Estimated Effort**: 2 hours  
**Testing**: Test with various URL formats and edge cases

---

### 4. Console Logging in Production

**File**: Multiple files across codebase

**Issue**: `console.error()` and `console.log()` statements expose:
- Internal error details
- Debugging information
- Potential sensitive data

**Specification for Fix**:

1. **Use Logging Library**
   - Implement logging utility with levels (debug, info, warn, error)
   - Disable debug/info logs in production
   - Use structured logging format

2. **Replace Console Statements**
   - Replace `console.log()` with logging utility
   - Replace `console.error()` with error logging
   - Keep only essential production logs

3. **Environment-Based Logging**
   - Development: Show all logs
   - Production: Show only warnings and errors
   - Use logging service (e.g., Vercel Analytics, Sentry) for production

**Implementation Example**:
```typescript
// src/utils/logger.ts
const isDevelopment = import.meta.env.DEV

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) console.log('[DEBUG]', ...args)
  },
  info: (...args: any[]) => {
    if (isDevelopment) console.info('[INFO]', ...args)
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
    // Send to error tracking service in production
  }
}
```

**Priority**: MEDIUM  
**Estimated Effort**: 3-4 hours  
**Testing**: Verify logs are suppressed in production builds

---

## Low Priority / Best Practices

### 5. Input Sanitization

**Specification**: Review all user inputs for proper sanitization:
- Region names
- World names
- Coordinate inputs
- Seed values

Ensure inputs are validated and sanitized before:
- Displaying in UI
- Storing in localStorage
- Exporting to files
- Sending to APIs

**Priority**: LOW  
**Estimated Effort**: 2-3 hours

---

### 6. Security Monitoring Enhancements

**Current Status**: Basic logging in place, but missing:
- Error tracking service (Sentry, etc.)
- Rate limiting monitoring dashboard
- Security headers monitoring
- Dependency monitoring (Dependabot/Snyk)

**Specification**:

1. **Error Tracking**
   - Integrate Sentry or similar service
   - Track client-side errors
   - Track server-side errors
   - Set up alerts for critical errors

2. **Rate Limiting Monitoring**
   - Track blocked requests
   - Monitor rate limit violations
   - Set up alerts for abuse patterns

3. **Security Headers Monitoring**
   - Regular automated checks
   - Verify headers are present
   - Alert on missing headers

4. **Dependency Monitoring**
   - Set up Dependabot or Snyk
   - Automated security alerts
   - Regular dependency audits

**Priority**: LOW  
**Estimated Effort**: 4-8 hours (depending on tools chosen)

---

## Implementation Roadmap

### Phase 1: High Priority (Week 1)
1. Add file upload validation
2. Add missing security headers to `vercel.json`

### Phase 2: Medium Priority (Week 2-3)
3. Improve URL validation in frontend
4. Replace console logging with proper logging utility

### Phase 3: Low Priority (Ongoing)
5. Review and improve input sanitization
6. Set up security monitoring tools

---

## Testing Requirements

### Security Testing Checklist

- [ ] Test file upload with:
  - [ ] Large files (>10MB)
  - [ ] Non-JSON files
  - [ ] Malformed JSON
  - [ ] Deeply nested JSON
- [ ] Test URL validation with edge cases:
  - [ ] `http://evil.com@localhost/`
  - [ ] `http://localhost.evil.com`
  - [ ] Protocol-relative URLs
  - [ ] Private IP addresses
- [ ] Verify security headers are present
- [ ] Test logging utility in development and production
- [ ] Verify input sanitization for all user inputs

### Tools

- **Security Headers**: SecurityHeaders.com
- **Error Tracking**: Sentry, LogRocket
- **Dependency Scanning**: `npm audit`, Snyk, Dependabot

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Security Best Practices](https://infosec.mozilla.org/guidelines/web_security)

---

## Document Version

**Version**: 1.0  
**Last Updated**: 2026-01-12  
**Related Document**: `../completed/security_spec.md` (for completed critical fixes)
