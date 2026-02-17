# Doctrine ORM Patterns

Doctrine patterns, query optimization, and best practices for Symfony 7.4 LTS with PostgreSQL.

## Entity Relations

### One-to-Many

```php
// User.php (One)
#[ORM\Entity]
class User
{
    #[ORM\OneToMany(targetEntity: Post::class, mappedBy: 'author')]
    private Collection $posts;
    
    public function __construct()
    {
        $this->posts = new ArrayCollection();
    }
}

// Post.php (Many)
#[ORM\Entity]
class Post
{
    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'posts')]
    #[ORM\JoinColumn(nullable: false)]
    private User $author;
}
```

### Many-to-Many

```php
#[ORM\Entity]
class User
{
    #[ORM\ManyToMany(targetEntity: Role::class, inversedBy: 'users')]
    #[ORM\JoinTable(name: 'user_roles')]
    private Collection $roles;
}

#[ORM\Entity]
class Role
{
    #[ORM\ManyToMany(targetEntity: User::class, mappedBy: 'roles')]
    private Collection $users;
}
```

## Query Builder

### Basic Queries

```php
public function findActiveUsers(): array
{
    return $this->createQueryBuilder('u')
        ->where('u.isActive = :active')
        ->setParameter('active', true)
        ->orderBy('u.createdAt', 'DESC')
        ->getQuery()
        ->getResult();
}
```

### Joins

```php
// ✅ GOOD: Explicit join with fetch
public function findUsersWithPosts(): array
{
    return $this->createQueryBuilder('u')
        ->leftJoin('u.posts', 'p')
        ->addSelect('p') // Eager load to avoid N+1
        ->getQuery()
        ->getResult();
}
```

### Pagination

```php
use Doctrine\ORM\Tools\Pagination\Paginator;

public function findPaginated(int $page, int $limit): Paginator
{
    $query = $this->createQueryBuilder('u')
        ->orderBy('u.createdAt', 'DESC')
        ->setFirstResult(($page - 1) * $limit)
        ->setMaxResults($limit)
        ->getQuery();
    
    return new Paginator($query);
}
```

## Migrations

### Creating Migrations

```bash
# Generate migration from entity changes
php bin/console make:migration

# Run migrations
php bin/console doctrine:migrations:migrate

# Rollback
php bin/console doctrine:migrations:migrate prev
```

### Migration Example (PostgreSQL)

```php
final class Version20250109000000 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        // PostgreSQL syntax - SERIAL for auto-increment
        $this->addSql('CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(180) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL
        )');
        
        $this->addSql('CREATE INDEX idx_users_email ON users(email)');
    }
    
    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE users');
    }
}
```

## Performance Optimization

### N+1 Query Problem

```php
// ❌ BAD: N+1 queries
$users = $userRepository->findAll();
foreach ($users as $user) {
    echo $user->getPosts()->count(); // Separate query for each user!
}

// ✅ GOOD: Single query with join
$users = $this->createQueryBuilder('u')
    ->leftJoin('u.posts', 'p')
    ->addSelect('p')
    ->getQuery()
    ->getResult();
```

### Partial Objects

```php
// ✅ Select only needed fields
$users = $this->createQueryBuilder('u')
    ->select('u.id', 'u.email', 'u.name')
    ->getQuery()
    ->getArrayResult();
```

### Batch Processing

```php
public function batchUpdate(): void
{
    $batchSize = 20;
    $i = 0;
    
    $query = $this->createQueryBuilder('u')->getQuery();
    
    foreach ($query->toIterable() as $user) {
        $user->setUpdatedAt(new \DateTimeImmutable());
        
        if (($i % $batchSize) === 0) {
            $this->entityManager->flush();
            $this->entityManager->clear();
        }
        
        $i++;
    }
    
    $this->entityManager->flush();
}
```

## Indexes

```php
#[ORM\Entity]
#[ORM\Table(name: 'users')]
#[ORM\Index(columns: ['email'], name: 'idx_user_email')]
#[ORM\Index(columns: ['created_at'], name: 'idx_user_created')]
#[ORM\Index(columns: ['is_active', 'created_at'], name: 'idx_active_created')]
class User
{
    // ...
}
```

---

**Version:** 2.0  
**Last Updated:** 2026-02-16
