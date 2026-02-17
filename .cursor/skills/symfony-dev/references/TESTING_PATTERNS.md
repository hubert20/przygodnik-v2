# Testing Patterns

PHPUnit testing strategies for Symfony 7.4 LTS applications (PHP ^8.2, PostgreSQL).

## Test Setup

### PHPUnit Configuration

```xml
<!-- phpunit.xml.dist -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="tests/bootstrap.php"
         colors="true">
    <testsuites>
        <testsuite name="Project Test Suite">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
    <coverage>
        <include>
            <directory suffix=".php">src</directory>
        </include>
    </coverage>
</phpunit>
```

## Unit Tests

### Service Testing

```php
namespace App\Tests\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\UserService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserServiceTest extends TestCase
{
    private UserService $userService;
    private UserRepository $userRepository;
    private UserPasswordHasherInterface $passwordHasher;
    
    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepository::class);
        $this->passwordHasher = $this->createMock(UserPasswordHasherInterface::class);
        
        $this->userService = new UserService(
            $this->userRepository,
            $this->passwordHasher
        );
    }
    
    public function testCreateUserHashesPassword(): void
    {
        $plainPassword = 'password123';
        $hashedPassword = 'hashed_password';
        
        $this->passwordHasher
            ->expects($this->once())
            ->method('hashPassword')
            ->willReturn($hashedPassword);
        
        $user = $this->userService->createUser('test@example.com', $plainPassword);
        
        $this->assertSame($hashedPassword, $user->getPassword());
    }
    
    public function testFindByIdReturnsUser(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');
        
        $this->userRepository
            ->expects($this->once())
            ->method('find')
            ->with(1)
            ->willReturn($user);
        
        $result = $this->userService->findById(1);
        
        $this->assertSame($user, $result);
    }
}
```

## Integration Tests

### Repository Testing

```php
namespace App\Tests\Repository;

use App\Entity\User;
use App\Repository\UserRepository;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

final class UserRepositoryTest extends KernelTestCase
{
    private UserRepository $repository;
    
    protected function setUp(): void
    {
        self::bootKernel();
        $this->repository = self::getContainer()->get(UserRepository::class);
    }
    
    public function testFindByEmail(): void
    {
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setPassword('password');
        
        $em = self::getContainer()->get('doctrine')->getManager();
        $em->persist($user);
        $em->flush();
        
        $found = $this->repository->findByEmail('test@example.com');
        
        $this->assertNotNull($found);
        $this->assertSame('test@example.com', $found->getEmail());
    }
}
```

## Functional Tests (API)

### WebTestCase

```php
namespace App\Tests\Controller;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class UserControllerTest extends WebTestCase
{
    public function testCreateUser(): void
    {
        $client = static::createClient();
        
        $client->request('POST', '/api/users', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => 'test@example.com',
            'password' => 'password123',
            'name' => 'Test User'
        ]));
        
        $this->assertResponseStatusCodeSame(201);
        $this->assertResponseHeaderSame('Content-Type', 'application/json');
        
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertArrayHasKey('id', $data);
        $this->assertSame('test@example.com', $data['email']);
    }
    
    public function testGetUser(): void
    {
        $client = static::createClient();
        
        // Create user first
        $this->createUser('test@example.com');
        
        $client->request('GET', '/api/users/1');
        
        $this->assertResponseIsSuccessful();
        
        $data = json_decode($client->getResponse()->getContent(), true);
        $this->assertSame('test@example.com', $data['email']);
    }
    
    public function testGetNonExistentUserReturns404(): void
    {
        $client = static::createClient();
        
        $client->request('GET', '/api/users/999');
        
        $this->assertResponseStatusCodeSame(404);
    }
}
```

## Database Fixtures

### Fixture Class

```php
namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

final class UserFixtures extends Fixture
{
    public function __construct(
        private readonly UserPasswordHasherInterface $passwordHasher
    ) {}
    
    public function load(ObjectManager $manager): void
    {
        $admin = new User();
        $admin->setEmail('admin@example.com');
        $admin->setName('Admin User');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword(
            $this->passwordHasher->hashPassword($admin, 'admin123')
        );
        
        $manager->persist($admin);
        
        $user = new User();
        $user->setEmail('user@example.com');
        $user->setName('Regular User');
        $user->setPassword(
            $this->passwordHasher->hashPassword($user, 'user123')
        );
        
        $manager->persist($user);
        
        $manager->flush();
    }
}
```

### Using Fixtures in Tests

```php
use Doctrine\Common\DataFixtures\Purger\ORMPurger;

protected function setUp(): void
{
    self::bootKernel();
    
    $em = self::getContainer()->get('doctrine')->getManager();
    
    // Purge database
    $purger = new ORMPurger($em);
    $purger->purge();
    
    // Load fixtures
    $loader = self::getContainer()->get('doctrine.fixtures.loader');
    $fixtures = $loader->getFixtures();
    foreach ($fixtures as $fixture) {
        $fixture->load($em);
    }
}
```

## Mocking

### Mock Services

```php
public function testServiceWithMockedDependency(): void
{
    $mockRepository = $this->createMock(UserRepository::class);
    $mockRepository->method('find')->willReturn(new User());
    
    $service = new UserService($mockRepository);
    
    $result = $service->findById(1);
    
    $this->assertInstanceOf(User::class, $result);
}
```

### Mock Entity Manager

```php
$em = $this->createMock(EntityManagerInterface::class);
$em->expects($this->once())
    ->method('persist')
    ->with($this->isInstanceOf(User::class));
$em->expects($this->once())
    ->method('flush');
```

## Testing Authentication

### Authenticated Requests

```php
public function testAuthenticatedRequest(): void
{
    $client = static::createClient();
    
    // Create and authenticate user
    $user = $this->createUser('test@example.com');
    $client->loginUser($user);
    
    $client->request('GET', '/api/admin/users');
    
    $this->assertResponseIsSuccessful();
}
```

## Data Providers

```php
/**
 * @dataProvider invalidEmailProvider
 */
public function testInvalidEmailValidation(string $email): void
{
    $client = static::createClient();
    
    $client->request('POST', '/api/users', [], [], [
        'CONTENT_TYPE' => 'application/json',
    ], json_encode([
        'email' => $email,
        'password' => 'password123'
    ]));
    
    $this->assertResponseStatusCodeSame(400);
}

public static function invalidEmailProvider(): array
{
    return [
        ['invalid'],
        ['@example.com'],
        ['test@'],
        [''],
    ];
}
```

## Test Best Practices

### ✅ DO

- **Isolate tests** (each test independent)
- **Use setUp() and tearDown()**
- **Test one thing per test**
- **Use descriptive test names**
- **Test edge cases and errors**
- **Use data providers** for multiple scenarios
- **Mock external dependencies**

### ❌ DON'T

- **Don't test framework code**
- **Don't depend on test order**
- **Don't use real external APIs**
- **Don't skip cleanup**
- **Don't test private methods** (test public interface)

## Coverage

```bash
# Run tests with coverage
php bin/phpunit --coverage-html coverage/

# Target coverage: >80%
```

---

**Version:** 2.0  
**Last Updated:** 2026-02-16
