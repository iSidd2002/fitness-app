# IncelFitness

IncelFitness is a comprehensive fitness tracking application built with Next.js. Track your workouts, manage exercises, and achieve your fitness goals with intelligent features and a mobile-first design.

# 🏋️‍♂️ IncelFitness - Advanced Fitness Tracking Application

A comprehensive fitness tracking application built with Next.js, featuring advanced data consistency, exercise management, and workout tracking capabilities.

## 🌟 Key Features

### 🎯 Core Functionality
- **Daily Workout Dashboard**: Interactive workout interface with real-time exercise tracking
- **Exercise Database**: Comprehensive global and custom exercise library
- **Workout History**: Complete workout logs with historical accuracy
- **Admin Panel**: Advanced exercise and schedule management for administrators
- **User Authentication**: Secure login/signup with role-based access control

### 🔒 Advanced Data Consistency
- **Exercise Snapshot Pattern**: Preserves historical accuracy of workout data
- **Soft Delete System**: Safe exercise deletion without breaking historical records
- **Audit Trail**: Complete change tracking for all exercise modifications
- **Real-time Notifications**: Users notified of relevant exercise updates

### 👨‍💼 Admin Features
- **Exercise Management**: Create, update, and manage global exercise database
- **Weekly Schedule**: Define workout schedules for different days
- **Usage Analytics**: Track exercise usage across all users
- **Data Migration**: Automated tools for data consistency maintenance

## 🚀 Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MongoDB with Prisma ORM
- **UI Components**: Radix UI, Shadcn/ui
- **Authentication**: NextAuth.js with credentials provider
- **Notifications**: Sonner for toast notifications
- **Drag & Drop**: @hello-pangea/dnd for exercise reordering

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB database
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/iSidd2002/fitness-app.git
cd fitness-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="mongodb://your-mongodb-connection-string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"
```

4. **Database Setup**
```bash
# Push schema to database
npx prisma db push

# Seed initial data
npx prisma db seed
```

5. **Run Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🗄️ Database Schema

### Core Models
- **User**: User accounts with role-based permissions
- **Exercise**: Global and custom exercise definitions
- **WorkoutLog**: Individual workout sessions
- **WorkoutExercise**: Exercises performed in workouts (with snapshots)
- **ExerciseSet**: Individual sets within workout exercises
- **WeeklySchedule**: Admin-defined workout schedules
- **ExerciseChangeLog**: Audit trail for exercise modifications

### Key Features
- **Exercise Snapshots**: Immutable exercise data preservation
- **Soft Deletes**: Safe deletion with data integrity protection
- **Audit Logging**: Complete change tracking and history
- **Referential Integrity**: Proper relationships across all data

## 🔧 Scripts and Tools

### Migration Scripts
```bash
# Migrate existing data to snapshot pattern
npx tsx scripts/migrate-workout-data.ts

# Validate migration results
npx tsx scripts/migrate-workout-data.ts --validate-only

# Create admin user
npx tsx scripts/make-admin.ts
```

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma database browser
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication
- `POST /api/register` - User registration

### Exercise Management
- `GET /api/exercises` - Get all exercises (global + user custom)
- `POST /api/exercises` - Create custom exercise
- `GET /api/exercises/search` - Search exercises with fuzzy matching
- `GET /api/exercises/global` - Get global exercises only

### Admin Exercise Management
- `PUT /api/admin/exercises/[id]` - Update exercise (admin only)
- `DELETE /api/admin/exercises/[id]` - Delete exercise (admin only)
- `POST /api/admin/exercises/[id]/restore` - Restore deleted exercise

### Workout Management
- `GET /api/schedule/today` - Get today's workout schedule
- `POST /api/workout/save` - Save completed workout
- `GET /api/workout/history` - Get user's workout history

### Admin Schedule Management
- `GET /api/admin/schedule` - Get weekly schedule (admin only)
- `POST /api/admin/schedule` - Add exercise to schedule
- `DELETE /api/admin/schedule/[id]` - Remove exercise from schedule
- `PUT /api/admin/schedule/reorder` - Reorder exercises in schedule

## 🏗️ Architecture

### Data Consistency Pattern
The application implements an **Exercise Snapshot Pattern** to ensure historical accuracy:

1. **Workout Creation**: When users complete workouts, exercise data is captured as immutable snapshots
2. **Historical Preservation**: Workout logs always show exercise data as it was at workout time
3. **Admin Flexibility**: Administrators can update exercises without affecting historical records
4. **Data Integrity**: Soft deletes and audit trails prevent data corruption

### Service Layer
- **ExerciseSnapshotService**: Manages exercise snapshots and historical data
- **ExerciseUpdateService**: Handles exercise updates with audit trails
- **RealTimeUpdateService**: Manages notifications and cache invalidation
- **WorkoutDataMigration**: Automated data migration and validation

## 🔐 Authentication & Security

### Features
- **Role-based Access Control**: USER and ADMIN roles with different permissions
- **Route Protection**: Middleware-level authentication for all protected routes
- **Component Guards**: Authentication checks at component level
- **API Security**: All endpoints validate user sessions
- **Admin Protection**: Admin-only routes require elevated permissions

### User Roles
- **USER**: Can create workouts, manage custom exercises, view history
- **ADMIN**: All user permissions plus exercise management and schedule control

## 📊 Data Migration

The application includes a comprehensive migration system for converting existing data to the snapshot pattern:

### Migration Features
- **Automated Conversion**: Converts existing workout data to use snapshots
- **Data Validation**: Ensures migration integrity and completeness
- **Error Handling**: Graceful handling of data inconsistencies
- **Rollback Support**: Ability to rollback migrations for testing
- **Progress Reporting**: Detailed migration progress and results

### Running Migrations
```bash
# Run complete migration
npx tsx scripts/migrate-workout-data.ts

# Validate only
npx tsx scripts/migrate-workout-data.ts --validate-only

# Generate report
npx tsx scripts/migrate-workout-data.ts --report
```

## 🎨 UI/UX Features

### Design System
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark/Light Mode**: Automatic theme detection and switching
- **Accessibility**: WCAG compliant components and interactions
- **Loading States**: Comprehensive loading indicators and skeleton screens

### User Experience
- **Real-time Updates**: Live notifications for exercise changes
- **Drag & Drop**: Intuitive exercise reordering in admin panel
- **Auto-complete**: Smart exercise search with fuzzy matching
- **Form Validation**: Client and server-side validation with clear error messages

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables (Production)
```env
DATABASE_URL="your-production-mongodb-url"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-production-secret"
```

### Deployment Platforms
- **Vercel**: Optimized for Next.js applications
- **Railway**: Full-stack deployment with database
- **Docker**: Containerized deployment option

## 📈 Performance

### Optimizations
- **Database Indexing**: Optimized queries with proper indexes
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting and lazy loading
- **Caching**: Strategic caching for frequently accessed data

### Monitoring
- **Error Tracking**: Comprehensive error logging and tracking
- **Performance Metrics**: Database query optimization and monitoring
- **User Analytics**: Usage patterns and feature adoption tracking

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Standards
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team**: For the amazing React framework
- **Prisma Team**: For the excellent database toolkit
- **Radix UI**: For accessible UI components
- **Tailwind CSS**: For the utility-first CSS framework

## 📞 Support

For support, email sharmasiddhant2002@gmail.com or create an issue in the GitHub repository.

---

**Built with ❤️ by Siddhant Sharma**
