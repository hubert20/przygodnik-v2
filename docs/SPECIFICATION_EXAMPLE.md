# SuperW - System Specification (Living Document)

> **Status:** R&D Phase (Active Development)  
> **Last Updated:** 2026-01-18 (Mobile UI Updates, 6-step wizard documentation)  
> **Discovery Reference:** [`dev_docs/00_discovery/`](dev_docs/00_discovery/)  
> **Current Issues:** [`dev_docs/02_rnd/issues/`](dev_docs/02_rnd/issues/)

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Data Model](#data-model)
4. [API Endpoints](#api-endpoints)
5. [User Workflows](#user-workflows)
6. [Business Rules](#business-rules)
7. [Security & Authorization](#security--authorization)
8. [Known Issues & Pending Changes](#known-issues--pending-changes)

---

## Overview

**SuperW** is a scalable, multi-season recruitment platform for Szlachetna Paczka volunteer applications.

### Core Features

- **Multi-step registration wizard** (6 steps, dynamic form based on JSONB schema)
- **Recruiter panel** for managing applications (view, filter, search, change status)
- **Application details** with notes and audit history
- **Role-based access control** (ROLE_RECRUITER, ROLE_ADMIN)
- **Flexible form schema** (no code changes needed for form updates)

### Tech Stack

- **Frontend:** Vue 3 (Composition API) + TypeScript + Pinia + Vite + Tailwind CSS v4
- **Backend:** Symfony 7.4 LTS + PHP ^8.2 + Doctrine ORM
- **Database:** PostgreSQL 16 + JSONB (flexible schema)
- **Testing:** Vitest (frontend), PHPUnit (backend)
- **Deployment:** Docker Compose

---

## System Architecture

### Multi-Season, Multi-Role Design

```
┌──────────────────────────────────────────────────────────────┐
│                      RECRUITMENT SEASONS                      │
│  (2025, 2026, 2027...)                                       │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ├─ RECRUITMENT CAMPAIGNS (per role, per season)
                  │    ├─ Wolontariusz 2025 (form_schema: 7 steps)
                  │    ├─ Lider 2025 (form_schema: different)
                  │    └─ ...
                  │
                  └─ APPLICATIONS (stored in role-specific tables)
                       ├─ volunteer_applications (form_data JSONB)
                       └─ leader_applications (Phase 2)
```

**Key Concepts:**
- **Season** = Recruitment year (2025, 2026...)
- **Campaign** = Recruitment for a specific role in a specific season
- **Application** = User submission tied to a campaign
- **Form Schema** = JSONB defining form structure (questions, validation)
- **Form Data** = JSONB storing user answers (flexible, no migrations needed)

---

## Data Model

### Core Entities

#### 1. **users**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | VARCHAR(180) | Unique, used for login |
| `password` | VARCHAR(255) | Hashed (bcrypt/argon2) |
| `first_name` | VARCHAR(100) | User's first name |
| `last_name` | VARCHAR(100) | User's last name |
| `phone` | VARCHAR(20) | Optional phone number |
| `roles` | JSON | Array of roles (e.g., `["ROLE_RECRUITER"]`) |
| `created_at` | TIMESTAMP | Account creation date |
| `updated_at` | TIMESTAMP | Last update |

**Business Rules:**
- Email must be unique
- Password: min 10 chars, uppercase, lowercase, digit, special char
- Default role: `ROLE_USER` (volunteer applicant)

---

#### 2. **recruitment_seasons**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `year` | INT | Season year (e.g., 2025) |
| `name` | VARCHAR(100) | Display name (e.g., "Edycja 2025") |
| `start_date` | DATE | Season start date |
| `end_date` | DATE | Season end date |
| `is_active` | BOOLEAN | Only one season can be active |

**Business Rules:**
- Only one active season at a time
- Year must be unique
- Campaigns can only be created for existing seasons

---

#### 3. **recruitment_campaigns**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `season_id` | UUID | FK to `recruitment_seasons` |
| `role_type` | VARCHAR(50) | Role identifier (e.g., `volunteer`, `leader`) |
| `name` | VARCHAR(150) | Campaign name (e.g., "Wolontariusz 2025") |
| `form_schema` | JSONB | Form structure (questions, validation, steps) |
| `is_active` | BOOLEAN | Campaign active/inactive |

**Business Rules:**
- One active campaign per (season, role) pair
- `form_schema` structure:
  ```json
  {
    "version": "1.0",
    "total_steps": 6,
    "steps": [
      {
        "id": "region",
        "title": "Wybór regionu",
        "fields": [
          {"name": "voivodeship", "type": "select", "required": true},
          {"name": "district", "type": "select", "required": true}
        ]
      },
      {
        "id": "experience",
        "title": "Twoje doświadczenie",
        "fields": [
          {"name": "has_experience", "type": "radio", "required": true}
        ]
      },
      {
        "id": "email",
        "title": "Utwórz konto w systemie Szlachetnej Paczki",
        "conditional_step": true,
        "condition": "email_not_exists",
        "fields": [
          {"name": "email", "type": "email", "required": true},
          {"name": "password", "type": "password", "required": true},
          {"name": "password_confirmation", "type": "password", "required": true}
        ]
      },
      {
        "id": "personal",
        "title": "Twoje dane do zgłoszenia",
        "conditional_step": true,
        "condition": "email_not_exists",
        "fields": [
          {"name": "first_name", "type": "text", "required": true},
          {"name": "last_name", "type": "text", "required": true},
          {"name": "phone", "type": "tel", "required": true},
          {"name": "age_confirmation", "type": "checkbox", "required": true}
        ]
      },
      {
        "id": "motivation",
        "title": "Powiedz nam więcej o sobie",
        "fields": [
          {"name": "motivation", "type": "textarea", "required": true},
          {"name": "skills", "type": "textarea", "required": true}
        ]
      },
      {
        "id": "consents",
        "title": "Twoje zgody",
        "fields": [
          {"name": "consent_required", "type": "checkbox", "required": true},
          {"name": "consent_marketing", "type": "checkbox", "required": false}
        ]
      }
    ]
  }
  ```

**Registration Form Steps (Total: 6)**

1. **Step 1: Region Selection** (`region`)
   - Voivodeship (województwo) - select
   - District (rejon) - select
   - Mobile: Labels hidden, placeholders show "Wybierz województwo *" / "Wybierz rejon *"

2. **Step 2: Experience + Email** (`email`)
   - Has previous experience with Szlachetna Paczka? - radio (TAK/NIE)
   - Email address - email (async validation, 800ms debounce)
   - CAPTCHA verification
   - Mobile: CAPTCHA above RODO text, smaller tooltip font

3. **Step 3: Create Account** (`account`)
   - Password - password (min 8 chars, uppercase, lowercase, digit, special char)
   - Password confirmation - password
   - Mobile: Tooltip displayed below password fields (not side-by-side)

4. **Step 4: Personal Data** (`personal`)
   - First name - text
   - Last name - text
   - Phone number - tel (9 digits)
   - Age confirmation (18+) - checkbox ("Potwierdzam, że mam ukończone 18 lat")
   - Mobile: Phone field full width

5. **Step 5: About You** (`motivation`)
   - "Dlaczego chcesz pomagać ze Szlachetną Paczką?" - textarea (min 30 chars)
   - "Które z Twoich cech, umiejętności lub doświadczeń, pomogą Ci pełnić rolę wolontaryjną?" - textarea (min 30 chars)
   - Character counter displayed for each field

6. **Step 6: Consents** (`consents`)
   - Required consent (GDPR, terms of service) - checkbox
   - Optional marketing consent - checkbox
   - Mobile: Submit button "Przesyłam zgłoszenie" fits on single line

**Changes from Discovery (2026-01-11):**
- ✅ Password moved from Step 4 to Step 3 (with email)
- ✅ Added password_confirmation field
- ✅ Added age_confirmation checkbox to Step 4
- ✅ Removed Step 6 "Additional Info" (availability, additional_notes) - not in mockups
- ✅ Updated Step 5 labels to match mockups exactly
- ✅ Total steps reduced from 7 to 6

**Mobile UI Changes (2026-01-18):**
- ✅ Header: `tlo.jpg` background instead of logo
- ✅ Navigation: "< Poprzedni krok" inline with "Przechodzę dalej >" button
- ✅ Progress bar: Red line width = (currentStep / totalSteps) * 100%
- ✅ Step 1: Dropdown labels hidden on mobile
- ✅ Success page: Horizontal numbered steps layout

---

#### 4. **volunteer_applications**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to `users` (volunteer) |
| `campaign_id` | UUID | FK to `recruitment_campaigns` |
| `season_id` | UUID | FK to `recruitment_seasons` (denormalized for perf) |
| `district_id` | UUID | FK to `districts` |
| `assigned_recruiter_id` | UUID | FK to `users` (recruiter) - **nullable** |
| `meeting_date` | TIMESTAMP | Scheduled meeting date - **nullable** |
| `status` | VARCHAR(50) | Application status (enum) |
| `badge` | VARCHAR(50) | Application badge (e.g., `weteran`, `nowy`) |
| `form_data` | JSONB | User's submitted form data |
| `submitted_at` | TIMESTAMP | Submission timestamp |

**Status Enum Values:**
- `nowy` (initial)
- `przypisany_do_rekrutera`
- `spotkanie`
- `umowa`
- `zrekrutowany` (final success)
- `odrzucony` (final reject)
- `zrezygnował` (final withdraw)

**Status Flow:**
```
nowy 
  → przypisany_do_rekrutera (assign recruiter)
    → spotkanie (set meeting date)
      → umowa
        → zrekrutowany

From ANY status → odrzucony OR zrezygnował (allowed)
```

**Badge Values:**
- `weteran` - has previous application in another season
- `nowy` - first-time applicant

**Business Rules:**
- One application per (user, campaign) pair
- `badge` is auto-determined at submission
- `form_data` must match `campaign.form_schema` structure
- Status changes logged in `audit_logs`

---

#### 5. **regions**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | VARCHAR(100) | Region name (e.g., "Małopolska") |
| `is_active` | BOOLEAN | Active/inactive |

---

#### 6. **districts**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `region_id` | UUID | FK to `regions` |
| `name` | VARCHAR(150) | District name |
| `is_active` | BOOLEAN | Active/inactive |

---

#### 7. **notes**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `application_id` | UUID | FK to `volunteer_applications` |
| `author_id` | UUID | FK to `users` (recruiter) |
| `content` | TEXT | Note content |
| `created_at` | TIMESTAMP | Creation timestamp |

**Business Rules:**
- Only recruiters can add notes
- Notes are immutable (no edit/delete)

---

#### 8. **audit_logs**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `entity_type` | VARCHAR(100) | Entity class name (e.g., `VolunteerApplication`) |
| `entity_id` | UUID | Entity ID |
| `user_id` | UUID | FK to `users` (who made the change) |
| `action` | VARCHAR(50) | Action type (e.g., `STATUS_CHANGED`) |
| `old_value` | TEXT | Previous value (nullable) |
| `new_value` | TEXT | New value (nullable) |
| `occurred_at` | TIMESTAMP | When the action occurred |

**Business Rules:**
- Immutable log (no updates/deletes)
- All status changes must be logged
- User ID required (who made the change)

---

### Indexes

| Index Name | Table | Columns | Type | Purpose |
|------------|-------|---------|------|---------|
| `idx_app_season_status` | `volunteer_applications` | `season_id, status` | BTREE | Fast filtering |
| `idx_form_data_gin` | `volunteer_applications` | `form_data` | GIN | JSONB queries |
| `idx_notes_app` | `notes` | `application_id` | BTREE | Fast note lookup |
| `idx_audit_entity` | `audit_logs` | `entity_type, entity_id` | BTREE | Fast audit lookup |

---

## API Endpoints

### Public Endpoints

#### `GET /api/public/campaigns/active`
Get the currently active campaign.

**Response:**
```json
{
  "id": "uuid",
  "name": "Wolontariusz 2025",
  "season": { "id": "uuid", "year": 2025, "name": "Edycja 2025" }
}
```

---

#### `GET /api/public/campaigns/{id}/schema`
Get form schema for a campaign.

**Response:**
```json
{
  "steps": [
    {
      "id": "step1",
      "title": "Wybór regionu",
      "fields": [...]
    }
  ]
}
```

---

#### `POST /api/public/registration/check-email`
Check if email is already registered.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "available": true,
  "has_previous_application": false
}
```

---

#### `POST /api/public/registration/submit`
Submit a volunteer application.

**Request:**
```json
{
  "campaignId": "uuid",
  "districtId": "uuid",
  "formData": {
    "email": "user@example.com",
    "password": "SecurePass123!@#",
    "password_confirmation": "SecurePass123!@#",
    "first_name": "Jan",
    "last_name": "Kowalski",
    "phone": "123456789",
    "has_experience": false,
    "motivation": "...",
    "skills": "...",
    "consent_required": true,
    "consent_marketing": false
  }
}
```

**Response:**
```json
{
  "message": "Dziękujemy za zgłoszenie! Otrzymasz email z potwierdzeniem.",
  "application": {
    "id": "uuid",
    "status": "nowy",
    "badge": "nowy",
    "submitted_at": "2026-01-11T10:00:00Z",
    "formData": {
      "first_name": "Jan",
      "last_name": "Kowalski",
      "phone": "123456789",
      "has_experience": false,
      "motivation": "...",
      "skills": "...",
      "consent_required": true,
      "consent_marketing": false
    }
  }
}
```

**🔴 CRITICAL SECURITY: Password Handling**

**Passwords are handled securely:**
1. User submits `password` and `password_confirmation` in Step 3 ("Email")
2. Backend validates password match (handled by `UserService`)
3. Backend hashes password using Symfony `UserPasswordHasherInterface` (bcrypt/argon2)
4. Hashed password stored in `users.password` column
5. **Passwords NEVER stored in `volunteer_applications.form_data`** (removed before storage)
6. **Passwords NEVER returned in API responses** (filtered by `ApplicationDetailDTO`)

**Important:** If you see `password` in `formData` in the database, this is **legacy data** from before 2026-01-11. New applications will NOT have this.

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one digit (0-9)
- At least one special character (@$!%*?&#)

---

#### `GET /api/public/regions`
Get list of active regions with districts.

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Małopolska",
    "districts": [
      { "id": "uuid", "name": "Kraków Śródmieście" }
    ]
  }
]
```

---

### Protected Endpoints (Recruiter)

#### `POST /api/auth/login`
Authenticate user.

**Request:**
```json
{
  "email": "recruiter@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "recruiter@example.com",
    "firstName": "Anna",
    "lastName": "Kowalska",
    "roles": ["ROLE_RECRUITER"]
  }
}
```

---

#### `POST /api/auth/logout`
Logout current user.

---

#### `GET /api/auth/me`
Get current user info.

---

#### `GET /api/auth/check`
Check if user is authenticated.

**Response:**
```json
{
  "authenticated": true
}
```

---

#### `GET /api/applications`
List applications with filters.

**Query Params:**
- `season_id` (UUID, optional)
- `status` (string, optional)
- `search` (string, optional) - searches name, email, district
- `page` (int, default: 1)
- `limit` (int, default: 25)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "volunteer": { "firstName": "Jan", "lastName": "Kowalski", "email": "..." },
      "district": { "id": "uuid", "name": "..." },
      "status": "nowy",
      "badge": "nowy",
      "submittedAt": "2025-01-11T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 150
  }
}
```

---

#### `GET /api/applications/{id}`
Get application details.

**Response:**
```json
{
  "id": "uuid",
  "volunteer": { ... },
  "district": { ... },
  "region": { ... },
  "status": "nowy",
  "badge": "nowy",
  "formData": { ... },
  "assignedRecruiter": { ... } | null,
  "meetingDate": "2025-01-15T14:00:00Z" | null,
  "submittedAt": "2025-01-11T10:00:00Z",
  "notes": [...],
  "auditLog": [...]
}
```

---

#### `PATCH /api/applications/{id}/status`
Change application status.

**Request:**
```json
{
  "status": "przypisany_do_rekrutera"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "przypisany_do_rekrutera",
  "updated_at": "2025-01-11T11:00:00Z"
}
```

**Validation:**
- Status transition must be valid per business rules
- Creates audit log entry

---

#### `POST /api/applications/{id}/assign-recruiter`
Assign a recruiter to an application.

**Request:**
```json
{
  "recruiterId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "assignedRecruiter": {
    "id": "uuid",
    "firstName": "Anna",
    "lastName": "Kowalska"
  }
}
```

---

#### `POST /api/applications/{id}/set-meeting-date`
Set meeting date for an application.

**Request:**
```json
{
  "meetingDate": "2025-01-15T14:00:00Z"
}
```

**Response:**
```json
{
  "id": "uuid",
  "meetingDate": "2025-01-15T14:00:00Z"
}
```

---

#### `POST /api/applications/{id}/notes`
Add a note to an application.

**Request:**
```json
{
  "content": "Rozmowa telefoniczna - bardzo zmotywowany."
}
```

**Response:**
```json
{
  "id": "uuid",
  "content": "...",
  "author": { "firstName": "Anna", "lastName": "Kowalska" },
  "createdAt": "2025-01-11T11:00:00Z"
}
```

---

#### `GET /api/applications/{id}/notes`
Get all notes for an application.

**Response:**
```json
[
  {
    "id": "uuid",
    "content": "...",
    "author": { ... },
    "createdAt": "2025-01-11T11:00:00Z"
  }
]
```

---

#### `GET /api/applications/{id}/audit-log`
Get audit log for an application.

**Response:**
```json
[
  {
    "id": "uuid",
    "action": "STATUS_CHANGED",
    "oldValue": "nowy",
    "newValue": "przypisany_do_rekrutera",
    "user": { "firstName": "Anna", "lastName": "Kowalska" },
    "occurredAt": "2025-01-11T11:00:00Z"
  }
]
```

---

#### `GET /api/applications/stats/status-counts`
Get count of applications per status.

**Query Params:**
- `season_id` (UUID, optional)

**Response:**
```json
{
  "nowy": 45,
  "przypisany_do_rekrutera": 20,
  "spotkanie": 15,
  "umowa": 10,
  "zrekrutowany": 30,
  "odrzucony": 5,
  "zrezygnował": 3
}
```

---

#### `GET /api/seasons`
Get list of all seasons.

**Response:**
```json
[
  {
    "id": "uuid",
    "year": 2025,
    "name": "Edycja 2025",
    "isActive": true
  }
]
```

---

## User Workflows

### 1. Volunteer Registration (6-Step Wizard)

> **Updated 2026-01-18:** Wizard reduced to 6 steps. Mobile-specific UI changes implemented (simplified header, responsive navigation).

**Step 1: Wybór regionu**
- Select województwo (region) - dropdown
- Select rejon (district) - dropdown (dependent on województwo)
- Mobile: Labels hidden (dropdowns show placeholder text)
- Navigate: Next →

**Step 2: E-mail**
- Question: "Czy pomagałeś z nami w tej roli w poprzedniej edycji?" - TAK / NIE
- Enter email address
- System checks if email is available (async, 800ms debounce)
- If taken: show error "Ten email jest już zarejestrowany"
- CAPTCHA verification (above RODO text on mobile)
- Navigate: ← Prev | Next →

**Step 3: Utwórz konto**
- Enter password (min 8 chars, uppercase, lowercase, digit, special char)
- Confirm password
- Tooltip with password requirements (displayed below fields on mobile)
- Navigate: ← Prev | Next →

**Step 4: Twoje dane**
- Enter: imię, nazwisko, telefon (9 digits)
- Checkbox: "Potwierdzam, że mam ukończone 18 lat"
- Mobile: Phone field full width
- Navigate: ← Prev | Next →

**Step 5: Powiedz nam więcej o sobie**
- Question 1: "Dlaczego chcesz pomagać ze Szlachetną Paczką?" - textarea (min 30 chars)
- Question 2: "Które z Twoich cech, umiejętności lub doświadczeń, pomogą Ci pełnić rolę wolontaryjną?" - textarea (min 30 chars)
- Character counter displayed
- Navigate: ← Prev | Next →

**Step 6: Twoje zgody**
- Required checkbox: "Wyrażam zgodę na przetwarzanie danych osobowych..."
- Optional checkbox: "Zgadzam się na otrzymywanie informacji marketingowych"
- Navigate: ← Prev | **Przesyłam zgłoszenie**

**Mobile-specific UI:**
- Header: Background image (`tlo.jpg`) instead of logo
- Navigation: "< Poprzedni krok" link next to "Przechodzę dalej >" button
- Progress bar: Red line grows proportionally with each step

**After Submission:**
- Redirect to success page (`/rejestracja/potwierdzenie`)
- Show message: "Skontaktujemy się z Tobą w ciągu 2 dni roboczych"
- Display next steps (Spotkanie → Rozmowa → Decyzja → Wdrożenie)
- Create `User` (if new email)
- Create `VolunteerApplication` with status `nowy`
- Determine badge (`weteran` if has previous app, else `nowy`)

---

### 2. Recruiter: View Applications

1. Login at `/login`
2. Redirect to `/recruiter/applications`
3. See list of applications (table view)
4. Filters:
   - Season dropdown
   - Status dropdown
   - Search box (name/email/district)
5. Click row → navigate to `/recruiter/applications/{id}`

---

### 3. Recruiter: Manage Application

**View Details:**
- Tabs: "Informacje z formularza" | "Notatki" | "Historia"
- **Tab 1 - Informacje z formularza:**
  - **Section: "Motywacja i umiejętności"** (primary focus)
    - Question 1: "Dlaczego chcesz pomagać ze Szlachetną Paczką?" (with character count)
    - Question 2: "Które z Twoich cech, umiejętności lub doświadczeń, pomogą Ci pełnić rolę wolontaryjną?" (with character count)
  - **Section: "Dodatkowe informacje"** (metadata)
    - Lokalizacja: Województwo + Rejon
    - Status: Badge "Weteran" / "Nowy wolontariusz"
    - Zgody: Marketing + Przetwarzanie danych
- **Tab 2 - Notatki:** List of notes + form to add new note
- **Tab 3 - Historia:** Audit log (status changes)

**Change Status:**
- Dropdown with allowed statuses (based on current status)
- On change: send `PATCH /api/applications/{id}/status`
- Show success notification

**Assign Recruiter:**
- When status = `przypisany_do_rekrutera`
- Dropdown of all recruiters
- On select: send `POST /api/applications/{id}/assign-recruiter`

**Set Meeting Date:**
- When status = `spotkanie`
- Date/time picker
- On select: send `POST /api/applications/{id}/set-meeting-date`

**Add Note:**
- Text area in "Notatki" tab
- On submit: send `POST /api/applications/{id}/notes`
- Note added to list immediately

---

## Business Rules

### Application Status Flow

**Allowed Transitions:**

```
nowy → przypisany_do_rekrutera
przypisany_do_rekrutera → spotkanie
spotkanie → umowa
umowa → zrekrutowany

ANY → odrzucony
ANY → zrezygnował
```

**NOT Allowed:**
- `nowy` → `spotkanie` (must go through `przypisany_do_rekrutera`)
- `zrekrutowany` → any other status (final state)
- `odrzucony` → any other status (final state)
- `zrezygnował` → any other status (final state)

**Implementation:**
- `ApplicationService::isValidTransition(string $from, string $to): bool`
- If invalid transition: throw `BadRequestException`

---

### Badge Determination

**Logic:**
```php
// In ApplicationService::determineBadge()

if (user has any previous VolunteerApplication in different season) {
    return 'weteran';
} else {
    return 'nowy';
}
```

**Badge is assigned once at submission and never changes.**

---

### Duplicate Prevention

**Rule:** One application per (user, campaign) pair.

**Implementation:**
```php
// In ApplicationService::createApplication()

$existing = $this->applicationRepository->findOneBy([
    'user' => $user,
    'campaign' => $campaign,
]);

if ($existing) {
    throw new ConflictException('User already has an application for this campaign');
}
```

---

### Form Schema Validation

**Rule:** `formData` submitted by user must match `campaign.form_schema` structure.

**Validation:**
- Required fields must be present
- Field types must match (string, date, boolean, etc.)
- Values must pass custom validators (if defined in schema)

**Security:**
- Max JSONB size: 100 KB
- Max nesting depth: 5 levels
- XSS prevention: `strip_tags()` on all string values

---

### JSONB Immutable Snapshots

**Rule:** `campaign.form_schema` is **immutable** once a campaign is active.

**Rationale:**
- Applications store `form_data` based on the schema at submission time
- Changing schema would break historical data integrity

**Process for Schema Changes:**
1. Deactivate old campaign
2. Create new campaign with updated schema
3. New applications use new schema

---

## Security & Authorization

### Authentication

- **Method:** Session-based (Symfony Security)
- **Login:** `POST /api/auth/login` (email + password)
- **Logout:** `POST /api/auth/logout`
- **Session Timeout:** 30 minutes of inactivity

---

### Authorization

**Roles:**
- `ROLE_USER` - volunteers (default)
- `ROLE_RECRUITER` - can view/manage applications
- `ROLE_ADMIN` - full access (Phase 2)

**Access Control:**
- All `/api/public/*` endpoints: anonymous
- All `/api/auth/*` endpoints: anonymous (login) or authenticated (logout/me)
- All `/api/applications/*` endpoints: `ROLE_RECRUITER` required
- All `/api/seasons/*` endpoints: `ROLE_RECRUITER` required

**Voter Pattern:**
- `ApplicationVoter` - checks if user can view/edit specific application
- Currently: all recruiters can view all applications (business requirement)
- Future: campaign-level access control (Phase 2)

---

### Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/auth/login` | 5 requests | 1 minute |
| `POST /api/public/registration/check-email` | 10 requests | 1 minute |
| `POST /api/public/registration/submit` | 3 requests | 1 minute |
| All other API endpoints | 100 requests | 1 minute |

**Implementation:** Symfony RateLimiter component

---

### OWASP Top 10 Compliance

| Risk | Mitigation | Status |
|------|------------|--------|
| A01: Broken Access Control | Voters + role checks | ✅ |
| A02: Cryptographic Failures | bcrypt/argon2, HTTPS | ✅ |
| A03: Injection | Doctrine ORM (no raw SQL), JSONB validation | ✅ |
| A04: Insecure Design | TDD, security audit | ✅ |
| A05: Security Misconfiguration | Symfony defaults, CSP headers | ✅ |
| A06: Vulnerable Components | Composer/npm audit | ✅ |
| A07: Authentication Failures | Password policy, rate limiting | ✅ |
| A08: Data Integrity Failures | CSRF tokens, input validation | ✅ |
| A09: Logging Failures | Audit logs, Monolog | ✅ |
| A10: SSRF | No external requests from user input | ✅ |

---

## Known Issues & Pending Changes

### Critical Issues

| Issue ID | Description | Status | Link |
|----------|-------------|--------|------|
| `2026-01-10_status-flow-fix` | Status flow does not match mockups (missing `umowa`, `zrezygnował`). Fields missing: `assigned_recruiter_id`, `meeting_date`. Form questions don't match mockups. | ✅ **RESOLVED** (2026-01-10) | [Issue](dev_docs/02_rnd/issues/2026-01-10_status-flow-fix/) |
| `2026-01-11_form-schema-password-fix` | **CRITICAL SECURITY:** Password stored in plain text in `formData`. Form schema does not match mockups (password in wrong step, extra step, incorrect labels). | ✅ **RESOLVED** (2026-01-11) | [Issue](dev_docs/02_rnd/issues/2026-01-11_form-schema-password-fix/) |
| `2026-01-11_recruiter-panel-redesign` | Recruiter panel tab "Dane z formularza" displayed raw `formData` dump (unstructured, hard to scan). Redesigned with visual hierarchy, question cards, and info grid for better UX. | ✅ **RESOLVED** (2026-01-11) | [Issue](dev_docs/02_rnd/issues/2026-01-11_recruiter-panel-redesign/) |

---

### Phase 2 Features (Not Yet Implemented)

- [ ] Admin UI for season/campaign management
- [ ] Leader role applications
- [ ] Export functionality (CSV/Excel)
- [ ] Email notifications (confirmation, status changes)
- [ ] Campaign-level access control (assign recruiters to specific campaigns)
- [ ] Batch operations (bulk status change)
- [ ] OpenAPI/Swagger documentation

---

### Future Optimizations

- [ ] Database partitioning by season (for large-scale data)
- [ ] Redis caching for form schemas
- [ ] ElasticSearch for advanced search
- [ ] WebSocket for real-time notifications

---

## Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-01-10 | 1.0.0 | Initial specification based on discovery + implementation | system |
| 2026-01-10 | 1.1.0 | Added status flow corrections, missing fields identified | system |

---

**Next Steps:**
1. ✅ Fix status flow issue (see `dev_docs/02_rnd/issues/2026-01-10_status-flow-fix/`)
2. ✅ Implement missing endpoints (notes, audit log) - **DONE**
3. ⏳ Add production deployment script
4. ⏳ OpenAPI documentation
