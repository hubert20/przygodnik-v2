---
name: symfony-dev
description: Symfony 7.4 LTS PHP ^8.2 development patterns Doctrine ORM PostgreSQL Security authentication API REST services dependency injection testing best practices
---

# Symfony 7.4 LTS Development

Expert guide for building robust PHP applications with Symfony 7.4 LTS, emphasizing SOLID principles, clean architecture, and best practices.

## Version Constraints

> **CRITICAL: Pinned Versions - Do NOT upgrade beyond these.**

| Package | Version | Support Until | Notes |
|---------|---------|---------------|-------|
| **Symfony** | **7.4 LTS** (`7.4.*`) | Listopad 2027 | **NIE używaj Symfony 8.x** - zbyt świeże |
| **PHP** | **^8.2** | Grudzień 2026+ | Minimum 8.2, wspiera 8.2/8.3/8.4 |
| **Doctrine ORM** | `^3.0` | - | Kompatybilny z Symfony 7.4 |
| **PostgreSQL** | `16+` | - | Baza danych projektu |

**composer.json requirements:**
```json
{
    "require": {
        "php": "^8.2",
        "symfony/framework-bundle": "7.4.*",
        "symfony/runtime": "7.4.*"
    }
}
```

**Dlaczego nie Symfony 8.x?**
- Symfony 8.0 to wersja non-LTS, pozbawiona długoterminowego wsparcia
- Symfony 7.4 LTS gwarantuje stabilność i security fixes do XI 2027
- Migracja do 8.x planowana dopiero gdy 8.4 LTS będzie dostępne (2028)

## Local Development

> **Symfony działa w kontenerze Docker** (PHP 8.2-fpm + Nginx).
> NIE instaluj PHP na hoście. Wszystkie komendy `php bin/console`, `composer` uruchamiaj przez:
> ```bash
> docker compose exec php php bin/console ...
> docker compose exec php composer ...
> docker compose exec php php bin/phpunit
> ```
> Szczegóły: `.cursor/skills/docker-dev/SKILL.md`

## Purpose

This skill provides comprehensive patterns for Symfony 7.4 LTS development:
- Architecture (Controllers, Services, Entities)
- Doctrine ORM patterns with PostgreSQL
- Security and authentication
- API development
- Dependency injection
- Testing strategies
- Performance optimization

## Core Principles

### SOLID Principles

**Single Responsibility:**
- Controllers: HTTP layer only (thin controllers)
- Services: Business logic (fat services)
- Entities: Data representation (anemic domain model)
- Repositories: Database queries

**Dependency Inversion:**
- Depend on interfaces, not concrete classes
- Use dependency injection (constructor injection)
- Avoid service locator pattern

### Thin Controllers, Fat Services

```php
// ❌ BAD: Business logic in controller
class UserController extends AbstractController
{
    #[Route('/users', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        // Validation in controller - BAD!
        if (empty($data['email'])) {
            return $this->json(['error' => 'Email required'], 400);
        }
        
        // Business logic in controller - BAD!
        $user = new User();
        $user->setEmail($data['email']);
        $user->setPassword(password_hash($data['password'], PASSWORD_BCRYPT));
        
        $this->entityManager->persist($user);
        $this->entityManager->flush();
        
        return $this->json($user);
    }
}

// ✅ GOOD: Delegate to service
class UserController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService
    ) {}
    
    #[Route('/users', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->userService->createUser(
            $request->toArray()
        );
        
        return $this->json($user, 201);
    }
}
```

## Project Structure

```
src/
├── Controller/          # HTTP layer (thin)
│   ├── Api/
│   │   └── UserController.php
│   └── AdminController.php
├── Service/             # Business logic (fat)
│   ├── UserService.php
│   └── EmailService.php
├── Entity/              # Doctrine entities
│   └── User.php
├── Repository/          # Database queries
│   └── UserRepository.php
├── Form/                # Form types
│   └── UserType.php
├── Security/
│   └── Voter/          # Authorization logic
│       └── UserVoter.php
├── DTO/                 # Data Transfer Objects
│   └── CreateUserDto.php
├── EventSubscriber/     # Event listeners
│   └── ExceptionSubscriber.php
└── ValueObject/         # Value objects
    └── Email.php
```

## Controllers

### Basic Controller

