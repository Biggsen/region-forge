# User Accounts Specification

## Overview

This specification outlines the implementation of user accounts and authentication to enable user-specific features such as cloud storage, image uploads, project sharing, and multi-device synchronization.

## Problem Statement

Currently, the application operates entirely client-side with localStorage persistence:
- **No Cloud Storage**: All data stored locally, lost if browser data is cleared
- **No Multi-Device Sync**: Can't access projects from different devices
- **No Collaboration**: Can't share projects with other users
- **No Image Upload**: Can't upload images without hosting them elsewhere
- **No Project Persistence**: Projects tied to browser/device, not user identity
- **No Backup**: No automatic backups of user projects

User accounts will solve these limitations and unlock additional features.

## Goals

1. **User Identity**: Unique user accounts with authentication
2. **Cloud Storage**: Store projects and images in the cloud
3. **Multi-Device Access**: Access projects from any device
4. **Project Sharing**: Share projects with other users
5. **Data Backup**: Automatic cloud backup of user projects
6. **Future Foundation**: Enable collaboration, team features, and enterprise features

## Requirements

### 1. Authentication

#### 1.1 Sign Up
- Email-based registration
- Password requirements (min length, complexity)
- Email verification (optional for MVP, required later)
- Terms of service acceptance
- Account creation flow

#### 1.2 Sign In
- Email + password authentication
- "Remember me" option (long-lived sessions)
- Forgot password flow
- Account lockout after failed attempts (security)

#### 1.3 Sign Out
- Clear local session
- Invalidate server-side session
- Return to unauthenticated state

#### 1.4 OAuth Integration (Future)
- Google Sign-In
- GitHub Sign-In
- Other providers as needed

### 2. User Profile

#### 2.1 Profile Data
- Display name
- Email address
- Profile picture (avatar)
- Account creation date
- Last login date

#### 2.2 Profile Management
- Edit display name
- Change email (with verification)
- Change password
- Upload/change avatar
- Delete account (with data export)

### 3. Session Management

#### 3.1 Session Storage
- JWT tokens or session cookies
- Secure token storage (httpOnly cookies preferred)
- Token refresh mechanism
- Session expiration handling

#### 3.2 Multi-Device Sessions
- Multiple simultaneous sessions allowed
- Session management (view/revoke active sessions)
- Device/location tracking for security

### 4. Data Storage

#### 4.1 Project Storage
- Save projects to cloud (user-specific)
- Load projects from cloud
- Project listing/viewing
- Project organization (folders/tags - future)
- Project metadata (name, description, last modified, size)

#### 4.2 Image Storage
- Upload map images to cloud
- Store images per user
- Image organization and management
- Storage quotas/limits
- Image CDN/hosting

### 5. Project Sharing

#### 5.1 Basic Sharing (MVP)
- Generate shareable link for project
- Public/private project settings
- Read-only access via shared link
- Copy project from shared link

#### 5.2 Advanced Sharing (Future)
- Share with specific users (by email)
- Permission levels (view, edit, admin)
- Team collaboration
- Comments and annotations

## Technical Architecture

### Frontend Changes

#### New Components

**`src/components/auth/LoginForm.tsx`**
- Email/password input
- Sign in button
- "Forgot password" link
- "Create account" link
- Error handling

**`src/components/auth/SignUpForm.tsx`**
- Email/password/confirm password inputs
- Terms acceptance checkbox
- Sign up button
- Validation and error handling

**`src/components/auth/ForgotPasswordForm.tsx`**
- Email input
- Submit button
- Success/error messaging

**`src/components/auth/UserProfile.tsx`**
- Profile display
- Edit profile form
- Change password form
- Account settings

**`src/components/UserMenu.tsx`**
- User avatar/name display
- Dropdown menu (Profile, Settings, Sign Out)
- Appears in header/navigation

#### Modified Components

**`src/components/MainApp.tsx`**
- Add authentication state check
- Show login screen when not authenticated
- Show app when authenticated
- Add UserMenu to navigation

**`src/components/MapLoaderControls.tsx`**
- Add "Upload Image" button (when authenticated)
- Show uploaded images list
- Load from cloud storage

**`src/components/RegionPanel.tsx`**
- Add "Save to Cloud" button
- Show cloud projects indicator

### Backend Service

#### New Service: Authentication & Storage Service

**Technology Stack:**
- **Backend Framework**: Express.js or Fastify
- **Database**: PostgreSQL (user data, projects metadata)
- **File Storage**: AWS S3 or similar (projects, images)
- **Authentication**: JWT tokens or session-based
- **Email**: SendGrid or similar (email verification, password reset)

#### API Endpoints

