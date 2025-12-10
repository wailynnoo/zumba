# Fitness Dance App - Development Roadmap

**Project:** Fitness Dance App  
**Domain:** zfitdance.com  
**Date:** [Date]

---

## 🎯 Recommended Development Sequence

### **Start with: Backend API + Database**

**Why start here?**

- All other projects (Mobile App, Public Website, Admin Panel) depend on the Backend API
- Database schema must be designed first to define data structure
- Backend API provides the foundation for all features
- You can test APIs independently using tools like Postman before building frontends
- Allows parallel development later (once APIs are ready, multiple teams can work on different frontends)

---

## 🏗️ API Architecture

### **Two Separate API Projects (Shared Database)**

**Architecture Decision:**

- ✅ **Member API** - For mobile app and public website users
- ✅ **Admin API** - For admin panel operations
- ✅ **Shared Database** - Both APIs connect to the same PostgreSQL database (Local for dev, Railway for production)

**Why Two Separate Projects?**

1. **Security Separation** - Different authentication/authorization requirements
2. **Independent Scaling** - Scale member and admin APIs separately
3. **Clear Boundaries** - Easier to manage permissions and access control
4. **Deployment Flexibility** - Deploy updates independently
5. **Code Organization** - Cleaner separation of concerns

**Architecture Diagram:**

```
┌─────────────────────────────────────────────────┐
│         Mobile App (React Native)               │
│         Public Website (Next.js)                │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│  Member API    │   │   Admin API     │
│  (Node.js +    │   │  (Node.js +     │
│   Express)     │   │   Express)      │
└───────┬────────┘   └────────┬────────┘
        │                     │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────┐
        │   Shared Database   │
        │  PostgreSQL         │
        │  (Railway/Local)     │
        └─────────────────────┘
```

**Shared Components:**

- Database schema (Prisma)
- Common utilities/helpers
- Shared types/interfaces
- Database connection logic

---

## 📋 Development Phases

### **Phase 1: Foundation (Weeks 1-2)**

#### 1.1 Database Schema Design

**Priority: HIGHEST**

**Tasks:**

- Design database schema (PostgreSQL)
- Define all tables:
  - Users, Subscriptions, Videos, Playlists
  - Dance Styles, Intensity Levels
  - Knowledge Articles (Fitness & Dance)
  - Ratings, Feedback
  - Payment Transactions (MMQR)
- Set up local PostgreSQL database (development)
- Set up Railway PostgreSQL database (production)
- Create database migrations (using Prisma)
- Seed initial data (dance styles, intensity levels)

**Deliverables:**

- Database schema diagram
- Prisma schema file
- Initial migrations
- Seed data scripts

---

#### 1.2 Backend API Setup

**Priority: HIGHEST**

**Tasks:**

**Member API Project:**

- Initialize Node.js + Express + TypeScript project
- Set up project structure for member-facing APIs
- Configure Prisma ORM (shared schema)
- Set up environment variables
- Configure database connection
- Set up JWT authentication - User/Member auth
- Create basic API structure (routes, controllers, services)
- Set up Swagger/OpenAPI documentation
- Configure error handling and logging
- Set up Jest for testing

**Admin API Project:**

- Initialize separate Node.js + Express + TypeScript project
- Set up project structure for admin-facing APIs
- Configure Prisma ORM (shared schema - same database)
- Set up environment variables
- Configure database connection (same database)
- Set up JWT authentication - Admin auth with role checks
- Create basic API structure (routes, controllers, services)
- Set up Swagger/OpenAPI documentation
- Configure error handling and logging
- Set up Jest for testing

**Shared Components:**

- Create shared Prisma schema file (or monorepo structure)
- Shared database connection configuration
- Common utilities and helpers
- Shared TypeScript types/interfaces

**Deliverables:**

- Member API project structure
- Admin API project structure
- Shared database schema and utilities
- Basic API endpoints (health check, auth) for both
- API documentation setup for both projects

