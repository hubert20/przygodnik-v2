---
name: postgresql-dev
description: PostgreSQL 16+ database design indexing query optimization Doctrine ORM Symfony 7.4 LTS integration schema normalization performance tuning best practices
---

# PostgreSQL Development

Expert guide for PostgreSQL database design, optimization, and integration with Symfony 7.4 LTS Doctrine ORM.

> **Stack:** PostgreSQL 16+ | Symfony 7.4 LTS | PHP ^8.2 | Doctrine ORM 3.x

## Local Development

> **PostgreSQL działa w kontenerze Docker** (`postgres:16-alpine`).
> NIE instaluj PostgreSQL na hoście. Połączenie z kontenerem:
> ```bash
> # psql wewnątrz kontenera
> docker compose exec postgres psql -U app -d app_db
> 
> # Lub z hosta na porcie 5432 (Adminer: http://localhost:8081)
> ```
> Szczegóły: `.cursor/skills/docker-dev/SKILL.md`

## Purpose

This skill provides comprehensive patterns for PostgreSQL development:
- Database schema design and normalization
- Indexing strategies
- Query optimization
- Doctrine ORM integration (Symfony 7.4 LTS)
- Performance tuning
- Security best practices

## Core Principles

### Normalization

- **1NF:** Atomic values, no repeating groups
- **2NF:** No partial dependencies
- **3NF:** No transitive dependencies
- **BCNF:** Every determinant is a candidate key

### Performance First

- **Index strategically** (foreign keys, WHERE clauses, JOINs)
- **Avoid N+1 queries** (use JOINs or eager loading)
- **Use EXPLAIN ANALYZE** for query optimization
- **Denormalize when justified** (read-heavy, proven bottleneck)

## Schema Design

### Basic Table

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(180) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### Foreign Keys

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_posts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at);
```

### Constraints

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT chk_price_positive CHECK (price > 0),
    CONSTRAINT chk_stock_non_negative CHECK (stock >= 0),
    CONSTRAINT unq_product_name UNIQUE (name)
);
```

## Indexing Strategies

### Index Types

```sql
-- B-tree (default, most common)
CREATE INDEX idx_users_email ON users(email);

-- Composite index
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);

-- Partial index
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- GIN index (for arrays, JSONB, full-text search)
CREATE INDEX idx_tags_gin ON posts USING GIN(tags);

-- GiST index (for geometric data, range types)
CREATE INDEX idx_location_gist ON stores USING GIST(location);
```

### When to Index

```sql
-- ✅ Index foreign keys
CREATE INDEX idx_posts_user_id ON posts(user_id);

-- ✅ Index WHERE clause columns
CREATE INDEX idx_users_status ON users(status);

-- ✅ Index ORDER BY columns
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- ✅ Index JOIN columns
CREATE INDEX idx_comments_post_id ON comments(post_id);

-- ❌ Don't index low-cardinality columns
-- (e.g., gender with only 2-3 values)

// ❌ Don't index small tables (< 1000 rows)

-- ❌ Don't over-index (every index slows INSERT/UPDATE)
```

## Doctrine ORM Integration

### Entity with PostgreSQL Types

```php
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'users')]
#[ORM\Index(columns: ['email'], name: 'idx_user_email')]
class User
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;
    
    #[ORM\Column(type: 'string', length: 180, unique: true)]
    private string $email;
    
    // ✅ Use datetime_immutable for PostgreSQL TIMESTAMP
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;
    
    // ✅ JSON type maps to PostgreSQL JSONB
    #[ORM\Column(type: 'json')]
    private array $metadata = [];
    
    // ✅ Array type for PostgreSQL arrays
    #[ORM\Column(type: 'simple_array', nullable: true)]
    private ?array $tags = null;
}
```

### Custom PostgreSQL Types

```php
// Doctrine mapping
#[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
private string $price; // DECIMAL(10,2)

#[ORM\Column(type: 'text')]
private string $content; // TEXT (unlimited length)

#[ORM\Column(type: 'boolean')]
private bool $isActive; // BOOLEAN

#[ORM\Column(type: 'smallint')]
private int $status; // SMALLINT (-32768 to 32767)
```

## Query Optimization

### EXPLAIN ANALYZE

```sql
-- ✅ Always check query performance
EXPLAIN ANALYZE
SELECT u.*, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id;
```

### Common Optimizations

```sql
-- ❌ BAD: N+1 query problem
SELECT * FROM users;
-- Then for each user: SELECT * FROM posts WHERE user_id = ?

-- ✅ GOOD: Single query with JOIN
SELECT u.*, p.*
FROM users u
LEFT JOIN posts p ON p.user_id = u.id;

-- ❌ BAD: SELECT * (fetches all columns)
SELECT * FROM users;

-- ✅ GOOD: Select only needed columns
SELECT id, email, name FROM users;

-- ❌ BAD: Function on indexed column prevents index usage
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- ✅ GOOD: Use functional index or match case
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
```

