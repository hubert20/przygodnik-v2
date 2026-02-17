# SuperW - System Architecture

> **Last Updated:** 2026-01-18  
> **Stack:** Vue 3 + Symfony 7.4 LTS + PostgreSQL 16  
> **Deployment:** Docker Compose

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Architecture](#data-architecture)
5. [Security Architecture](#security-architecture)
6. [Deployment Architecture](#deployment-architecture)
7. [Development Workflow](#development-workflow)

---

## Overview

SuperW follows a **clean, layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────┐
│             FRONTEND (Vue 3 + TS)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │  Views   │  │  Stores  │  │Components│     │
│  │ (Pages)  │→ │  (Pinia) │← │  (UI)    │     │
│  └──────────┘  └──────────┘  └──────────┘     │
│        │             │              ↑          │
│        └─────────────┴──────────────┘          │
│                      │ HTTP API                │
└──────────────────────┼─────────────────────────┘
                       │
┌──────────────────────┼─────────────────────────┐
│         BACKEND (Symfony 7.4 LTS + PHP ^8.2)    │
│  ┌──────────────────────────────────────┐     │
│  │         Controllers (API)            │     │
│  │  - RegistrationController            │     │
│  │  - AuthController                    │     │
│  │  - ApplicationController             │     │
│  └───────────────┬──────────────────────┘     │
│                  │                             │
│  ┌───────────────┴──────────────────────┐     │
│  │         Services (Business Logic)    │     │
│  │  - ApplicationService                │     │
│  │  - UserService                       │     │
│  └───────────────┬──────────────────────┘     │
│                  │                             │
│  ┌───────────────┴──────────────────────┐     │
│  │    Repositories (Data Access)        │     │
│  │  - ApplicationRepository             │     │
│  │  - UserRepository                    │     │
│  └───────────────┬──────────────────────┘     │
│                  │ Doctrine ORM                │
└──────────────────┼─────────────────────────────┘
                   │
┌──────────────────┼─────────────────────────────┐
│          DATABASE (PostgreSQL 16)               │
│  ┌──────────────────────────────────────┐     │
│  │  Tables: users, volunteer_applications│     │
│  │          recruitment_seasons          │     │
│  │          recruitment_campaigns        │     │
│  │          regions, districts, notes... │     │
│  └──────────────────────────────────────┘     │
└─────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Vue.js | 3.5+ | Progressive UI framework |
| **Language** | TypeScript | 5.6+ | Type safety |
| **State Management** | Pinia | 2.3+ | Reactive stores |
| **Router** | Vue Router | 4.5+ | Client-side routing |
| **Build Tool** | Vite | 6.4+ | Fast dev server & build |
| **Styling** | Tailwind CSS | 4.x | Utility-first CSS |
| **HTTP Client** | Axios | 1.7+ | API communication |
| **Testing** | Vitest | 2.1+ | Unit tests |
| **Testing** | Vue Test Utils | 2.4+ | Component tests |
| **Testing** | Happy DOM | 16.14+ | DOM simulation |

**Key Patterns:**
- **Composition API** (`<script setup lang="ts">`)
- **Composables** for shared logic (`use*` functions)
- **Setup Stores** (Pinia) for state management
- **DTO Types** for API contracts
- **Dynamic Form Renderer** for schema-based forms (see below)

**Dynamic Form Architecture:**

The registration form is rendered dynamically based on a schema fetched from the backend. This ensures frontend and backend are always in sync.

```
Backend form_schema (JSONB)
    ↓ GET /api/public/campaigns/{id}/schema
Frontend DynamicFormRenderer
    ├─> DynamicFieldRenderer (router)
    │     ├─> TextField (text, email, password, tel)
    │     ├─> TextareaField (textarea)
    │     ├─> SelectField (select)
    │     ├─> RadioField (radio)
    │     └─> CheckboxField (checkbox)
    └─> FormValidation (utils/formValidation.ts)
```

**Benefits:**
- ✅ **Single source of truth**: Backend owns form structure
- ✅ **Flexibility**: Change form without deploying frontend
- ✅ **Consistency**: Frontend and backend always in sync
- ✅ **Multi-campaign**: Different campaigns can have different forms

**Responsive Design (Mobile-first):**
- **Mobile Header**: Background image (`tlo.jpg`) replaces logo on screens < 768px
- **Navigation**: "< Poprzedni krok" button positioned inline with "Przechodzę dalej >"
- **Progress Bar**: Red line grows proportionally (step / total_steps * 100%)
- **Form Fields**: Full-width dropdowns and inputs on mobile; labels hidden where placeholders suffice
- **Success Page**: Horizontal layout for numbered steps on mobile

**References:**
- ADR: `dev_docs/02_rnd/issues/2026-01-11_dynamic-form-renderer/ADR_001_FORM_SCHEMA_SOURCE_OF_TRUTH.md`
- Design: `dev_docs/02_rnd/issues/2026-01-11_dynamic-form-renderer/ARCHITECTURE_DESIGN.md`

---

### Backend

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Symfony | 7.4.* (LTS) | PHP framework |
| **Language** | PHP | ^8.2 | Server-side language |
| **ORM** | Doctrine | 3.1+ | Database abstraction |
| **Database** | PostgreSQL | 16+ | Relational database |
| **Authentication** | Symfony Security | 7.4.* | Session-based auth |
| **Validation** | Symfony Validator | 7.4.* | Input validation |
| **Serialization** | Symfony Serializer | 7.4.* | JSON encoding/decoding |
| **Rate Limiting** | Symfony RateLimiter | 7.4.* | API rate limiting |
| **CORS** | NelmioCorsBundle | 2.6+ | Cross-origin requests |
| **Testing** | PHPUnit | 11.5+ | Unit & functional tests |

**Key Patterns:**
- **Controller-Service-Repository** architecture
- **DTOs** for request/response (never expose entities directly)
- **Voters** for authorization logic
- **Services** as final classes with constructor DI
- **Traits** for reusable controller logic

---

### Infrastructure

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Containerization** | Docker | 27+ | Application containers |
| **Orchestration** | Docker Compose | v2 | Multi-container setup |
| **Web Server** | Nginx | 1.27+ | Reverse proxy & static files |
| **PHP Runtime** | PHP-FPM | ^8.2 | FastCGI Process Manager |
| **Database** | PostgreSQL | 16-alpine | Data persistence |

---

## System Components

### Frontend Structure

```
frontend/
├── src/
│   ├── main.ts                    # App entry point
│   ├── App.vue                    # Root component
│   ├── router/
│   │   └── index.ts               # Vue Router config
│   ├── stores/
│   │   ├── auth.ts                # Auth state (login, user)
│   │   ├── campaign.ts            # Campaign data
│   │   ├── application.ts         # Application management
│   │   ├── registration.ts        # Registration wizard
│   │   └── ...
│   ├── views/
│   │   ├── public/
│   │   │   ├── HomeView.vue       # Landing page
│   │   │   └── RegistrationView.vue  # 6-step wizard
│   │   ├── auth/
│   │   │   └── LoginView.vue      # Login page
│   │   └── recruiter/
│   │       ├── ApplicationListView.vue   # Applications table
│   │       └── ApplicationDetailView.vue # Application details
│   ├── components/
│   │   ├── registration/
│   │   │   ├── RegistrationWizard.vue
│   │   │   ├── StepRegion.vue
│   │   │   ├── StepExperience.vue
│   │   │   └── ...
│   │   └── ui/
│   │       ├── AppButton.vue
│   │       ├── AppInput.vue
│   │       └── ...
│   ├── composables/
│   │   └── useApi.ts              # API client wrapper
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── utils/
│       └── validators.ts          # Validation helpers
├── vite.config.ts                 # Vite configuration
├── vitest.config.ts               # Vitest configuration
├── tailwind.config.js             # Tailwind CSS config
└── tsconfig.json                  # TypeScript config
```

**Key Responsibilities:**
- **Views:** Page-level components, use stores for state
- **Stores:** Reactive state + API calls, business logic
- **Components:** Reusable UI building blocks
- **Composables:** Shared logic (e.g., API client, form handling)
- **Types:** TypeScript interfaces for type safety

---

### Backend Structure

```
backend/
├── src/
│   ├── Kernel.php                 # Symfony kernel
│   ├── Controller/
│   │   ├── RegistrationController.php   # Public registration API
│   │   ├── AuthController.php           # Login/logout/me
│   │   ├── ApplicationController.php    # Application management
│   │   ├── RegionController.php         # Public regions API
│   │   ├── SeasonController.php         # Seasons list
│   │   ├── CampaignController.php       # Campaign details
│   │   └── Trait/
│   │       └── UuidValidationTrait.php  # UUID validation
│   ├── Service/
│   │   ├── Application/
│   │   │   ├── ApplicationService.php   # Core business logic
│   │   │   ├── ApplicationStatusService.php  # Status transitions
│   │   │   ├── ApplicationFilterService.php  # Filtering & search
│   │   │   └── ApplicationBadgeService.php   # Badge determination
│   │   ├── User/
│   │   │   └── UserService.php          # User management
│   │   └── RateLimiter/
│   │       └── RateLimiterService.php   # Rate limit helpers
│   ├── Entity/
│   │   ├── User.php
│   │   ├── RecruitmentSeason.php
│   │   ├── RecruitmentCampaign.php
│   │   ├── VolunteerApplication.php
│   │   ├── Region.php
│   │   ├── District.php
│   │   ├── Note.php
│   │   └── AuditLog.php
│   ├── Repository/
│   │   ├── UserRepository.php
│   │   ├── RecruitmentSeasonRepository.php
│   │   ├── RecruitmentCampaignRepository.php
│   │   ├── VolunteerApplicationRepository.php
│   │   ├── RegionRepository.php
│   │   ├── DistrictRepository.php
│   │   ├── NoteRepository.php
│   │   └── AuditLogRepository.php
│   ├── DTO/
│   │   ├── Request/
│   │   │   ├── RegistrationRequest.php
│   │   │   ├── LoginRequest.php
│   │   │   └── StatusChangeRequest.php
│   │   └── Response/
│   │       ├── ApplicationDetailDTO.php
│   │       ├── ApplicationListItemDTO.php
│   │       └── ...
│   ├── Security/
│   │   ├── Voter/
│   │   │   └── ApplicationVoter.php     # Authorization logic
│   │   ├── AuthenticationSuccessHandler.php
│   │   └── AuthenticationFailureHandler.php
│   └── DataFixtures/
│       ├── UserFixtures.php
│       ├── SeasonFixtures.php
│       ├── CampaignFixtures.php
│       ├── RegionFixtures.php
│       └── ApplicationFixtures.php
├── config/
│   ├── packages/
│   │   ├── doctrine.yaml          # ORM configuration
│   │   ├── security.yaml          # Auth & authorization
│   │   ├── rate_limiter.yaml      # Rate limiting rules
│   │   ├── nelmio_cors.yaml       # CORS configuration
│   │   └── ...
│   ├── routes.yaml                # API routing
│   └── services.yaml              # Dependency injection
├── migrations/
│   ├── Version20260110090554.php  # Initial schema
│   ├── Version20260110090828.php  # Add indexes
│   └── ...
├── tests/
│   ├── Unit/
│   │   ├── Entity/                # Entity tests
│   │   ├── Service/               # Service tests
│   │   └── Security/              # Voter tests
│   └── Functional/
│       ├── Controller/            # API endpoint tests
│       └── Repository/            # Repository tests
└── phpunit.xml.dist               # PHPUnit configuration
```

**Key Responsibilities:**
- **Controllers:** HTTP request/response, thin layer
- **Services:** Business logic, orchestration
- **Repositories:** Custom queries, data access
- **Entities:** Domain models (ORM mappings)
- **DTOs:** API contracts, validation
- **Voters:** Authorization decisions

---

## Data Architecture

### Database Schema

See [`SPECIFICATION.md`](SPECIFICATION.md#data-model) for detailed entity definitions.

**Key Design Decisions:**

1. **Multi-Season Design:**
   - `recruitment_seasons` table (2025, 2026...)
   - `volunteer_applications.season_id` (denormalized for performance)

2. **Multi-Role Design:**
   - Separate tables per role (`volunteer_applications`, `leader_applications`)
   - `recruitment_campaigns.role_type` identifies the role

3. **JSONB Flexible Schema:**
   - `recruitment_campaigns.form_schema` (JSONB) - defines form structure
   - `volunteer_applications.form_data` (JSONB) - stores submitted data
   - **No migrations needed** for form changes

4. **Audit Trail:**
   - `audit_logs` table - immutable log of all changes
   - `notes` table - recruiter notes on applications

5. **Performance Optimizations:**
   - Composite index: `(season_id, status)` on applications
   - GIN index: `form_data` (JSONB queries)
   - Denormalized `season_id` in applications (avoid JOIN)

---

### Data Flow

#### Registration Flow

```
1. User fills 6-step wizard (frontend)
   ↓
2. Frontend validates each step (Vee-Validate)
   ↓
3. Frontend submits to POST /api/public/registration/submit
   ↓
4. Backend validates (Symfony Validator)
   ↓
5. ApplicationService::createApplication()
   - Check duplicate (user + campaign)
   - Determine badge (weteran/nowy)
   - Create User (if new email)
   - Create VolunteerApplication
   ↓
6. Doctrine persists to database
   ↓
7. Return ApplicationDetailDTO to frontend
   ↓
8. Frontend shows success message
```

---

#### Status Change Flow

```
1. Recruiter clicks status dropdown (frontend)
   ↓
2. Frontend sends PATCH /api/applications/{id}/status
   ↓
3. ApplicationVoter checks if user can edit
   ↓
4. ApplicationStatusService::changeStatus()
   - Validate transition (isValidTransition)
   - Update application.status
   - Create AuditLog entry
   ↓
5. Doctrine persists to database
   ↓
6. Return updated ApplicationDetailDTO
   ↓
7. Frontend updates UI + shows notification
```

---

## Security Architecture

### Authentication

**Method:** Session-based (Symfony Security)

```
1. User submits credentials → POST /api/auth/login
   ↓
2. Symfony Security checks password (bcrypt/argon2)
   ↓
3. If valid: create session, return user data
   ↓
4. Session cookie stored in browser (HttpOnly, Secure, SameSite=Lax)
   ↓
5. Subsequent requests include session cookie
   ↓
6. Symfony Security loads user from session
```

**Session Configuration:**
- **Lifetime:** 30 minutes of inactivity
- **Cookie Flags:** `HttpOnly`, `Secure` (HTTPS only), `SameSite=Lax`
- **Storage:** File-based (PHP sessions)

---

### Authorization

**Roles:**
- `ROLE_USER` - default for volunteers
- `ROLE_RECRUITER` - can manage applications
- `ROLE_ADMIN` - full access (Phase 2)

**Access Control Matrix:**

| Endpoint Pattern | Required Role | Voter Check |
|-----------------|---------------|-------------|
| `/api/public/*` | Anonymous | N/A |
| `/api/auth/login` | Anonymous | N/A |
| `/api/auth/logout` | Authenticated | N/A |
| `/api/auth/me` | Authenticated | N/A |
| `/api/applications/*` | `ROLE_RECRUITER` | `ApplicationVoter` |
| `/api/seasons/*` | `ROLE_RECRUITER` | N/A |

**Voter Pattern:**
```php
// ApplicationVoter::voteOnAttribute()

switch ($attribute) {
    case 'VIEW':
        return $this->canView($user, $application);
    case 'EDIT':
        return $this->canEdit($user, $application);
}

private function canView(User $user, VolunteerApplication $application): bool
{
    // Currently: all recruiters can view all applications
    return $user->hasRole('ROLE_RECRUITER');
    
    // Future (Phase 2): campaign-level access control
    // return $user->hasRole('ROLE_RECRUITER') 
    //     && $user->hasAccessToCampaign($application->getCampaign());
}
```

---

### Input Validation

**Layers:**

1. **Frontend Validation** (Vee-Validate):
   - Email format
   - Required fields
   - Phone format
   - Date format

2. **Backend Validation** (Symfony Validator):
   - `@Assert\NotBlank`
   - `@Assert\Email`
   - `@Assert\Length`
   - `@Assert\Regex`
   - Custom validators (JSONB schema matching)

3. **JSONB Validation:**
   - Max size: 100 KB
   - Max depth: 5 levels
   - Type checking (string, int, bool, array, object)
   - XSS prevention: `strip_tags()` on all string values

**Example:**
```php
// DTO with validation constraints

class RegistrationRequest
{
    #[Assert\NotBlank]
    #[Assert\Email]
    private string $email;

    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 100)]
    private string $firstName;

    #[Assert\NotBlank]
    #[Assert\Uuid]
    private string $districtId;

    #[Assert\NotNull]
    #[Assert\Type('array')]
    private array $formData;
}
```

---

### Rate Limiting

**Configuration:**

| Limiter | Limit | Window | Endpoint |
|---------|-------|--------|----------|
| `login_limiter` | 5 requests | 1 minute | `POST /api/auth/login` |
| `email_check_limiter` | 10 requests | 1 minute | `POST /api/public/registration/check-email` |
| `registration_limiter` | 3 requests | 1 minute | `POST /api/public/registration/submit` |
| `api_limiter` | 100 requests | 1 minute | All other API endpoints |

**Implementation:**
```yaml
# config/packages/rate_limiter.yaml

framework:
    rate_limiter:
        login_limiter:
            policy: sliding_window
            limit: 5
            interval: '1 minute'
```

**Usage in Controller:**
```php
#[RateLimiter('login_limiter')]
public function login(LoginRequest $request): JsonResponse
{
    // ...
}
```

---

### CORS Configuration

**Allowed Origins:**
- Development: `http://localhost:5173` (Vite dev server)
- Production: `https://superw.example.com`

**Allowed Methods:** `GET`, `POST`, `PATCH`, `DELETE`, `OPTIONS`

**Allowed Headers:** `Content-Type`, `Authorization`, `X-Requested-With`

**Credentials:** Allowed (for session cookies)

---

### Security Headers

**Nginx Configuration:**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

---

## Deployment Architecture

### Docker Compose Setup

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: superw
      POSTGRES_USER: superw
      POSTGRES_PASSWORD: <secret>
    volumes:
      - db_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    depends_on:
      - db
    environment:
      DATABASE_URL: postgresql://superw:<secret>@db:5432/superw
      APP_ENV: prod
      APP_SECRET: <secret>
    volumes:
      - ./backend:/var/www/html
    ports:
      - "80:80"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      VITE_API_URL: http://backend:80
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app

volumes:
  db_data:
```

---

### Environment Variables

#### Backend (`.env`)

```bash
APP_ENV=prod
APP_SECRET=<generate with symfony>
DATABASE_URL=postgresql://superw:password@db:5432/superw

# CORS
CORS_ALLOW_ORIGIN=^https?://superw\.example\.com$

# Rate Limiting
RATE_LIMIT_ENABLED=true
```

#### Frontend (`.env`)

```bash
VITE_API_URL=http://backend:80
```

---

### Database Migrations

**Workflow:**

1. **Create Migration:**
   ```bash
   docker compose exec backend php bin/console make:migration
   ```

2. **Review Migration:**
   ```bash
   cat backend/migrations/VersionXXXXXXXXXXXXXX.php
   ```

3. **Dry-Run (Check SQL):**
   ```bash
   docker compose exec backend php bin/console doctrine:migrations:migrate --dry-run
   ```

4. **Execute Migration:**
   ```bash
   docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
   ```

5. **Rollback (if needed):**
   ```bash
   docker compose exec backend php bin/console doctrine:migrations:migrate prev --no-interaction
   ```

---

### Backup & Restore

**Backup:**
```bash
docker compose exec db pg_dump -U superw superw > backup_$(date +%Y%m%d).sql
```

**Restore:**
```bash
cat backup_20260110.sql | docker compose exec -T db psql -U superw superw
```

**Automated Daily Backups:**
```bash
# Cron job (daily at 2 AM)
0 2 * * * /usr/local/bin/backup-superw.sh
```

---

## Development Workflow

### Setup

1. **Clone Repository:**
   ```bash
   git clone <repo-url>
   cd superw
   ```

2. **Copy Environment Files:**
   ```bash
   cp env.example .env
   ```

3. **Start Docker Containers:**
   ```bash
   docker compose up -d
   ```

4. **Install Dependencies:**
   ```bash
   docker compose exec backend composer install
   docker compose exec frontend npm install
   ```

5. **Run Migrations:**
   ```bash
   docker compose exec backend php bin/console doctrine:migrations:migrate --no-interaction
   ```

6. **Load Fixtures:**
   ```bash
   docker compose exec backend php bin/console doctrine:fixtures:load --no-interaction
   ```

7. **Access Application:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:80`

---

### Testing

**Backend (PHPUnit):**
```bash
# All tests
docker compose exec backend php bin/phpunit

# Unit tests only
docker compose exec backend php bin/phpunit --testsuite=Unit

# Functional tests only
docker compose exec backend php bin/phpunit --testsuite=Functional

# Specific test
docker compose exec backend php bin/phpunit tests/Unit/Service/ApplicationServiceTest.php
```

**Frontend (Vitest):**
```bash
# All tests
docker compose exec frontend npm test

# Watch mode
docker compose exec frontend npm run test:watch

# Coverage
docker compose exec frontend npm run test:coverage
```

---

### Code Quality

**Backend:**
```bash
# PHP CS Fixer (auto-fix)
docker compose exec backend composer cs-fix

# PHP CS Fixer (dry-run)
docker compose exec backend composer cs-fix -- --dry-run

# PHPStan (static analysis)
docker compose exec backend composer phpstan
```

**Frontend:**
```bash
# ESLint
docker compose exec frontend npm run lint

# ESLint (auto-fix)
docker compose exec frontend npm run lint:fix

# Format (Prettier)
docker compose exec frontend npm run format
```

---

### Git Workflow

**Conventional Commits:**
```bash
feat(backend): add assignRecruiter endpoint
fix(frontend): correct status badge colors
docs(spec): update API endpoints section
test(backend): add ApplicationService unit tests
refactor(frontend): extract status badge to component
chore(deps): update Symfony to 7.4.1
```

**Branch Strategy:**
- `main` - production-ready code
- `develop` - integration branch
- `feature/xxx` - feature branches
- `fix/xxx` - bugfix branches

---

### Documentation

**Location:**
- **Specification:** `SPECIFICATION.md` (living document)
- **Architecture:** `ARCHITECTURE.md` (this file)
- **Guidelines:** `GUIDELINES.md` + `cursor-rules.md`
- **Discovery:** `dev_docs/00_discovery/` (frozen reference)
- **Implementation:** `dev_docs/01_implementation/` (archived tasks)
- **R&D Issues:** `dev_docs/02_rnd/issues/` (current issues)

---

## Performance Considerations

### Database

- **Indexes:** All FK columns + frequently filtered columns
- **GIN Indexes:** JSONB columns (`form_data`, `form_schema`)
- **Query Optimization:** Doctrine QueryBuilder (no N+1 queries)
- **Pagination:** 25 items per page (configurable)

### Caching (Phase 2)

- **Redis:** Form schemas, active campaigns
- **HTTP Cache:** Public endpoints (regions, campaigns)
- **Doctrine Result Cache:** Frequently accessed entities

### Frontend

- **Lazy Loading:** Routes split by chunk
- **Tree Shaking:** Vite eliminates unused code
- **Minification:** Production build minifies JS/CSS
- **CDN:** Static assets served from CDN (Phase 2)

---

## Monitoring & Logging

### Logging

**Backend (Monolog):**
- **Development:** `var/log/dev.log` (DEBUG level)
- **Production:** `var/log/prod.log` (ERROR level)
- **Channels:** `app`, `security`, `doctrine`

**Frontend (Console):**
- Development: Full console.log/warn/error
- Production: Errors only (sent to error tracking service)

### Error Tracking (Phase 2)

- **Sentry** for backend + frontend error tracking
- **New Relic** for performance monitoring

---

**Last Updated:** 2026-01-18  
**Next Review:** After Phase 2 features implementation
