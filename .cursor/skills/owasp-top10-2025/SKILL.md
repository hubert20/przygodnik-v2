# OWASP Top 10:2025 - Security Skill

> **Source:** [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
> **Stack:** Symfony 7.4 LTS + Vue 3 + PostgreSQL + Docker
> **Used by:** `security-auditor`, `code-architecture-reviewer`, `api-tester`, `plan-reviewer`

---

## Quick Reference

| # | Category | Changed from 2021 |
|---|----------|-------------------|
| **A01** | Broken Access Control | Same position |
| **A02** | Security Misconfiguration | UP from #5 |
| **A03** | Software Supply Chain Failures | Expanded (was "Vulnerable Components") |
| **A04** | Cryptographic Failures | DOWN from #2 |
| **A05** | Injection | DOWN from #3 |
| **A06** | Insecure Design | DOWN from #4 |
| **A07** | Authentication Failures | Same position |
| **A08** | Software or Data Integrity Failures | Same position |
| **A09** | Security Logging and Alerting Failures | Renamed (added "Alerting") |
| **A10** | Mishandling of Exceptional Conditions | **NEW** (replaces SSRF) |

> **Note:** SSRF (was A10:2021) is now merged into A01 (CWE-918 under Broken Access Control).

---

## A01:2025 - Broken Access Control

**What:** Users act outside intended permissions - unauthorized data access, privilege escalation, IDOR, CORS misconfiguration, CSRF, SSRF.

### Symfony Prevention

```php
// GOOD: Use Voters for complex authorization
#[IsGranted('EDIT', subject: 'post')]
public function edit(Post $post): JsonResponse { ... }

// GOOD: Deny by default in security.yaml
security:
    access_control:
        - { path: ^/api/admin, roles: ROLE_ADMIN }
        - { path: ^/api, roles: ROLE_USER }

// GOOD: Check ownership in Voter
public function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
{
    $user = $token->getUser();
    return $subject->getOwner() === $user; // Record ownership
}

// GOOD: CORS - restrict origins
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']  # NOT '*'

// GOOD: CSRF protection on state-changing forms
$form = $this->createForm(PostType::class, $post, ['csrf_protection' => true]);
```

### Vue Prevention

```typescript
// GOOD: Never trust frontend for authorization
// All security checks MUST happen server-side
// Frontend guards are for UX only

// GOOD: Route guards for UX (not security)
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return { name: 'forbidden' }
  }
})
```

### Checklist

- [ ] Authorization on ALL endpoints (not just frontend)
- [ ] Voters for complex auth logic (no manual if/role checks)
- [ ] No IDOR - ownership checks before data access
- [ ] CORS restricted to trusted origins
- [ ] CSRF tokens on all state-changing operations
- [ ] Deny by default in `security.yaml`
- [ ] Session invalidation on logout
- [ ] Rate limiting on sensitive endpoints

---

## A02:2025 - Security Misconfiguration

**What:** Insecure defaults, incomplete config, open cloud storage, unnecessary features, verbose errors, missing security headers.

### Symfony Prevention

```yaml
# config/packages/prod/framework.yaml
framework:
    # CRITICAL: Debug OFF in production
    # (set via APP_DEBUG=0 in .env.prod)

# Security headers (via NelmioCorsBundle or custom listener)
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000; includeSubDomains
# Content-Security-Policy: default-src 'self'
# X-XSS-Protection: 0  (deprecated, CSP preferred)

# config/packages/prod/monolog.yaml
monolog:
    handlers:
        main:
            type: fingers_crossed
            action_level: error
            # NO stack traces to users in production
```

```php
// GOOD: Custom error responses (no stack traces)
// Symfony handles this automatically in prod mode
// But verify: APP_ENV=prod, APP_DEBUG=0
```

### Docker Prevention

```yaml
# docker-compose.yml
services:
  db:
    ports: []  # NEVER expose DB to host in production
    # Only internal Docker network
  php:
    environment:
      APP_ENV: prod
      APP_DEBUG: '0'
```

### Checklist

- [ ] `APP_DEBUG=0` and `APP_ENV=prod` in production
- [ ] Security headers configured (HSTS, CSP, X-Frame-Options)
- [ ] No default credentials (admin/admin)
- [ ] Error messages generic (no stack traces to users)
- [ ] Unnecessary features/packages removed
- [ ] Database NOT exposed to internet (Docker internal network)
- [ ] `.env` files not in source control (`.gitignore`)
- [ ] Directory listing disabled

---

## A03:2025 - Software Supply Chain Failures

**What:** Vulnerabilities in third-party code, compromised dependencies, unmaintained packages, CI/CD pipeline weaknesses, malicious packages (typosquatting).

### Composer (PHP) Prevention

```bash
# Regular security audit
docker compose exec php composer audit

# Check for outdated packages
docker compose exec php composer outdated --direct

# Lock Symfony to 7.4.* (per project rules)
# Verify: no Symfony 8.x packages
docker compose exec php composer show "symfony/*" | grep -v "7.4"

# Validate lock file integrity
docker compose exec php composer validate --strict
```

### npm (Node.js) Prevention

```bash
# Regular security audit
docker compose exec node npm audit

# Auto-fix safe updates
docker compose exec node npm audit fix

# Check for outdated packages
docker compose exec node npm outdated
```

### CI/CD Prevention

- Use lock files (`composer.lock`, `package-lock.json`) - commit them!
- Pin exact versions in production
- Use only official package sources (packagist.org, npmjs.com)
- Enable Dependabot or Renovate for automated updates
- Generate SBOM (Software Bill of Materials) for releases

### Checklist

- [ ] `composer audit` clean (no critical/high CVEs)
- [ ] `npm audit` clean (no critical/high CVEs)
- [ ] Lock files committed and in sync
- [ ] All Symfony packages are 7.4.* (no 8.x)
- [ ] Docker base images up to date (security patches)
- [ ] No unmaintained dependencies
- [ ] CI/CD pipeline hardened (no secrets in logs)
- [ ] Dependency updates reviewed before merge

---

## A04:2025 - Cryptographic Failures

**What:** Weak hashing (MD5, SHA1), plaintext passwords, missing encryption at rest/transit, weak TLS, hardcoded keys.

### Symfony Prevention

```php
// GOOD: Symfony PasswordHasher (auto-selects best algorithm)
// config/packages/security.yaml
security:
    password_hashers:
        App\Entity\User:
            algorithm: auto  # Uses bcrypt/argon2 automatically

// GOOD: Use PasswordHasher service
$hashedPassword = $this->passwordHasher->hashPassword($user, $plainPassword);

// BAD: NEVER use MD5/SHA1 for passwords
// $hash = md5($password);  // VULNERABLE
// $hash = sha1($password); // VULNERABLE
```

```yaml
# GOOD: Enforce HTTPS
# config/packages/framework.yaml
framework:
    session:
        cookie_secure: true       # Cookies only over HTTPS
        cookie_httponly: true      # Not accessible via JavaScript
        cookie_samesite: lax      # CSRF protection

# GOOD: HSTS header
# Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### PostgreSQL Prevention

```sql
-- Connection encryption (verify in Docker)
-- postgresql.conf: ssl = on
-- pg_hba.conf: hostssl all all 0.0.0.0/0 scram-sha-256
```

### Checklist

- [ ] Passwords hashed with bcrypt/argon2 (Symfony `algorithm: auto`)
- [ ] No MD5/SHA1 for security purposes
- [ ] TLS 1.2+ enforced (no plain HTTP)
- [ ] HSTS header configured
- [ ] Session cookies: `secure`, `httpOnly`, `sameSite`
- [ ] No hardcoded keys/secrets in code (use `.env`)
- [ ] Sensitive data encrypted at rest
- [ ] Database connections encrypted (SSL)

---

## A05:2025 - Injection

**What:** SQL injection, XSS, OS command injection, ORM injection, LDAP injection, Expression Language injection.

### Symfony Prevention (SQL/ORM Injection)

```php
// GOOD: Doctrine QueryBuilder (parameterized)
$qb = $this->createQueryBuilder('u')
    ->where('u.email = :email')
    ->setParameter('email', $email)
    ->getQuery();

// BAD: String concatenation (SQL injection!)
// $query = "SELECT * FROM users WHERE email = '$email'";

// BAD: Even Doctrine DQL can be vulnerable
// $query = $em->createQuery("SELECT u FROM User u WHERE u.email = '$email'");

// GOOD: DQL with parameters
$query = $em->createQuery('SELECT u FROM App\Entity\User u WHERE u.email = :email')
    ->setParameter('email', $email);

// GOOD: Input validation on DTOs
class CreateUserDTO {
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    public string $email;
}
```

### Vue Prevention (XSS)

```vue
<!-- GOOD: Vue auto-escapes by default -->
<p>{{ userInput }}</p>

<!-- BAD: v-html with user input = XSS! -->
<!-- <div v-html="userInput"></div> -->

<!-- If v-html is needed, sanitize first -->
<div v-html="sanitizedHtml"></div>
```

```typescript
// GOOD: Sanitize if v-html is absolutely needed
import DOMPurify from 'dompurify'
const sanitizedHtml = computed(() => DOMPurify.sanitize(rawHtml.value))

// BAD: Never use eval() with user data
// eval(userInput)  // VULNERABLE
```

### Checklist

- [ ] Doctrine QueryBuilder/DQL with parameters (no string concatenation)
- [ ] No raw SQL unless absolutely necessary (and parameterized)
- [ ] Server-side input validation on all user data (Symfony Validator)
- [ ] Vue templates use `{{ }}` (auto-escaped), not `v-html` with user data
- [ ] No `eval()` or `Function()` with user-controlled data
- [ ] Content-Security-Policy header configured
- [ ] DTOs validated before processing

---

## A06:2025 - Insecure Design

**What:** Missing/ineffective controls by design. No rate limiting, no account lockout, predictable tokens, missing threat modeling.

### Symfony Prevention

```yaml
# GOOD: Login throttling
# config/packages/security.yaml
security:
    firewalls:
        api:
            login_throttling:
                max_attempts: 5
                interval: '15 minutes'
```

```php
// GOOD: Business logic validation
// Don't rely on frontend validation alone
class OrderService
{
    public function placeOrder(OrderDTO $dto): void
    {
        // Server-side business rule enforcement
        if ($dto->quantity > self::MAX_ORDER_QUANTITY) {
            throw new BusinessLogicException('Order quantity exceeds limit');
        }
        // Verify stock availability
        // Verify user hasn't exceeded daily order limit
        // etc.
    }
}
```

### Checklist

- [ ] Rate limiting on login/registration/password reset
- [ ] Account lockout after failed attempts
- [ ] Business logic validated server-side (not just frontend)
- [ ] Threat modeling done for critical flows
- [ ] Secure design patterns documented
- [ ] File upload: validate MIME type, size, extension server-side

---

## A07:2025 - Authentication Failures

**What:** Credential stuffing, brute force, weak passwords, default credentials, session fixation, missing MFA.

### Symfony Prevention

```php
// GOOD: Password strength validation
class RegistrationDTO {
    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 100)]
    #[Assert\NotCompromisedPassword]  // Checks haveibeenpwned.com
    public string $password;
}