---

### **Phase 2: Core Backend Features (Weeks 3-6)**

#### 2.1 Authentication & User Management

**Priority: HIGH**

**Tasks:**

**Member API:**

- User registration (email OR phone OR both) with JWT
- User login (email OR phone) with JWT token generation
- Email verification (verification token via email)
- Phone verification (SMS verification code)
- At least one verification required (email or phone)
- Social login (Google, Apple) - OAuth with JWT
- Guest mode support
- User profile management (own profile)
- Password reset (with JWT token)
- JWT token refresh mechanism

**Admin API:**

- Admin login with JWT
- JWT authentication with role checks (isAdmin)
- View all users
- User management (view, update, delete users)
- User search and filters
- User analytics
- JWT token refresh mechanism

**Member API Endpoints:**

- `POST /api/auth/register` (email or phone or both)
- `POST /api/auth/login` (email or phone)
- `POST /api/auth/verify-email` (verify email with token)
- `POST /api/auth/verify-phone` (verify phone with SMS code)
- `POST /api/auth/resend-email-verification`
- `POST /api/auth/resend-phone-verification`
- `POST /api/auth/social-login`
- `GET /api/users/profile` (own profile)
- `PUT /api/users/profile` (own profile)

**Admin API Endpoints:**

- `POST /api/admin/auth/login`
- `GET /api/admin/users` (list all users)
- `GET /api/admin/users/:id` (user details)
- `PUT /api/admin/users/:id` (update user)
- `DELETE /api/admin/users/:id` (delete user)
- `GET /api/admin/users/search` (search/filter users)

---

#### 2.2 Video Content Management

**Priority: HIGH**

**Tasks:**

**Member API:**

- Video browsing (list, search, filter)
- Video details
- Video streaming (Cloudflare Stream signed URLs)
- Video access control (subscription-based)
- YouTube integration (for short videos)

**Admin API:**

- Video CRUD operations (create, update, delete)
- Cloudflare Stream integration
- Video metadata management (title, description, intensity, style)
- Video upload workflow
- Thumbnail management
- Video status management (published, draft, archived)
- Video analytics

**Member API Endpoints:**

- `GET /api/videos` (list, search, filter - subscription check)
- `GET /api/videos/:id` (video details - subscription check)
- `GET /api/videos/:id/stream-url` (signed URL - subscription check)
- `GET /api/videos/youtube-shorts` (YouTube short videos)

**Admin API Endpoints:**

- `GET /api/admin/videos` (list all videos)
- `GET /api/admin/videos/:id` (video details)
- `POST /api/admin/videos` (create video)
- `PUT /api/admin/videos/:id` (update video)
- `DELETE /api/admin/videos/:id` (delete video)
- `POST /api/admin/videos/:id/upload` (upload video to Cloudflare Stream)
- `POST /api/admin/videos/:id/thumbnail` (upload thumbnail)

---

#### 2.3 Subscription & Payment System

**Priority: HIGH**

**Tasks:**

**Member API:**

- View subscription plans
- Create subscription
- View current subscription
- Cancel subscription
- MMQR payment integration
- Payment verification
- Billing history (own)

**Admin API:**

- View all subscriptions
- Subscription plans configuration
- Trial period settings (4 days)
- Subscription status management
- Subscription analytics
- Revenue reports
- Manual subscription management

**Member API Endpoints:**

- `GET /api/subscriptions/plans`
- `POST /api/subscriptions/create`
- `GET /api/subscriptions/current` (own subscription)
- `POST /api/subscriptions/cancel` (own subscription)
- `POST /api/payments/mmqr/create`
- `POST /api/payments/mmqr/verify`
- `GET /api/payments/history` (own billing history)

**Admin API Endpoints:**

