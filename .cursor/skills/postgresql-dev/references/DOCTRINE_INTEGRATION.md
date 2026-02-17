# Doctrine Integration with PostgreSQL

PostgreSQL-specific patterns for Symfony 7.4 LTS Doctrine ORM (PHP ^8.2).

## Type Mapping

```php
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class Product
{
    // INTEGER -> SERIAL (auto-increment)
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    private ?int $id = null;
    
    // VARCHAR
    #[ORM\Column(type: 'string', length: 255)]
    private string $name;
    
    // TEXT (unlimited)
    #[ORM\Column(type: 'text')]
    private string $description;
    
    // DECIMAL
    #[ORM\Column(type: 'decimal', precision: 10, scale: 2)]
    private string $price;
    
    // BOOLEAN
    #[ORM\Column(type: 'boolean')]
    private bool $isActive;
    
    // TIMESTAMP
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;
    
    // JSONB
    #[ORM\Column(type: 'json')]
    private array $metadata = [];
    
    // PostgreSQL ARRAY
    #[ORM\Column(type: 'simple_array', nullable: true)]
    private ?array $tags = null;
}
```

## PostgreSQL-Specific Types

### UUID

```php
// config/packages/doctrine.yaml
doctrine:
    dbal:
        types:
            uuid: Ramsey\Uuid\Doctrine\UuidType

// Entity
#[ORM\Column(type: 'uuid', unique: true)]
private UuidInterface $uuid;
```

### JSONB Operations

```php
// Query JSONB fields
$qb = $this->createQueryBuilder('u')
    ->where("u.metadata->>'country' = :country")
    ->setParameter('country', 'USA');
```

### Array Operations

```php
// Entity with array
#[ORM\Column(type: 'simple_array')]
private array $tags;

// Query
$qb = $this->createQueryBuilder('p')
    ->where('p.tags LIKE :tag')
    ->setParameter('tag', '%php%');
```

## Custom DQL Functions

```php
// src/Doctrine/PostgresqlContains.php
namespace App\Doctrine;

use Doctrine\ORM\Query\AST\Functions\FunctionNode;
use Doctrine\ORM\Query\Parser;
use Doctrine\ORM\Query\SqlWalker;
use Doctrine\ORM\Query\TokenType;

class PostgresqlContains extends FunctionNode
{
    public $arrayExpression;
    public $valueExpression;
    
    public function parse(Parser $parser): void
    {
        $parser->match(TokenType::T_IDENTIFIER);
        $parser->match(TokenType::T_OPEN_PARENTHESIS);
        $this->arrayExpression = $parser->ArithmeticPrimary();
        $parser->match(TokenType::T_COMMA);
        $this->valueExpression = $parser->ArithmeticPrimary();
        $parser->match(TokenType::T_CLOSE_PARENTHESIS);
    }
    
    public function getSql(SqlWalker $sqlWalker): string
    {
        return sprintf(
            '%s @> ARRAY[%s]',
            $this->arrayExpression->dispatch($sqlWalker),
            $this->valueExpression->dispatch($sqlWalker)
        );
    }
}
```

## Migrations

### PostgreSQL-Specific Migrations

```php
final class Version20250109000000 extends AbstractMigration
{
    public function up(Schema $schema): void
    {
        // Create table with PostgreSQL types
        $this->addSql('CREATE TABLE products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            metadata JSONB,
            tags TEXT[],
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )');
        
        // Create GIN index for JSONB
        $this->addSql('CREATE INDEX idx_products_metadata ON products USING GIN(metadata)');
        
        // Create index for array
        $this->addSql('CREATE INDEX idx_products_tags ON products USING GIN(tags)');
        
        // Add constraint
        $this->addSql('ALTER TABLE products
            ADD CONSTRAINT chk_price_positive CHECK (price > 0)
        ');
    }
    
    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE products');
    }
}
```

## Connection Configuration

```yaml
# config/packages/doctrine.yaml
doctrine:
    dbal:
        driver: 'pdo_pgsql'
        url: '%env(resolve:DATABASE_URL)%'
        server_version: '16'
        charset: utf8
        
        options:
            # Enable persistent connections
            PDO::ATTR_PERSISTENT: true
            
        # Connection pooling
        pooling_options:
            min_idle: 5
            max_idle: 10
            max_lifetime: 3600
```

## Performance Tips

### Batch Processing

```php
$batchSize = 20;
$i = 0;

foreach ($data as $item) {
    $entity = new Product();
    $entity->setName($item['name']);
    
    $this->entityManager->persist($entity);
    
    if (($i % $batchSize) === 0) {
        $this->entityManager->flush();
        $this->entityManager->clear();
    }
    
    $i++;
}

$this->entityManager->flush();
$this->entityManager->clear();
```

### Query Hints

```php
// Use query hints for performance
$query = $this->createQueryBuilder('u')
    ->getQuery()
    ->setHint(\Doctrine\ORM\Query::HINT_FORCE_PARTIAL_LOAD, true);
```

---

**Version:** 2.0
**Last Updated:** 2026-02-16
