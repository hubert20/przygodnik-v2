# Audit Trail & Change History Patterns

Entity change tracking, versioning, soft deletes, and history display patterns.

> **Use case:** Historia zmian lokalizacji, historia ocen HR, log importów, śledzenie kto/co/kiedy zmienił.

## Architecture Decision

Two approaches - pick one per entity:

| Approach | When to Use | Complexity |
|----------|-------------|------------|
| **Changelog Table** | Track changes to multiple entity types, UI shows "who changed what" | Medium |
| **Entity Versioning** | Need full snapshots, compare versions side-by-side | Higher |
| **Soft Deletes** | Need to "undelete" or keep records for audit | Low |

## Approach 1: Changelog Table (Recommended Default)

### Changelog Entity

```php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ChangelogRepository::class)]
#[ORM\Index(columns: ['entity_type', 'entity_id'], name: 'idx_changelog_entity')]
#[ORM\Index(columns: ['created_at'], name: 'idx_changelog_date')]
class Changelog
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    /** FQCN or short name of the entity class */
    #[ORM\Column(length: 100)]
    private string $entityType;

    /** UUID or integer ID of the tracked entity */
    #[ORM\Column(length: 36)]
    private string $entityId;

    #[ORM\Column(length: 20)]
    private string $action; // 'create', 'update', 'delete'

    /** @var array<string, array{old: mixed, new: mixed}> */
    #[ORM\Column(type: 'json')]
    private array $changes = [];

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true)] // null for system/automated changes
    private ?User $changedBy = null;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(length: 45, nullable: true)]
    private ?string $ipAddress = null;

    public function __construct(
        string $entityType,
        string $entityId,
        string $action,
        array $changes = [],
        ?User $changedBy = null,
    ) {
        $this->entityType = $entityType;
        $this->entityId = $entityId;
        $this->action = $action;
        $this->changes = $changes;
        $this->changedBy = $changedBy;
        $this->createdAt = new \DateTimeImmutable();
    }

    // getters...
}
```

### Doctrine Event Listener (Automatic Tracking)

```php
namespace App\EventListener;

use App\Entity\Changelog;
use App\Entity\Interface\AuditableInterface;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\Event\PostPersistEventArgs;
use Doctrine\ORM\Event\PostRemoveEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;
use Symfony\Bundle\SecurityBundle\Security;

#[AsDoctrineListener(event: Events::preUpdate)]
#[AsDoctrineListener(event: Events::postPersist)]
#[AsDoctrineListener(event: Events::postRemove)]
final class AuditListener
{
    /** @var Changelog[] Collected during preUpdate, flushed later */
    private array $pendingLogs = [];

    public function __construct(
        private readonly Security $security,
    ) {}

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof AuditableInterface) {
            return;
        }

        $changeSet = $args->getEntityChangeSet();
        $changes = [];

        foreach ($changeSet as $field => [$old, $new]) {
            // Skip internal fields
            if (in_array($field, ['updatedAt'], true)) {
                continue;
            }

            $changes[$field] = [
                'old' => $this->normalizeValue($old),
                'new' => $this->normalizeValue($new),
            ];
        }

        if (empty($changes)) {
            return;
        }

        $this->pendingLogs[] = new Changelog(
            entityType: $this->getEntityType($entity),
            entityId: (string) $entity->getId(),
            action: 'update',
            changes: $changes,
            changedBy: $this->getCurrentUser(),
        );
    }

    public function postPersist(PostPersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof AuditableInterface) {
            return;
        }

        $log = new Changelog(
            entityType: $this->getEntityType($entity),
            entityId: (string) $entity->getId(),
            action: 'create',
            changes: [],
            changedBy: $this->getCurrentUser(),
        );

        $em = $args->getObjectManager();
        $em->persist($log);
        $em->flush();
    }

    public function postRemove(PostRemoveEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof AuditableInterface) {
            return;
        }

        $log = new Changelog(
            entityType: $this->getEntityType($entity),
            entityId: (string) $entity->getId(),
            action: 'delete',
            changes: [],
            changedBy: $this->getCurrentUser(),
        );

        $em = $args->getObjectManager();
        $em->persist($log);
        $em->flush();
    }

    /**
     * Call this after EntityManager::flush() to persist pending update logs.
     * Best done via kernel.response or doctrine postFlush.
     */
    public function flushPendingLogs(EntityManagerInterface $em): void
    {
        foreach ($this->pendingLogs as $log) {
            $em->persist($log);
        }
        $this->pendingLogs = [];
        $em->flush();
    }

    private function normalizeValue(mixed $value): mixed
    {
        if ($value instanceof \DateTimeInterface) {
            return $value->format('c');
        }
        if ($value instanceof \BackedEnum) {
            return $value->value;
        }
        if (is_object($value) && method_exists($value, 'getId')) {
            return (string) $value->getId();
        }
        return $value;
    }

    private function getEntityType(object $entity): string
    {
        $class = get_class($entity);
        // Return short class name
        return substr($class, strrpos($class, '\\') + 1);
    }

    private function getCurrentUser(): ?User
    {
        $user = $this->security->getUser();
        return $user instanceof User ? $user : null;
    }
}
```

