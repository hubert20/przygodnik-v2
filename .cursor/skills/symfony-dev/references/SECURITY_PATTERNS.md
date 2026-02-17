# Security Patterns

Authentication, authorization, and security best practices for Symfony 7.4 LTS (PHP ^8.2).

## Password Hashing

```php
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserService
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {}
    
    public function createUser(string $email, string $plainPassword): User
    {
        $user = new User();
        $user->setEmail($email);
        
        // ✅ GOOD: Use Symfony password hasher
        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            $plainPassword
        );
        $user->setPassword($hashedPassword);
        
        return $user;
    }
    
    public function verifyPassword(User $user, string $plainPassword): bool
    {
        return $this->passwordHasher->isPasswordValid($user, $plainPassword);
    }
}
```

## Authentication

### JSON Login

```yaml
# config/packages/security.yaml
security:
    firewalls:
        api:
            pattern: ^/api
            stateless: true
            json_login:
                check_path: /api/login
                username_path: email
                password_path: password
```

### Custom Authenticator

```php
namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authenticator\AbstractAuthenticator;
use Symfony\Component\Security\Http\Authenticator\Passport\Badge\UserBadge;
use Symfony\Component\Security\Http\Authenticator\Passport\Credentials\PasswordCredentials;
use Symfony\Component\Security\Http\Authenticator\Passport\Passport;

final class ApiAuthenticator extends AbstractAuthenticator
{
    public function supports(Request $request): ?bool
    {
        return $request->getPathInfo() === '/api/login'
            && $request->isMethod('POST');
    }
    
    public function authenticate(Request $request): Passport
    {
        $data = json_decode($request->getContent(), true);
        
        return new Passport(
            new UserBadge($data['email']),
            new PasswordCredentials($data['password'])
        );
    }
    
    public function onAuthenticationSuccess(
        Request $request,
        TokenInterface $token,
        string $firewallName
    ): ?Response {
        return new JsonResponse([
            'user' => $token->getUser()->getUserIdentifier(),
            'roles' => $token->getUser()->getRoles()
        ]);
    }
    
    public function onAuthenticationFailure(
        Request $request,
        AuthenticationException $exception
    ): ?Response {
        return new JsonResponse([
            'error' => 'Invalid credentials'
        ], Response::HTTP_UNAUTHORIZED);
    }
}
```

## Authorization

### Using Voters

```php
namespace App\Security\Voter;

use App\Entity\Post;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

final class PostVoter extends Voter
{
    public const EDIT = 'POST_EDIT';
    public const DELETE = 'POST_DELETE';
    
    protected function supports(string $attribute, mixed $subject): bool
    {
        return in_array($attribute, [self::EDIT, self::DELETE])
            && $subject instanceof Post;
    }
    
    protected function voteOnAttribute(
        string $attribute,
        mixed $subject,
        TokenInterface $token
    ): bool {
        $user = $token->getUser();
        
        if (!$user instanceof User) {
            return false;
        }
        
        /** @var Post $post */
        $post = $subject;
        
        return match($attribute) {
            self::EDIT => $this->canEdit($post, $user),
            self::DELETE => $this->canDelete($post, $user),
            default => false
        };
    }
    
    private function canEdit(Post $post, User $user): bool
    {
        return $post->getAuthor() === $user
            || in_array('ROLE_ADMIN', $user->getRoles());
    }
    
    private function canDelete(Post $post, User $user): bool
    {
        return in_array('ROLE_ADMIN', $user->getRoles());
    }
}
```

### In Controllers

```php
#[Route('/posts/{id}/edit', methods: ['PUT'])]
public function edit(Post $post): JsonResponse
{
    // ✅ GOOD: Check authorization
    $this->denyAccessUnlessGranted('POST_EDIT', $post);
    
    // Edit post...
    
    return $this->json($post);
}

// Or with attribute
#[IsGranted('POST_EDIT', subject: 'post')]
#[Route('/posts/{id}/edit', methods: ['PUT'])]
public function edit(Post $post): JsonResponse
{
    // Authorized automatically
    return $this->json($post);
}
```

## CSRF Protection

```php
// For web forms (not API)
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

$token = $csrfTokenManager->getToken('user_edit');

// In form
<input type="hidden" name="_csrf_token" value="{{ csrf_token('user_edit') }}" />
```

## Security Best Practices

### Input Validation

```php
use Symfony\Component\Validator\Constraints as Assert;

class CreateUserDto
{
    #[Assert\NotBlank]
    #[Assert\Email]
    public string $email;
    
    #[Assert\NotBlank]
    #[Assert\Length(min: 8)]
    #[Assert\Regex(
        pattern: '/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/',
        message: 'Password must contain uppercase, lowercase and number'
    )]
    public string $password;
}
```

### SQL Injection Prevention

```php
// ✅ GOOD: Use parameters
$query = $this->createQueryBuilder('u')
    ->where('u.email = :email')
    ->setParameter('email', $email)
    ->getQuery();

// ❌ BAD: String concatenation
$query = $this->createQueryBuilder('u')
    ->where("u.email = '$email'") // SQL injection risk!
    ->getQuery();
```

### Rate Limiting

```yaml
# config/packages/security.yaml
security:
    firewalls:
        api:
            login_throttling:
                max_attempts: 5
                interval: '15 minutes'
```

---

**Version:** 2.0  
**Last Updated:** 2026-02-16