### Doctrine Query Optimization

```php
// ❌ BAD: N+1 queries
$users = $userRepository->findAll();
foreach ($users as $user) {
    echo count($user->getPosts()); // Separate query!
}

// ✅ GOOD: JOIN with eager loading
$users = $this->createQueryBuilder('u')
    ->leftJoin('u.posts', 'p')
    ->addSelect('p') // Eager load
    ->getQuery()
    ->getResult();

// ✅ GOOD: Batch fetching
$users = $this->createQueryBuilder('u')
    ->leftJoin('u.posts', 'p')
    ->addSelect('p')
    ->where('u.isActive = :active')
    ->setParameter('active', true)
    ->setMaxResults(100)
    ->getQuery()
    ->getResult();
```

## PostgreSQL-Specific Features

### JSONB Operations

```sql
-- Query JSONB data
SELECT * FROM users
WHERE metadata->>'country' = 'USA';

-- Index JSONB path
CREATE INDEX idx_users_country ON users((metadata->>'country'));

-- Array contains
SELECT * FROM posts
WHERE tags @> ARRAY['php', 'symfony'];
```

### Full-Text Search

```sql
-- Create tsvector column
ALTER TABLE posts ADD COLUMN search_vector tsvector;

-- Update search vector
UPDATE posts
SET search_vector = to_tsvector('english', title || ' ' || content);

-- Create GIN index
CREATE INDEX idx_posts_search ON posts USING GIN(search_vector);

-- Search
SELECT * FROM posts
WHERE search_vector @@ to_tsquery('english', 'postgresql & optimization');
```

### Window Functions

```sql
-- Rank posts by views within each category
SELECT
    id,
    title,
    category_id,
    views,
    RANK() OVER (PARTITION BY category_id ORDER BY views DESC) as rank
FROM posts;

-- Running total
SELECT
    id,
    amount,
    SUM(amount) OVER (ORDER BY created_at) as running_total
FROM transactions;
```

## Migrations with Doctrine

### Creating Migrations

```bash
# Generate migration
php bin/console make:migration

# Execute migrations
php bin/console doctrine:migrations:migrate

# Rollback
php bin/console doctrine:migrations:migrate prev
```

### Migration Example

```php
final class Version20250109000000 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        // Create table
        $this->addSql('CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(180) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )');
        
        // Add index
        $this->addSql('CREATE INDEX idx_users_email ON users(email)');
        
        // Add constraint
        $this->addSql('ALTER TABLE users
            ADD CONSTRAINT chk_email_format
            CHECK (email ~* \'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$\')
        ');
    }
    
    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE users');
    }
}
```

## Best Practices

### ✅ DO

- **Use SERIAL or IDENTITY** for auto-increment primary keys
- **Use TIMESTAMP** (not DATETIME - PostgreSQL doesn't have it)
- **Use VARCHAR(n)** with appropriate length
- **Index foreign keys** always
- **Use constraints** (NOT NULL, UNIQUE, CHECK, FOREIGN KEY)
- **Use transactions** for multiple related operations
- **Use EXPLAIN ANALYZE** to verify query performance
- **Use connection pooling** (pgBouncer)

### ❌ DON'T

- **Don't use SELECT *** (specify columns)
- **Don't create indexes without measuring** (they cost write performance)
- **Don't use TEXT** when VARCHAR(n) is sufficient
- **Don't concatenate SQL** (use parameters to prevent SQL injection)
- **Don't forget to vacuum** (PostgreSQL MVCC requires maintenance)
- **Don't over-normalize** (sometimes denormalization is justified)

## Additional Resources

See `references/` directory for:
- `INDEXING_STRATEGIES.md` - Deep dive into PostgreSQL indexing
- `QUERY_OPTIMIZATION.md` - Advanced query tuning
- `DOCTRINE_INTEGRATION.md` - Symfony Doctrine patterns
- `SECURITY.md` - SQL injection prevention and security

## Quick Reference

| Type | PostgreSQL | Doctrine |
|------|-----------|----------|
| Integer | INTEGER, SERIAL | integer |
| Text | VARCHAR(n), TEXT | string, text |
| Decimal | DECIMAL(p,s) | decimal |
| Boolean | BOOLEAN | boolean |
| Date/Time | TIMESTAMP | datetime_immutable |
| JSON | JSONB | json |
| Array | ARRAY | simple_array |

---

**Version:** 2.0  
**Last Updated:** 2026-02-16  
**PostgreSQL:** 16+ | **Symfony:** 7.4 LTS | **PHP:** ^8.2