### Auditable Interface (Marker)

```php
namespace App\Entity\Interface;

/**
 * Marker interface: entities implementing this are tracked by AuditListener.
 */
interface AuditableInterface
{
    public function getId(): mixed;
}
```

```php
// Apply to entities that need tracking
#[ORM\Entity]
class Location implements AuditableInterface
{
    // ... entity fields
}
```

### Changelog Repository (Querying History)

```php
namespace App\Repository;

use App\Entity\Changelog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;

/**
 * @extends ServiceEntityRepository<Changelog>
 */
final class ChangelogRepository extends ServiceEntityRepository
{
    /**
     * Get full history for a specific entity.
     * @return Changelog[]
     */
    public function findEntityHistory(string $entityType, string $entityId): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.entityType = :type')
            ->andWhere('c.entityId = :id')
            ->setParameter('type', $entityType)
            ->setParameter('id', $entityId)
            ->orderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Get recent changes across all entities (admin dashboard).
     * @return Changelog[]
     */
    public function findRecentChanges(int $limit = 50): array
    {
        return $this->createQueryBuilder('c')
            ->leftJoin('c.changedBy', 'u')
            ->addSelect('u')
            ->orderBy('c.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Get changes by a specific user.
     * @return Changelog[]
     */
    public function findByUser(User $user, int $limit = 100): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.changedBy = :user')
            ->setParameter('user', $user)
            ->orderBy('c.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }
}
```

### API Endpoint for History

```php
#[Route('/api/{entityType}/{entityId}/history', methods: ['GET'])]
#[IsGranted('ROLE_ADMIN')]
public function history(
    string $entityType,
    string $entityId,
    ChangelogRepository $changelogRepo,
): JsonResponse {
    $allowedTypes = ['Location', 'Payment', 'Evaluation'];
    if (!in_array($entityType, $allowedTypes, true)) {
        return $this->json(['error' => 'Invalid entity type'], 400);
    }

    $history = $changelogRepo->findEntityHistory($entityType, $entityId);

    return $this->json(array_map(fn (Changelog $log) => [
        'action' => $log->getAction(),
        'changes' => $log->getChanges(),
        'changedBy' => $log->getChangedBy()?->getFullName(),
        'createdAt' => $log->getCreatedAt()->format('c'),
    ], $history));
}
```

## Approach 2: Entity Versioning (Full Snapshots)

```php
namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Index(columns: ['location_id', 'version'], name: 'idx_location_version')]
class LocationVersion
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Location::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    private Location $location;

    #[ORM\Column]
    private int $version;

    /** Full snapshot of entity data at this version */
    #[ORM\Column(type: 'json')]
    private array $snapshot;

    #[ORM\ManyToOne(targetEntity: User::class)]
    private ?User $changedBy;

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $changeReason = null;
}
```