// GOOD: Regenerate session on login
// Symfony does this automatically with guard authenticators

// GOOD: Session timeout
# config/packages/framework.yaml
framework:
    session:
        gc_maxlifetime: 1800      # 30 minutes
        cookie_lifetime: 0         # Browser session only
```

### Checklist

- [ ] Password minimum 8 chars (NIST 800-63b)
- [ ] `#[Assert\NotCompromisedPassword]` on password fields
- [ ] Login throttling enabled (max 5 attempts / 15 min)
- [ ] No default credentials in any environment
- [ ] Session regenerated on login
- [ ] Session timeout configured (idle + absolute)
- [ ] Session invalidated on logout
- [ ] Generic error messages ("Invalid credentials" - no user enumeration)

---

## A08:2025 - Software or Data Integrity Failures

**What:** Insecure deserialization, unsigned/unverified packages, CI/CD pipeline integrity, no integrity checks on updates.

### Symfony Prevention

```php
// GOOD: Never deserialize untrusted data
// Use Symfony Serializer with explicit type mapping
$user = $serializer->deserialize($json, UserDTO::class, 'json');

// BAD: PHP unserialize with user input
// $data = unserialize($_POST['data']);  // VULNERABLE
```

### Checklist

- [ ] No `unserialize()` with user-controlled data
- [ ] Symfony Serializer used (typed deserialization)
- [ ] Lock files committed (integrity of dependency versions)
- [ ] Signed commits/tags for releases
- [ ] CI/CD pipeline uses pinned action versions