```php
namespace App\Controller\Api;

use App\Service\UserService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/users')]
final class UserController extends AbstractController
{
    public function __construct(
        private readonly UserService $userService
    ) {}
    
    #[Route('', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $users = $this->userService->findAll(
            page: $request->query->getInt('page', 1),
            limit: $request->query->getInt('limit', 10)
        );
        
        return $this->json($users);
    }
    
    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $user = $this->userService->findById($id);
        
        if (!$user) {
            throw $this->createNotFoundException('User not found');
        }
        
        return $this->json($user);
    }
    
    #[Route('', methods: ['POST'])]
    public function create(Request $request): JsonResponse
    {
        $user = $this->userService->createUser(
            $request->toArray()
        );
        
        return $this->json($user, Response::HTTP_CREATED);
    }
}
```

### Controller Best Practices

```php
// ✅ GOOD: Controllers are final
final class UserController extends AbstractController
{
    // ✅ GOOD: Constructor injection with readonly
    public function __construct(
        private readonly UserService $userService,
        private readonly LoggerInterface $logger
    ) {}
    
    // ✅ GOOD: Type hints on parameters and return
    #[Route('/users/{id}', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        // ✅ GOOD: Delegate to service
        $user = $this->userService->findById($id);
        
        // ✅ GOOD: Handle not found
        if (!$user) {
            throw $this->createNotFoundException();
        }
        
        return $this->json($user);
    }
}

// ❌ BAD: Non-final class
class UserController extends AbstractController
{
    // ❌ BAD: Public property
    public UserService $userService;
    
    // ❌ BAD: No type hints
    public function show($id)
    {
        // ❌ BAD: Direct entity manager usage
        $user = $this->getDoctrine()
            ->getRepository(User::class)
            ->find($id);
        
        return $this->json($user);
    }
}
```

## Services

### Service Pattern

```php
namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {}
    
    public function createUser(array $data): User
    {
        // Validation (or use Symfony Validator)
        if (empty($data['email'])) {
            throw new \InvalidArgumentException('Email is required');
        }
        
        // Check uniqueness
        if ($this->userRepository->findOneBy(['email' => $data['email']])) {
            throw new \RuntimeException('Email already exists');
        }
        
        // Create entity
        $user = new User();
        $user->setEmail($data['email']);
        $user->setName($data['name'] ?? '');
        
        // Hash password
        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            $data['password']
        );
        $user->setPassword($hashedPassword);
        
        // Persist
        $this->entityManager->persist($user);
        $this->entityManager->flush();
        
        return $user;
    }
    
    public function findById(int $id): ?User
    {
        return $this->userRepository->find($id);
    }
    
    public function findAll(int $page = 1, int $limit = 10): array
    {
        return $this->userRepository->findPaginated($page, $limit);
    }
}
```

## Doctrine Entities

### Entity Definition

```php
namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\Index(columns: ['email'], name: 'idx_user_email')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;
    
    #[ORM\Column(length: 180, unique: true)]
    private string $email;
    
    #[ORM\Column]
    private string $password;
    
    #[ORM\Column(length: 255)]
    private string $name;
    
    #[ORM\Column(type: 'json')]
    private array $roles = [];
    
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;
    
    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }
    
    // Getters and setters...
    
    public function getId(): ?int
    {
        return $this->id;
    }
    
    public function getEmail(): string
    {
        return $this->email;
    }
    
    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }
    
    // UserInterface implementation
    public function getUserIdentifier(): string
    {
        return $this->email;
    }
    
    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';
        return array_unique($roles);
    }
    
    public function eraseCredentials(): void
    {
        // Clear temporary sensitive data
    }
    
    public function getPassword(): string
    {
        return $this->password;
    }
    
    public function setPassword(string $password): self
    {
        $this->password = $password;
        return $this;
    }
}
```

### Entity Best Practices

```php
// ✅ GOOD: Anemic entities (no business logic)
class User
{
    private string $email;
    
    public function getEmail(): string
    {
        return $this->email;
    }
    
    public function setEmail(string $email): self
    {
        $this->email = $email;
        return $this;
    }
}

// ❌ BAD: Business logic in entity
class User
{
    public function sendWelcomeEmail(MailerInterface $mailer): void
    {
        // Business logic doesn't belong here!
        $mailer->send(...);
    }
}

// ✅ GOOD: Use datetime_immutable
#[ORM\Column(type: 'datetime_immutable')]
private \DateTimeImmutable $createdAt;

// ❌ BAD: Mutable datetime
#[ORM\Column(type: 'datetime')]
private \DateTime $createdAt;
```

## Repositories

### Custom Repository

```php
namespace App\Repository;

use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<User>
 */
class UserRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, User::class);
    }
    
    public function findByEmail(string $email): ?User
    {
        return $this->findOneBy(['email' => $email]);
    }
    
    public function findPaginated(int $page, int $limit): array
    {
        return $this->createQueryBuilder('u')
            ->orderBy('u.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
    
    public function findActiveUsers(): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.isActive = :active')
            ->setParameter('active', true)
            ->getQuery()
            ->getResult();
    }
    
    public function countByRole(string $role): int
    {
        return (int) $this->createQueryBuilder('u')
            ->select('COUNT(u.id)')
            ->where('JSON_CONTAINS(u.roles, :role) = 1')
            ->setParameter('role', json_encode($role))
            ->getQuery()
            ->getSingleScalarResult();
    }
}
```