**Authentication:**
```
POST   /api/auth/signup          - Create new account
POST   /api/auth/signin          - Sign in user
POST   /api/auth/signout         - Sign out user
POST   /api/auth/refresh         - Refresh JWT token
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password with token
GET    /api/auth/verify-email    - Verify email address
GET    /api/auth/me              - Get current user info
```

**Projects:**
```
GET    /api/projects             - List user's projects
GET    /api/projects/:id         - Get project by ID
POST   /api/projects             - Create/save project
PUT    /api/projects/:id         - Update project
DELETE /api/projects/:id         - Delete project
GET    /api/projects/:id/share   - Get shareable link
POST   /api/projects/:id/share   - Generate shareable link
GET    /api/shared/:token        - Get project by share token
```

**Images:**
```
GET    /api/images               - List user's images
POST   /api/images               - Upload image
GET    /api/images/:id           - Get image by ID
DELETE /api/images/:id           - Delete image
GET    /api/images/:id/url       - Get image URL
```

**User Profile:**
```
GET    /api/users/me             - Get current user profile
PUT    /api/users/me             - Update user profile
POST   /api/users/me/avatar      - Upload avatar
PUT    /api/users/me/password    - Change password
DELETE /api/users/me             - Delete account
```

#### Data Models

**User:**
```typescript
interface User {
  id: string
  email: string
  displayName: string
  avatarUrl?: string
  createdAt: Date
  lastLoginAt: Date
  emailVerified: boolean
}
```

**Project:**
```typescript
interface Project {
  id: string
  userId: string
  name: string
  description?: string
  data: MapExportData  // Existing export format
  createdAt: Date
  updatedAt: Date
  isPublic: boolean
  shareToken?: string
  size: number  // Bytes
}
```

**Image:**
```typescript
interface Image {
  id: string
  userId: string
  filename: string
  url: string
  size: number  // Bytes
  width: number
  height: number
  createdAt: Date
}
```

### Frontend State Management

#### New Hooks

**`src/hooks/useAuth.ts`**
```typescript
export function useAuth() {
  return {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    signIn: (email: string, password: string) => Promise<void>
    signUp: (email: string, password: string, displayName: string) => Promise<void>
    signOut: () => Promise<void>
    refreshSession: () => Promise<void>
  }
}
```

**`src/hooks/useProjects.ts`**
```typescript
export function useProjects() {
  return {
    projects: Project[]
    isLoading: boolean
    loadProjects: () => Promise<void>
    saveProject: (name: string, data: MapExportData) => Promise<Project>
    loadProject: (id: string) => Promise<MapExportData>
    deleteProject: (id: string) => Promise<void>
    shareProject: (id: string) => Promise<string>  // Returns share URL
  }
}
```

**`src/hooks/useImages.ts`**
```typescript
export function useImages() {
  return {
    images: Image[]
    isLoading: boolean
    uploadImage: (file: File) => Promise<Image>
    loadImages: () => Promise<void>
    deleteImage: (id: string) => Promise<void>
    getImageUrl: (id: string) => string
  }
}
```

#### Updated Context

**`src/context/AppContext.tsx`**
- Add `auth` context (from useAuth)
- Add `projects` context (from useProjects)
- Add `images` context (from useImages)

## Security Considerations

### Authentication Security
- Password hashing (bcrypt, minimum rounds)
- HTTPS only (no HTTP in production)
- JWT secret rotation
- Rate limiting on auth endpoints
- Account lockout after failed attempts
- CSRF protection

### Data Security
- User data isolation (user can only access their own data)
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- File upload validation (type, size limits)
- XSS prevention
- Secure file storage (S3 with proper permissions)

### Privacy
- GDPR compliance considerations
- Data export on account deletion
- Privacy policy
- Terms of service
- Cookie consent (if needed)

## Migration Plan

### Existing Users

**Phase 1: Optional Migration**
- Existing localStorage projects continue to work
- Users can optionally create accounts
- Manual "Import from localStorage" feature
- No forced migration

**Phase 2: Encouraged Migration**
- Prompts to create account for backup
- Easy migration flow
- Benefits messaging (backup, sync, etc.)

**Phase 3: Cloud-First (Future)**
- New projects default to cloud
- localStorage as fallback/offline mode

### Data Migration

**Project Migration:**
1. User creates account
2. User clicks "Backup to Cloud"
3. Export all localStorage projects
4. Upload to cloud storage
5. Mark projects as synced

**Image Migration:**
1. Export project images as base64 (already in export format)
2. Convert to files and upload
3. Link projects to uploaded images

## Implementation Phases

### Phase 1: Core Authentication (MVP)
**Goal**: Basic user accounts and sign in/sign up

- [ ] Backend authentication service
- [ ] Database setup (users table)
- [ ] Sign up API endpoint
- [ ] Sign in API endpoint
- [ ] JWT token generation
- [ ] Frontend login/signup forms
- [ ] Session management
- [ ] Protected routes
- [ ] User profile display