---

## A09:2025 - Security Logging and Alerting Failures

**What:** Login attempts not logged, access control failures not logged, no alerting for suspicious activity, logs not protected.

### Symfony Prevention

```php
// GOOD: Log security events
$this->logger->warning('Failed login attempt', [
    'email' => $email,
    'ip' => $request->getClientIp(),
    'user_agent' => $request->headers->get('User-Agent'),
]);

// GOOD: Log access control failures
$this->logger->alert('Unauthorized access attempt', [
    'user_id' => $user->getId(),
    'resource' => $resourceId,
    'action' => 'DELETE',
]);

// GOOD: Symfony event listeners for auth events
// Listen to: security.authentication.failure, security.interactive_login
```

```yaml
# config/packages/monolog.yaml
monolog:
    handlers:
        security:
            type: stream
            path: '%kernel.logs_dir%/security.log'
            level: warning
            channels: ['security']
```

### Checklist

- [ ] Failed login attempts logged (with IP, user-agent)
- [ ] Access control failures logged
- [ ] Alerting for repeated failures (brute force detection)
- [ ] Logs not world-readable (file permissions)
- [ ] No sensitive data in logs (passwords, tokens, PII)
- [ ] Log retention policy configured
- [ ] Centralized logging in production

---

## A10:2025 - Mishandling of Exceptional Conditions