## Security

### Authentication

```php
// config/packages/security.yaml
security:
    password_hashers:
        Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'
    
    providers:
        app_user_provider:
            entity:
                class: App\Entity\User
                property: email
    
    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false
        
        api:
            pattern: ^/api
            stateless: true
            json_login:
                check_path: /api/login
                username_path: email
                password_path: password
                success_handler: App\Security\AuthenticationSuccessHandler
            
    access_control:
        - { path: ^/api/login, roles: PUBLIC_ACCESS }
        - { path: ^/api/admin, roles: ROLE_ADMIN }
        - { path: ^/api, roles: ROLE_USER }
```

### Security Voters

```php
namespace App\Security\Voter;

use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;
use Symfony\Component\Security\Core\User\UserInterface;

final class UserVoter extends Voter
{
    public const EDIT = 'USER_EDIT';
    public const DELETE = 'USER_DELETE';
    
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::EDIT, self::DELETE])
            && $subject instanceof User;
    }
    
    protected function voteOnAttribute(
        string $attribute,
        mixed $subject,
        TokenInterface $token
    ): bool {
        $currentUser = $token->getUser();
        
        if (!$currentUser instanceof UserInterface) {
            return false;
        }
        
        /** @var User $user */
        $user = $subject;
        
        return match($attribute) {
            self::EDIT => $this->canEdit($user, $currentUser),
            self::DELETE => $this->canDelete($user, $currentUser),
            default => false
        };
    }
    
    private function canEdit(User $user, UserInterface $currentUser): bool
    {
        // Admin can edit anyone, users can edit themselves
        return in_array('ROLE_ADMIN', $currentUser->getRoles())
            || $user->getId() === $currentUser->getId();
    }
    
    private function canDelete(User $user, UserInterface $currentUser): bool
    {
        // Only admin can delete
        return in_array('ROLE_ADMIN', $currentUser->getRoles());
    }
}
```

## API Development

### Serialization

```php
namespace App\Entity;

use Symfony\Component\Serializer\Annotation\Groups;

class User
{
    #[Groups(['user:read', 'user:write'])]
    private string $email;
    
    #[Groups(['user:read'])]
    private int $id;
    
    #[Groups(['user:write'])]
    private string $password;
    
    #[Groups(['user:read', 'user:write'])]
    private string $name;
}

// In controller:
return $this->json($user, context: ['groups' => 'user:read']);
```

### Error Handling

```php
namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;

final class ExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => 'onKernelException'
        ];
    }
    
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        
        $statusCode = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : 500;
        
        $response = new JsonResponse([
            'error' => [
                'message' => $exception->getMessage(),
                'code' => $statusCode
            ]
        ], $statusCode);
        
        $event->setResponse($response);
    }
}
```

## Best Practices

### ✅ DO

- **Use constructor injection** with readonly properties
- **Make services final**
- **Type hint everything** (params, returns, properties)
- **Thin controllers** (max 50 lines per method)
- **Fat services** (business logic here)
- **Use repositories** for database queries
- **Use voters** for authorization
- **Use form types** for validation
- **Use migrations** for schema changes

### ❌ DON'T

- **Don't use service locator** (getDoctrine(), get())
- **Don't put business logic in controllers**
- **Don't put business logic in entities**
- **Don't use raw SQL** (use QueryBuilder or DQL)
- **Don't use static methods** in services
- **Don't skip validation**
- **Don't expose entities directly** (use DTOs or serialization groups)

## Additional Resources

See `references/` directory for:
- `DOCTRINE_PATTERNS.md` - ORM patterns and query optimization
- `SECURITY_PATTERNS.md` - Authentication and authorization
- `API_PATTERNS.md` - REST API best practices
- `TESTING_PATTERNS.md` - PHPUnit testing strategies

## Quick Reference

| Component | Responsibility |
|-----------|---------------|
| Controller | HTTP layer, validation delegation |
| Service | Business logic, orchestration |
| Entity | Data representation |
| Repository | Database queries |
| Voter | Authorization logic |
| Form Type | Input validation |
| Event Subscriber | Cross-cutting concerns |

---

**Version:** 2.0  
**Last Updated:** 2026-02-16  
**Symfony:** 7.4 LTS | **PHP:** ^8.2 | **DB:** PostgreSQL