- `GET /api/admin/subscriptions` (list all)
- `GET /api/admin/subscriptions/:id` (subscription details)
- `PUT /api/admin/subscriptions/:id` (update subscription)
- `POST /api/admin/subscriptions/plans` (create plan)
- `PUT /api/admin/subscriptions/plans/:id` (update plan)
- `GET /api/admin/subscriptions/analytics` (revenue, stats)
- `GET /api/admin/payments` (all payments)

---

#### 2.4 Playlist Management

**Priority: MEDIUM**

**Tasks:**

**Member API:**

- Create/update/delete own playlists
- Add/remove videos from own playlists
- Playlist reordering (drag-and-drop support)
- Playlist privacy settings
- Get own playlists

**Admin API:**

- View all user playlists (optional - for analytics)

**Member API Endpoints:**

- `GET /api/playlists` (own playlists)
- `POST /api/playlists` (create playlist)
- `PUT /api/playlists/:id` (update own playlist)
- `DELETE /api/playlists/:id` (delete own playlist)
- `POST /api/playlists/:id/videos` (add video)
- `DELETE /api/playlists/:id/videos/:videoId` (remove video)
- `POST /api/playlists/:id/reorder` (reorder videos)

**Admin API Endpoints:**

- `GET /api/admin/playlists` (all playlists - optional)

---

#### 2.5 Rating & Feedback System

**Priority: MEDIUM**

**Tasks:**

**Member API:**

- 5-star rating system (rate videos)
- Private feedback messages (submit feedback)
- View video ratings (aggregated)

**Admin API:**

- View all ratings
- View all feedback messages
- Respond to feedback
- Feedback analytics

**Member API Endpoints:**

- `POST /api/videos/:id/rate` (rate video)
- `PUT /api/videos/:id/rate` (update rating)
- `POST /api/videos/:id/feedback` (submit feedback)
- `GET /api/videos/:id/ratings` (view ratings)

**Admin API Endpoints:**

- `GET /api/admin/ratings` (all ratings)
- `GET /api/admin/feedback` (all feedback)
- `GET /api/admin/feedback/:id` (feedback details)
- `POST /api/admin/feedback/:id/respond` (respond to feedback)

---

#### 2.6 Knowledge Sections

**Priority: MEDIUM**

**Tasks:**

**Member API:**

- Browse Fitness Knowledge articles (free access)
- Browse Dance Knowledge articles (free access)
- Read articles
- Search articles

**Admin API:**

- Fitness Knowledge articles CRUD
- Dance Knowledge articles CRUD
- Article management (publish/unpublish)
- Article analytics

**Member API Endpoints:**

- `GET /api/knowledge/fitness` (list articles)
- `GET /api/knowledge/dance` (list articles)
- `GET /api/knowledge/:id` (article details)
- `GET /api/knowledge/search` (search articles)

**Admin API Endpoints:**

- `GET /api/admin/knowledge/fitness` (list all)
- `GET /api/admin/knowledge/dance` (list all)
- `POST /api/admin/knowledge` (create article)
- `PUT /api/admin/knowledge/:id` (update article)
- `DELETE /api/admin/knowledge/:id` (delete article)

---

### **Project Structure & Organization**

#### **Recommended Project Structure**

**Option 1: Separate Repositories (Recommended)**

```
fitness-dance-member-api/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── prisma/
│   └── schema.prisma (shared)
└── package.json

fitness-dance-admin-api/
├── src/
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   ├── middleware/
│   └── utils/
├── prisma/
│   └── schema.prisma (shared - same as member)
└── package.json

shared-database/
└── prisma/
    └── schema.prisma (single source of truth)
```

**Option 2: Monorepo (Alternative)**

```
fitness-dance-backend/
├── packages/
│   ├── member-api/
│   ├── admin-api/
│   └── shared/
│       ├── prisma/
│       ├── types/
│       └── utils/
└── package.json
```

#### **Shared Database Connection**

Both APIs connect to the same PostgreSQL database:

**Environment Variables (Both Projects):**

**Development (.env.local):**

