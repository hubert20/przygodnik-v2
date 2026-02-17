# API Development Patterns

REST API best practices, serialization, and error handling for Symfony 7.4 LTS (PHP ^8.2).

## REST API Design

### Resource Naming

```
GET    /api/users           # List users
GET    /api/users/{id}      # Get single user
POST   /api/users           # Create user
PUT    /api/users/{id}      # Update user (full)
PATCH  /api/users/{id}      # Update user (partial)
DELETE /api/users/{id}      # Delete user
```

### HTTP Status Codes

```php
return $this->json($data, Response::HTTP_OK);              // 200
return $this->json($data, Response::HTTP_CREATED);         // 201
return $this->json(null, Response::HTTP_NO_CONTENT);       // 204
return $this->json($error, Response::HTTP_BAD_REQUEST);    // 400
return $this->json($error, Response::HTTP_UNAUTHORIZED);   // 401
return $this->json($error, Response::HTTP_FORBIDDEN);      // 403
return $this->json($error, Response::HTTP_NOT_FOUND);      // 404
```

## Serialization

### Serialization Groups

```php
use Symfony\Component\Serializer\Annotation\Groups;

class User
{
    #[Groups(['user:read'])]
    private int $id;
    
    #[Groups(['user:read', 'user:write'])]
    private string $email;
    
    #[Groups(['user:write'])]
    private string $password;
    
    #[Groups(['user:read', 'admin:read'])]
    private \DateTimeImmutable $createdAt;
}

// In controller
return $this->json($user, context: ['groups' => 'user:read']);
```

### Custom Normalizer

```php
namespace App\Serializer;

use App\Entity\User;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

final class UserNormalizer implements NormalizerInterface
{
    public function normalize(mixed $object, ?string $format = null, array $context = []): array
    {
        /** @var User $user */
        $user = $object;
        
        return [
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'created_at' => $user->getCreatedAt()->format('Y-m-d H:i:s')
        ];
    }
    
    public function supportsNormalization(mixed $data, ?string $format = null, array $context = []): bool
    {
        return $data instanceof User;
    }
    
    public function getSupportedTypes(?string $format): array
    {
        return [User::class => true];
    }
}
```

## Request Validation

### DTO with Validation

```php
namespace App\DTO;

use Symfony\Component\Validator\Constraints as Assert;

final class CreateUserRequest
{
    #[Assert\NotBlank]
    #[Assert\Email]
    public string $email;
    
    #[Assert\NotBlank]
    #[Assert\Length(min: 8, max: 100)]
    public string $password;
    
    #[Assert\NotBlank]
    #[Assert\Length(min: 2, max: 100)]
    public string $name;
}
```

### Controller with Validation

```php
use Symfony\Component\HttpKernel\Attribute\MapRequestPayload;

#[Route('/api/users', methods: ['POST'])]
public function create(
    #[MapRequestPayload] CreateUserRequest $request
): JsonResponse {
    // Request is automatically validated
    $user = $this->userService->createUser(
        $request->email,
        $request->password,
        $request->name
    );
    
    return $this->json($user, Response::HTTP_CREATED);
}
```

## Error Handling

### Exception Subscriber

```php
namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Validator\Exception\ValidationFailedException;

final class ApiExceptionSubscriber implements EventSubscriberInterface
{
    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::EXCEPTION => ['onKernelException', 10]
        ];
    }
    
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        
        if (str_starts_with($event->getRequest()->getPathInfo(), '/api')) {
            $response = $this->createApiResponse($exception);
            $event->setResponse($response);
        }
    }
    
    private function createApiResponse(\Throwable $exception): JsonResponse
    {
        $statusCode = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : Response::HTTP_INTERNAL_SERVER_ERROR;
        
        $data = [
            'error' => [
                'message' => $exception->getMessage(),
                'code' => $statusCode
            ]
        ];
        
        // Add validation errors
        if ($exception instanceof ValidationFailedException) {
            $data['error']['violations'] = [];
            foreach ($exception->getViolations() as $violation) {
                $data['error']['violations'][] = [
                    'property' => $violation->getPropertyPath(),
                    'message' => $violation->getMessage()
                ];
            }
        }
        
        return new JsonResponse($data, $statusCode);
    }
}
```

## Pagination

### Paginator DTO

```php
final class PaginatedResponse
{
    public function __construct(
        public readonly array $data,
        public readonly int $total,
        public readonly int $page,
        public readonly int $perPage
    ) {}
    
    public function toArray(): array
    {
        return [
            'data' => $this->data,
            'meta' => [
                'total' => $this->total,
                'page' => $this->page,
                'per_page' => $this->perPage,
                'last_page' => (int) ceil($this->total / $this->perPage)
            ]
        ];
    }
}
```

## CORS Configuration

```yaml
# config/packages/nelmio_cors.yaml
nelmio_cors:
    defaults:
        origin_regex: true
        allow_origin: ['%env(CORS_ALLOW_ORIGIN)%']
        allow_methods: ['GET', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE']
        allow_headers: ['Content-Type', 'Authorization']
        expose_headers: ['Link']
        max_age: 3600
    paths:
        '^/api/':
            allow_origin: ['*']
            allow_headers: ['*']
            allow_methods: ['POST', 'PUT', 'GET', 'DELETE', 'PATCH']
            max_age: 3600
```

## API Documentation

### OpenAPI Annotations

```php
use OpenApi\Attributes as OA;

#[OA\Get(
    path: '/api/users/{id}',
    summary: 'Get user by ID',
    tags: ['Users']
)]
#[OA\Parameter(
    name: 'id',
    in: 'path',
    required: true,
    schema: new OA\Schema(type: 'integer')
)]
#[OA\Response(
    response: 200,
    description: 'User found',
    content: new OA\JsonContent(ref: '#/components/schemas/User')
)]
#[OA\Response(
    response: 404,
    description: 'User not found'
)]
public function show(int $id): JsonResponse
{
    // Implementation
}
```

---

**Version:** 2.0  
**Last Updated:** 2026-02-16
