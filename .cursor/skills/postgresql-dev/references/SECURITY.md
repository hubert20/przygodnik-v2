# PostgreSQL Security

SQL injection prevention, access control, and security best practices.

## SQL Injection Prevention

### Parameterized Queries (Doctrine)

```php
// ✅ GOOD: Use parameters
$qb = $this->createQueryBuilder('u')
    ->where('u.email = :email')
    ->setParameter('email', $email);

// ✅ GOOD: Named parameters
$query = $em->createQuery('SELECT u FROM App\Entity\User u WHERE u.email = :email');
$query->setParameter('email', $email);

// ❌ BAD: String concatenation (SQL INJECTION!)
$query = $em->createQuery("SELECT u FROM App\Entity\User u WHERE u.email = '$email'");
```

### Raw SQL (Use Carefully)

```php
// ✅ GOOD: Use parameters even in raw SQL
$sql = 'SELECT * FROM users WHERE email = :email';
$stmt = $connection->prepare($sql);
$stmt->bindValue('email', $email);
$result = $stmt->executeQuery();

// ❌ BAD: Never concatenate user input
$sql = "SELECT * FROM users WHERE email = '$email'";
$result = $connection->executeQuery($sql);
```

## Access Control

### Database Roles

```sql
-- Create readonly role
CREATE ROLE readonly_user WITH LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE mydb TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Create read-write role
CREATE ROLE readwrite_user WITH LOGIN PASSWORD 'password';
GRANT CONNECT ON DATABASE mydb TO readwrite_user;
GRANT USAGE ON SCHEMA public TO readwrite_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO readwrite_user;

-- Grant only specific tables
GRANT SELECT, INSERT, UPDATE ON users TO app_user;
```

### Row-Level Security

```sql
-- Enable row-level security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own posts
CREATE POLICY user_posts_policy ON posts
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::int);

-- Set user ID in session
SET app.current_user_id = 123;
```

## Connection Security

### SSL/TLS

```yaml
# config/packages/doctrine.yaml
doctrine:
    dbal:
        url: '%env(resolve:DATABASE_URL)%'
        options:
            sslmode: require
            sslcert: /path/to/client-cert.pem
            sslkey: /path/to/client-key.pem
            sslrootcert: /path/to/ca-cert.pem
```

### Connection Limits

```sql
-- Limit connections per user
ALTER ROLE app_user CONNECTION LIMIT 50;

-- Check active connections
SELECT
    usename,
    COUNT(*) as connection_count
FROM pg_stat_activity
GROUP BY usename;
```

## Data Protection

### Encryption at Rest

```sql
-- Use pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data
INSERT INTO users (email, credit_card)
VALUES ('test@example.com', pgp_sym_encrypt('1234-5678-9012-3456', 'encryption_key'));

-- Decrypt
SELECT email, pgp_sym_decrypt(credit_card, 'encryption_key') as credit_card
FROM users;
```

### Sensitive Data Handling

```php
// ✅ GOOD: Never log passwords or sensitive data
$logger->info('User logged in', [
    'user_id' => $user->getId(),
    'email' => $user->getEmail()
    // DON'T: 'password' => $password
]);

// ✅ GOOD: Hash passwords
$hashedPassword = $passwordHasher->hashPassword($user, $plainPassword);

// ❌ BAD: Store plaintext passwords
$user->setPassword($plainPassword);
```

## Auditing

### Audit Log Table

```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(10) NOT NULL,
    user_id INTEGER,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (table_name, operation, old_data, new_data)
    VALUES (
        TG_TABLE_NAME,
        TG_OP,
        row_to_json(OLD),
        row_to_json(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger
CREATE TRIGGER users_audit
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

## Best Practices

### ✅ DO

- **Always use parameterized queries**
- **Use least privilege principle** (grant minimum necessary permissions)
- **Enable SSL/TLS** for connections
- **Encrypt sensitive data** at rest
- **Implement audit logging**
- **Use strong passwords** for database users
- **Limit connection attempts** (fail2ban, pg_hba.conf)
- **Regular security updates**

### ❌ DON'T

- **Never concatenate user input** in SQL
- **Don't use superuser** for application connections
- **Don't store passwords** in plaintext
- **Don't expose database** directly to internet
- **Don't use default ports** in production
- **Don't ignore failed login attempts**
- **Don't skip backups**

## Monitoring

```sql
-- Check for suspicious queries
SELECT
    query,
    state,
    backend_start,
    query_start
FROM pg_stat_activity
WHERE state = 'active'
    AND query NOT LIKE '%pg_stat_activity%';

-- Failed login attempts (from pg_log)
-- Enable logging in postgresql.conf:
-- log_connections = on
-- log_disconnections = on
-- log_failed_connections = on
```

---

**Version:** 2.0
**Last Updated:** 2026-02-16