```env
# Local PostgreSQL Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/fitness_dance_dev?schema=public

# Member API specific
PORT=3001
API_BASE_URL=http://localhost:3001

# Admin API specific
PORT=3002
API_BASE_URL=http://localhost:3002
```

**Production (.env.production):**

```env
# Railway PostgreSQL Database
DATABASE_URL=postgresql://user:password@host.railway.app:port/railway?schema=public

# Member API specific
PORT=3001
API_BASE_URL=https://api-member.zfitdance.com

# Admin API specific
PORT=3002
API_BASE_URL=https://api-admin.zfitdance.com
```

#### **Deployment**

- **Member API**: Deploy to Railway (e.g., `api-member.zfitdance.com`)
- **Admin API**: Deploy to Railway (e.g., `api-admin.zfitdance.com`)
- **Database**: Railway PostgreSQL (shared by both)

---

### **Phase 3: Frontend Development (Weeks 7-12)**

**Note:** Once core backend APIs are ready, you can develop frontends in parallel or sequentially based on team size.

---

#### 3.1 Admin Panel (Next.js)

**Priority: HIGH** (needed to manage content)

**Why start with Admin Panel?**

- Allows you to add/manage content while building mobile app
- Simpler than mobile app (web-based)
- Needed to populate videos, articles, etc.

**API Connection:**

- Connects to **Admin API** (`api-admin.zfitdance.com`)

**Tasks:**

- Set up Next.js project
- Authentication (admin login via Admin API)
- Dashboard
- Video content management (via Admin API)
- User management (via Admin API)
- Subscription management (via Admin API)
- Knowledge content management (via Admin API)
- Analytics/reports (via Admin API)
- Feedback management (via Admin API)

**Key Pages:**

- `/admin/login`
- `/admin/dashboard`
- `/admin/videos`
- `/admin/users`
- `/admin/subscriptions`
- `/admin/knowledge`
- `/admin/feedback`

---

#### 3.2 Public Website (Next.js)

**Priority: MEDIUM**

**API Connection:**

- Connects to **Member API** (`api-member.zfitdance.com`)

**Tasks:**

- Landing page
- User registration/login (via Member API)
- Knowledge sections (free access via Member API)
- Pricing page
- Features page
- About/FAQ/Contact pages

**Key Pages:**

- `/` (landing)
- `/register`
- `/login`
- `/knowledge/fitness`
- `/knowledge/dance`
- `/pricing`
- `/features`

---

#### 3.3 Mobile App (React Native)

**Priority: HIGH** (main product)

**API Connection:**

- Connects to **Member API** (`api-member.zfitdance.com`)

**Tasks:**

- Set up React Native project
- Navigation setup
- Authentication screens (via Member API)
- Video browsing (by style, intensity via Member API)
- Video player (Cloudflare Stream via Member API)
- Subscription management (via Member API)
- Playlist features (via Member API)
- Rating/feedback (via Member API)
- Knowledge sections (via Member API)
- Profile/settings (via Member API)

**Key Screens:**

- Login/Register
- Home/Dashboard
- Video Browse
- Video Player
- Playlists
- Subscriptions
- Knowledge
- Profile

---

## 🚀 Recommended Development Order

### **Option 1: Sequential (Single Developer/Small Team)**

```
Week 1-2: Database + Backend Setup
Week 3-6: Backend API Development
Week 7-9: Admin Panel (to manage content)
Week 10-12: Mobile App (main product)
Week 13-14: Public Website
Week 15+: Testing, Bug fixes, App Store submission
```

### **Option 2: Parallel (Multiple Developers)**

```
Team 1 (Backend):
Week 1-2: Database + Backend Setup
Week 3-6: Backend API Development

Team 2 (Frontend):
Week 3-4: Admin Panel (starts after basic APIs ready)
Week 5-8: Mobile App (starts after core APIs ready)
Week 9-10: Public Website

Week 11+: Integration, Testing, Bug fixes
```

