# Query Optimization

PostgreSQL query optimization techniques and EXPLAIN ANALYZE usage.

## EXPLAIN ANALYZE

```sql
-- Basic explain
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- With execution stats
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- With costs and buffers
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM users WHERE email = 'test@example.com';
```

## Reading EXPLAIN Output

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(p.id)
FROM users u
LEFT JOIN posts p ON p.user_id = u.id
GROUP BY u.id;

/*
Output interpretation:
- Seq Scan: Full table scan (slow for large tables)
- Index Scan: Using index (good)
- Index Only Scan: Data from index only (best)
- Nested Loop: Join method (good for small datasets)
- Hash Join: Join method (good for large datasets)
- Merge Join: Join method (best when both sorted)
*/
```

## Common Issues

### N+1 Query Problem

```sql
-- ❌ BAD: Multiple queries
SELECT * FROM users;
-- For each user:
SELECT * FROM posts WHERE user_id = ?;

-- ✅ GOOD: Single JOIN
SELECT u.*, p.*
FROM users u
LEFT JOIN posts p ON p.user_id = u.id;
```

### Missing Indexes

```sql
-- ❌ BAD: Seq Scan on large table
SELECT * FROM users WHERE email = 'test@example.com';

-- ✅ GOOD: Add index
CREATE INDEX idx_users_email ON users(email);
SELECT * FROM users WHERE email = 'test@example.com';
```

### Function on Indexed Column

```sql
-- ❌ BAD: Function prevents index usage
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';

-- ✅ GOOD: Functional index
CREATE INDEX idx_users_email_lower ON users(LOWER(email));
SELECT * FROM users WHERE LOWER(email) = 'test@example.com';
```

### SELECT *

```sql
-- ❌ BAD: Fetches all columns
SELECT * FROM users;

-- ✅ GOOD: Specify needed columns only
SELECT id, email, name FROM users;
```

## Query Patterns

### Pagination

```sql
-- ✅ GOOD: LIMIT with OFFSET
SELECT * FROM posts
ORDER BY created_at DESC
LIMIT 10 OFFSET 20;

-- ✅ BETTER: Keyset pagination (for large offsets)
SELECT * FROM posts
WHERE created_at < '2025-01-01 12:00:00'
ORDER BY created_at DESC
LIMIT 10;
```

### Aggregations

```sql
-- Efficient COUNT
SELECT COUNT(*) FROM users;  -- Fast with PostgreSQL

-- Conditional aggregation
SELECT
    COUNT(*) FILTER (WHERE is_active = true) as active_users,
    COUNT(*) FILTER (WHERE is_active = false) as inactive_users
FROM users;
```

### Subqueries vs JOINs

```sql
-- ✅ Usually prefer JOIN
SELECT u.*
FROM users u
INNER JOIN posts p ON p.user_id = u.id
WHERE p.status = 'published';

-- Sometimes subquery is faster
SELECT u.*
FROM users u
WHERE EXISTS (
    SELECT 1 FROM posts p
    WHERE p.user_id = u.id AND p.status = 'published'
);
```

## Performance Monitoring

```sql
-- Check slow queries
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check table sizes
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Vacuum and Analyze

```sql
-- Analyze to update statistics
ANALYZE users;

-- Vacuum to reclaim space
VACUUM users;

-- Full vacuum (locks table)
VACUUM FULL users;

-- Auto-vacuum configuration
SHOW autovacuum;
```

---

**Version:** 2.0
**Last Updated:** 2026-02-16
