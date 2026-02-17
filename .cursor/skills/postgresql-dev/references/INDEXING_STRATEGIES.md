# PostgreSQL Indexing Strategies

Comprehensive guide to PostgreSQL indexing for optimal performance.

## Index Types

### B-tree (Default)

```sql
-- Most common, works for equality and range queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_created_at ON posts(created_at);

-- Good for: =, <, <=, >, >=, BETWEEN, IN, IS NULL
```

### Hash

```sql
-- Only for equality comparisons
CREATE INDEX idx_users_id_hash ON users USING HASH(id);

-- Good for: = only
-- Not for: <, >, BETWEEN, ORDER BY
```

### GIN (Generalized Inverted Index)

```sql
-- For arrays, JSONB, full-text search
CREATE INDEX idx_posts_tags ON posts USING GIN(tags);
CREATE INDEX idx_users_metadata ON users USING GIN(metadata);

-- Good for: @>, @<@, ?

, ?|, &&
```

### GiST (Generalized Search Tree)

```sql
-- For geometric data, ranges
CREATE INDEX idx_locations ON stores USING GIST(location);

-- Good for: overlaps, contains, distances
```

### BRIN (Block Range Index)

```sql
-- For very large tables with natural ordering
CREATE INDEX idx_logs_timestamp ON logs USING BRIN(created_at);

-- Good for: time-series data, append-only tables
-- Very small index size
```

## Composite Indexes

```sql
-- Order matters!
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at);

-- ✅ Can use index:
WHERE user_id = 1
WHERE user_id = 1 AND created_at > '2025-01-01'
WHERE user_id = 1 ORDER BY created_at

-- ❌ Cannot use index efficiently:
WHERE created_at > '2025-01-01' (second column only)
```

## Partial Indexes

```sql
-- Index only subset of rows
CREATE INDEX idx_active_users ON users(email) WHERE is_active = true;

-- Smaller index, faster queries when filtering by is_active = true
SELECT * FROM users WHERE is_active = true AND email = 'test@example.com';
```

## Covering Indexes

```sql
-- Include columns in index (INCLUDE)
CREATE INDEX idx_users_email_include ON users(email) INCLUDE (name, created_at);

-- Query can be satisfied entirely from index (no table access)
SELECT name, created_at FROM users WHERE email = 'test@example.com';
```

## Index Maintenance

```sql
-- Check index usage
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Find unused indexes (idx_scan = 0)
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
    AND indexname NOT LIKE 'pg_toast%';

-- Reindex if needed
REINDEX INDEX idx_users_email;
REINDEX TABLE users;
```

## Best Practices

- **Index foreign keys** always
- **Index WHERE clause columns** for frequent queries
- **Index JOIN columns**
- **Index ORDER BY columns**
- **Don't over-index** (slows INSERT/UPDATE/DELETE)
- **Monitor index usage** (remove unused indexes)
- **Use EXPLAIN ANALYZE** to verify index usage

---

**Version:** 2.0
**Last Updated:** 2026-02-16