**Estimated Time**: 2-3 weeks

### Phase 2: Cloud Project Storage
**Goal**: Save and load projects from cloud

- [ ] Project storage API endpoints
- [ ] Database (projects table)
- [ ] File storage setup (S3)
- [ ] Frontend project save/load
- [ ] Project listing UI
- [ ] Migration from localStorage
- [ ] Project metadata management

**Estimated Time**: 2-3 weeks

### Phase 3: Image Upload
**Goal**: Upload and store map images

- [ ] Image upload API endpoint
- [ ] File storage for images
- [ ] Image management UI
- [ ] Upload progress indicators
- [ ] Image selection from cloud
- [ ] Storage quota management
- [ ] Image CDN/hosting

**Estimated Time**: 1-2 weeks

### Phase 4: Project Sharing
**Goal**: Share projects via links

- [ ] Share token generation
- [ ] Public project access endpoint
- [ ] Share UI (generate link, copy)
- [ ] Access control (public/private)
- [ ] Shared project viewing
- [ ] Copy shared project feature

**Estimated Time**: 1 week

### Phase 5: Enhanced Features
**Goal**: Polish and additional features

- [ ] Email verification
- [ ] Password reset flow
- [ ] Profile editing
- [ ] Avatar upload
- [ ] Account deletion
- [ ] Session management UI
- [ ] Project organization (folders)
- [ ] Search and filtering

**Estimated Time**: 2 weeks

## Testing Requirements

### Unit Tests
- [ ] Authentication logic
- [ ] JWT token generation/validation
- [ ] Password hashing/verification
- [ ] Input validation
- [ ] Data models

### Integration Tests
- [ ] Complete signup flow
- [ ] Complete signin flow
- [ ] Project save/load flow
- [ ] Image upload flow
- [ ] Project sharing flow
- [ ] Error handling

### Security Tests
- [ ] Authentication bypass attempts
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF protection
- [ ] File upload validation
- [ ] Access control (user isolation)

### User Acceptance Tests
- [ ] Account creation flow
- [ ] Project migration from localStorage
- [ ] Multi-device access
- [ ] Project sharing with other users
- [ ] Image upload and usage

## Future Enhancements

### Short Term
- Email verification
- Password strength meter
- Two-factor authentication (2FA)
- Social login (Google, GitHub)
- Project folders/organization
- Project templates
- Project search

### Medium Term
- Team accounts
- Collaboration features (real-time editing)
- Project comments/annotations
- Version history
- Project forking/cloning
- Public project gallery
- Project import from URL

### Long Term
- Enterprise features
- Custom domains
- API access
- Webhooks
- Advanced permissions (role-based)
- Analytics and usage tracking
- Billing/subscriptions

## Dependencies

### New Dependencies

**Frontend:**
- JWT handling library (`jsonwebtoken` or similar)
- HTTP client with auth (`axios` or fetch wrapper)
- Form validation library (optional)

**Backend:**
- Express.js (or Fastify)
- PostgreSQL client (`pg` or ORM like Prisma)
- JWT library (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- File upload handling (`multer` or `busboy`)
- AWS SDK (for S3)
- Email service (SendGrid, AWS SES)

### Infrastructure

- **Database**: PostgreSQL (managed service or self-hosted)
- **File Storage**: AWS S3 or compatible (R2, DigitalOcean Spaces)
- **Email Service**: SendGrid, AWS SES, or similar
- **Hosting**: Railway, Render, or similar (for backend)
- **Domain**: Custom domain for API

## Success Criteria

- [ ] Users can create accounts and sign in
- [ ] Projects save to cloud automatically
- [ ] Projects accessible from any device
- [ ] Image upload works seamlessly
- [ ] Projects can be shared via links
- [ ] Migration from localStorage is smooth
- [ ] All security requirements met
- [ ] Performance acceptable (project save < 2s, load < 1s)
- [ ] 99.9% uptime for auth service
- [ ] Zero critical security vulnerabilities

## Rollback Plan

If issues arise:
1. Feature flag to disable cloud features
2. Fallback to localStorage-only mode
3. Export user data for migration back
4. Keep existing localStorage functionality intact
5. Gradual rollout (beta users first)

## Notes

- **Privacy First**: User data belongs to users - easy export/deletion
- **Graceful Degradation**: App should work offline (localStorage) when possible
- **Progressive Enhancement**: Add cloud features incrementally
- **User Choice**: Never force cloud storage - always provide localStorage option
- **Security Priority**: Security review before launch
- **Compliance**: GDPR, CCPA considerations for user data

## Related Specifications

- **Image Upload Spec** (depends on this)
- **Project Sharing Spec** (depends on this)
- **Collaboration Features Spec** (depends on this)
- **Storage Quotas Spec** (depends on this)