```php
// Service to create version snapshot before update
final class LocationVersioningService
{
    public function createSnapshot(Location $location, ?User $changedBy, ?string $reason = null): LocationVersion
    {
        $currentVersion = $this->getLatestVersion($location);

        $version = new LocationVersion();
        $version->setLocation($location);
        $version->setVersion($currentVersion + 1);
        $version->setSnapshot($this->serialize($location));
        $version->setChangedBy($changedBy);
        $version->setChangeReason($reason);

        return $version;
    }

    private function serialize(Location $location): array
    {
        return [
            'name' => $location->getName(),
            'address' => $location->getAddress(),
            'city' => $location->getCity(),
            'postalCode' => $location->getPostalCode(),
            'latitude' => $location->getLatitude(),
            'longitude' => $location->getLongitude(),
            'isActive' => $location->isActive(),
        ];
    }

    /**
     * Compare two versions and return differences.
     * @return array<string, array{old: mixed, new: mixed}>
     */
    public function diff(LocationVersion $older, LocationVersion $newer): array
    {
        $oldSnap = $older->getSnapshot();
        $newSnap = $newer->getSnapshot();
        $diff = [];

        foreach ($newSnap as $key => $newValue) {
            $oldValue = $oldSnap[$key] ?? null;
            if ($oldValue !== $newValue) {
                $diff[$key] = ['old' => $oldValue, 'new' => $newValue];
            }
        }

        return $diff;
    }
}
```

## Approach 3: Soft Deletes

```php
namespace App\Entity\Trait;

use Doctrine\ORM\Mapping as ORM;

trait SoftDeletableTrait
{
    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $deletedAt = null;

    public function getDeletedAt(): ?\DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function softDelete(): void
    {
        $this->deletedAt = new \DateTimeImmutable();
    }

    public function restore(): void
    {
        $this->deletedAt = null;
    }
}
```

```php
#[ORM\Entity]
class Location implements AuditableInterface
{
    use SoftDeletableTrait;

    // ... other fields
}
```

```php
// Repository: default scope excludes soft-deleted
final class LocationRepository extends ServiceEntityRepository
{
    public function findAllActive(): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.deletedAt IS NULL')
            ->orderBy('l.name', 'ASC')
            ->getQuery()
            ->getResult();
    }

    // Admin: include soft-deleted
    public function findAllIncludingDeleted(): array
    {
        return $this->createQueryBuilder('l')
            ->orderBy('l.name', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
```

## Timestamps Trait (createdAt / updatedAt)

```php
namespace App\Entity\Trait;

use Doctrine\ORM\Mapping as ORM;

trait TimestampableTrait
{
    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    private \DateTimeImmutable $updatedAt;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }
}
```

```php
// Don't forget lifecycle callbacks on entity
#[ORM\Entity]
#[ORM\HasLifecycleCallbacks]
class Location implements AuditableInterface
{
    use TimestampableTrait;
    use SoftDeletableTrait;
    // ...
}
```

## Database Indexes for Audit Tables

```php
// Migration for changelog table performance
$this->addSql('CREATE INDEX idx_changelog_entity ON changelog (entity_type, entity_id)');
$this->addSql('CREATE INDEX idx_changelog_date ON changelog (created_at DESC)');
$this->addSql('CREATE INDEX idx_changelog_user ON changelog (changed_by_id)');

// For soft deletes - partial index (PostgreSQL)
$this->addSql('CREATE INDEX idx_location_active ON location (id) WHERE deleted_at IS NULL');
```

---

> **Version:** 1.0 | **Stack:** Symfony 7.4 LTS, Doctrine ORM, PostgreSQL  
> **See also:** `DOCTRINE_PATTERNS.md` (entity relations), `SECURITY_PATTERNS.md` (authorization for history access)