**What (NEW):** Improper error handling, failing open, resource leaks on exceptions, information exposure via error messages, transaction rollback failures.

### Symfony Prevention

```php
// GOOD: Catch exceptions at appropriate level
public function processPayment(PaymentDTO $dto): void
{
    $this->em->beginTransaction();
    try {
        $this->debitAccount($dto->sourceAccount, $dto->amount);
        $this->creditAccount($dto->targetAccount, $dto->amount);
        $this->logTransaction($dto);
        $this->em->commit();
    } catch (\Throwable $e) {
        $this->em->rollback();  // CRITICAL: Fail closed!
        $this->logger->error('Payment failed', [
            'error' => $e->getMessage(),
            'transaction' => $dto->id,
        ]);
        throw new PaymentFailedException('Payment could not be processed');
    }
}

// GOOD: Global exception listener (generic messages to users)
class ExceptionListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();

        // Generic message to user (no internals)
        $response = new JsonResponse([
            'error' => 'An error occurred. Please try again.',
        ], Response::HTTP_INTERNAL_SERVER_ERROR);

        // Log full details internally
        $this->logger->error($exception->getMessage(), [
            'trace' => $exception->getTraceAsString(),
        ]);

        $event->setResponse($response);
    }
}
```

### Vue Prevention

```typescript
// GOOD: Global error handler
app.config.errorHandler = (err, instance, info) => {
  // Log to monitoring service (Sentry, etc.)
  console.error('Vue error:', err)
  // Show user-friendly message
  notificationStore.showError('Something went wrong. Please try again.')
}

// GOOD: API error handling in composables
async function fetchData() {
  try {
    const response = await api.get('/endpoint')
    return response.data
  } catch (error) {
    if (error.response?.status === 401) {
      authStore.logout()
    }
    throw error  // Re-throw for component to handle
  }
}
```

### Checklist

- [ ] All database transactions use try/catch with rollback
- [ ] Global exception handler configured (no stack traces to users)
- [ ] Resources properly released on exceptions (DB connections, files)
- [ ] Rate limiting prevents resource exhaustion
- [ ] Error messages generic to users, detailed in logs
- [ ] Vue global error handler configured
- [ ] API composables handle all error states
- [ ] No "failing open" - deny by default on errors

---

## Audit Checklist (Full OWASP 2025)

```markdown
## OWASP Top 10:2025 Compliance

- [ ] A01: Broken Access Control
- [ ] A02: Security Misconfiguration
- [ ] A03: Software Supply Chain Failures
- [ ] A04: Cryptographic Failures
- [ ] A05: Injection
- [ ] A06: Insecure Design
- [ ] A07: Authentication Failures
- [ ] A08: Software or Data Integrity Failures
- [ ] A09: Security Logging and Alerting Failures
- [ ] A10: Mishandling of Exceptional Conditions
```

---

**Skill Version:** 1.0
**Last Updated:** 2026-02-16
**Source:** [OWASP Top 10:2025](https://owasp.org/Top10/2025/)
**Stack:** Symfony 7.4 + Vue 3 + TypeScript + PostgreSQL + Docker
