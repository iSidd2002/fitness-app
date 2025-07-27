# FitTrack Authentication System

## Overview
Complete authentication system built with NextAuth.js, Prisma, and shadcn/ui components.

## Features Implemented

### 🔐 Authentication Flow
- **User Registration** (`/signup`) - Create new accounts with email/password
- **User Login** (`/login`) - Sign in with credentials
- **Protected Routes** - Dashboard requires authentication
- **Session Management** - Persistent sessions with NextAuth.js

### 🎨 UI Components
- **Responsive Design** - Mobile-first approach
- **Form Validation** - Real-time validation with Zod
- **Toast Notifications** - Success/error feedback with Sonner
- **Modern UI** - Clean design with shadcn/ui components

### 🛠 Technical Stack
- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: NextAuth.js v4 with credentials provider
- **Database**: Prisma ORM with MongoDB
- **Validation**: Zod for schema validation
- **Forms**: React Hook Form with Zod resolver
- **UI**: shadcn/ui components, Tailwind CSS
- **Password Hashing**: bcryptjs

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth API routes
│   │   └── register/route.ts            # User registration API
│   ├── login/page.tsx                   # Login page
│   ├── signup/page.tsx                  # Registration page
│   ├── dashboard/page.tsx               # Protected dashboard
│   ├── layout.tsx                       # Root layout with providers
│   └── page.tsx                         # Home page
├── components/
│   ├── ui/                              # shadcn/ui components
│   └── providers.tsx                    # Session provider wrapper
├── lib/
│   ├── auth.ts                          # NextAuth configuration
│   ├── prisma.ts                        # Prisma client
│   └── utils.ts                         # Utility functions
└── types/
    └── next-auth.d.ts                   # NextAuth type extensions
```

## Environment Variables Required

Create a `.env.local` file with:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/fittrack"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

## Usage

1. **Start the development server**: `npm run dev`
2. **Visit**: http://localhost:3000
3. **Create an account**: Click "Create Account" or go to `/signup`
4. **Sign in**: Use your credentials at `/login`
5. **Access dashboard**: Protected route at `/dashboard`

## API Endpoints

- `POST /api/register` - Create new user account
- `POST /api/auth/signin` - Sign in (NextAuth)
- `POST /api/auth/signout` - Sign out (NextAuth)

## Security Features

- ✅ Password hashing with bcryptjs
- ✅ Input validation with Zod
- ✅ CSRF protection (NextAuth)
- ✅ Secure session management
- ✅ Type-safe API routes

## Next Steps

1. Set up your MongoDB database
2. Configure environment variables
3. Test the authentication flow
4. Customize the UI to match your brand
5. Add additional features like password reset, email verification, etc.

## Testing the System

1. **Registration Flow**:
   - Go to `/signup`
   - Fill out the form with valid data
   - Should redirect to login page on success

2. **Login Flow**:
   - Go to `/login`
   - Use the credentials you just created
   - Should redirect to home page and show authenticated state

3. **Protected Routes**:
   - Try accessing `/dashboard` without being logged in
   - Should redirect to login page

4. **Session Persistence**:
   - Refresh the page while logged in
   - Should maintain authentication state