---

## 📊 Development Priority Matrix

| Component           | Priority    | Dependencies | Can Start After |
| ------------------- | ----------- | ------------ | --------------- |
| **Database Schema** | 🔴 Critical | None         | Immediately     |
| **Member API**      | 🔴 Critical | Database     | Week 1          |
| **Admin API**       | 🔴 Critical | Database     | Week 1          |
| **Admin Panel**     | 🟠 High     | Admin API    | Week 3          |
| **Mobile App**      | 🟠 High     | Member API   | Week 3          |
| **Public Website**  | 🟡 Medium   | Member API   | Week 5          |

---

## ✅ Milestones & Checkpoints

### **Milestone 1: Backend Foundation (End of Week 2)**

- ✅ Database schema complete
- ✅ Member API project setup
- ✅ Admin API project setup
- ✅ Shared database connection configured
- ✅ Basic authentication working (both APIs)
- ✅ API documentation accessible (both APIs)

### **Milestone 2: Core APIs Ready (End of Week 6)**

- ✅ All MVP Member APIs implemented
- ✅ All MVP Admin APIs implemented
- ✅ Authentication complete (both APIs)
- ✅ Video management working
- ✅ Subscription system working
- ✅ Payment integration (MMQR) ready

### **Milestone 3: Admin Panel Complete (End of Week 9)**

- ✅ Admin can manage videos
- ✅ Admin can manage users
- ✅ Admin can manage subscriptions
- ✅ Content can be added via admin

### **Milestone 4: Mobile App MVP (End of Week 12)**

- ✅ Users can register/login
- ✅ Users can browse videos
- ✅ Users can watch videos
- ✅ Users can subscribe
- ✅ Users can create playlists

### **Milestone 5: Public Website Complete (End of Week 14)**

- ✅ Landing page live
- ✅ User registration working
- ✅ Knowledge sections accessible

### **Milestone 6: Ready for Launch (End of Week 15+)**

- ✅ All features tested
- ✅ App Store submissions ready
- ✅ Production deployment complete

---

## 🛠️ Development Tools Setup

### **Required Accounts/Services:**

1. **Railway** - Backend hosting + PostgreSQL database
2. **Cloudflare Stream** - Video hosting
3. **Railway** - Backend hosting
4. **MMQR** - Payment gateway (API access)
5. **SendGrid** - Email service
6. **Firebase** - Push notifications + Analytics
7. **Sentry** - Error tracking
8. **Domain** - zfitdance.com

### **Development Tools:**

- **Git** - Version control
- **Postman/Insomnia** - API testing
- **VS Code** - Code editor
- **React Native CLI** - Mobile development
- **Prisma Studio** - Database GUI
- **Swagger UI** - API documentation

---

## 📝 Next Steps

1. **Set up development environment**

   - Install Node.js, React Native CLI
   - Set up Railway PostgreSQL database
   - Configure local PostgreSQL for development
   - Set up Cloudflare Stream account
   - Get MMQR API credentials

2. **Start with Database Schema**

   - Review all features
   - Design database tables
   - Create Prisma schema

3. **Begin Backend Development**

   - Initialize Member API project
   - Initialize Admin API project
   - Set up shared database schema (Prisma)
   - Set up basic structure for both projects
   - Implement authentication first (both APIs)

4. **Plan team allocation** (if multiple developers)
   - Assign backend developers
   - Assign frontend developers
   - Set up communication channels

---

## 💡 Tips for Success

1. **API-First Approach**: Build and test APIs before building frontends
2. **Incremental Development**: Build one feature at a time, test thoroughly
3. **Documentation**: Keep API documentation updated as you build
4. **Testing**: Write tests for critical features (auth, payments)
5. **Version Control**: Use Git branches for features, keep main branch stable
6. **Communication**: Regular check-ins if working in a team

---

**Which phase would you like to start with?**
