# Workflow & Approval Patterns

Symfony Workflow component patterns for multi-step approval flows, state machines, and status tracking.

> **Use case:** Wnioski o zaliczki, delegacje, akceptacje dokumentów, procesy wieloetapowe.

## Installation

```bash
docker compose exec php composer require symfony/workflow
```

## State Machine vs Workflow

```yaml
# config/packages/workflow.yaml

# STATE MACHINE: entity can be in exactly ONE place at a time
# Use for: approval flows, document statuses, order processing
framework:
    workflows:
        advance_request:
            type: state_machine
            marking_store:
                type: method
                property: status
            supports:
                - App\Entity\AdvanceRequest
            initial_marking: draft
            places:
                - draft
                - submitted
                - leader_approved
                - finance_approved
                - rejected
                - settled
            transitions:
                submit:
                    from: draft
                    to: submitted
                to_leader_review:
                    from: submitted
                    to: leader_approved
                to_finance_review:
                    from: leader_approved
                    to: finance_approved
                reject:
                    from: [submitted, leader_approved]
                    to: rejected
                settle:
                    from: finance_approved
                    to: settled
                reopen:
                    from: rejected
                    to: draft
```

## Entity with Status

```php
namespace App\Entity;

use App\Enum\AdvanceRequestStatus;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AdvanceRequestRepository::class)]
class AdvanceRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[ORM\Column(type: 'uuid')]
    private ?Uuid $id = null;

    #[ORM\Column(length: 32)]
    private string $status = 'draft';

    #[ORM\Column]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    private User $requester;

    #[ORM\ManyToOne(targetEntity: User::class)]
    private ?User $approvedBy = null;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $approvedAt = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $rejectionReason = null;

    // getters/setters...

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }
}
```

## Transition Guards (Authorization)

```php
namespace App\Workflow;

use App\Entity\AdvanceRequest;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;
use Symfony\Component\Workflow\Event\GuardEvent;

final class AdvanceRequestGuardSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly AuthorizationCheckerInterface $authChecker,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            // Guard specific transitions
            'workflow.advance_request.guard.to_leader_review' => 'guardLeaderApproval',
            'workflow.advance_request.guard.to_finance_review' => 'guardFinanceApproval',
            'workflow.advance_request.guard.reject' => 'guardRejection',
        ];
    }

    public function guardLeaderApproval(GuardEvent $event): void
    {
        if (!$this->authChecker->isGranted('ROLE_BUDGET_LEADER')) {
            $event->setBlocked(true, 'Only budget leaders can approve.');
        }
    }

    public function guardFinanceApproval(GuardEvent $event): void
    {
        if (!$this->authChecker->isGranted('ROLE_FINANCE')) {
            $event->setBlocked(true, 'Only finance team can approve.');
        }
    }

    public function guardRejection(GuardEvent $event): void
    {
        /** @var AdvanceRequest $request */
        $request = $event->getSubject();

        // Requester cannot reject their own request
        if (!$this->authChecker->isGranted('ROLE_BUDGET_LEADER')
            && !$this->authChecker->isGranted('ROLE_FINANCE')
        ) {
            $event->setBlocked(true, 'Only approvers can reject.');
        }
    }
}
```

## Transition Side Effects (Listeners)

```php
namespace App\Workflow;

use App\Entity\AdvanceRequest;
use App\Service\NotificationService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\Workflow\Event\CompletedEvent;

final class AdvanceRequestTransitionSubscriber implements EventSubscriberInterface
{
    public function __construct(
        private readonly NotificationService $notifications,
    ) {}

    public static function getSubscribedEvents(): array
    {
        return [
            'workflow.advance_request.completed.submit' => 'onSubmitted',
            'workflow.advance_request.completed.to_leader_review' => 'onLeaderApproved',
            'workflow.advance_request.completed.reject' => 'onRejected',
        ];
    }

    public function onSubmitted(CompletedEvent $event): void
    {
        /** @var AdvanceRequest $request */
        $request = $event->getSubject();

        $this->notifications->notifyBudgetLeader(
            $request->getDepartment(),
            sprintf('New advance request #%s awaiting approval', $request->getId()),
        );
    }

    public function onLeaderApproved(CompletedEvent $event): void
    {
        /** @var AdvanceRequest $request */
        $request = $event->getSubject();

        $this->notifications->notifyFinanceTeam(
            sprintf('Advance request #%s approved by leader, awaiting finance review', $request->getId()),
        );
    }

    public function onRejected(CompletedEvent $event): void
    {
        /** @var AdvanceRequest $request */
        $request = $event->getSubject();

        $this->notifications->notifyRequester(
            $request->getRequester(),
            sprintf('Your advance request #%s was rejected', $request->getId()),
        );
    }
}
```

## Controller with Workflow

```php
namespace App\Controller;

use App\Entity\AdvanceRequest;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Workflow\WorkflowInterface;

#[Route('/api/advance-requests')]
final class AdvanceRequestController extends AbstractController
{
    public function __construct(
        private readonly WorkflowInterface $advanceRequestStateMachine,
        private readonly EntityManagerInterface $em,
    ) {}

    #[Route('/{id}/transition/{transition}', methods: ['POST'])]
    public function applyTransition(
        AdvanceRequest $advanceRequest,
        string $transition,
        Request $request,
    ): JsonResponse {
        // Check if transition is possible (guards run here)
        if (!$this->advanceRequestStateMachine->can($advanceRequest, $transition)) {
            return $this->json([
                'error' => sprintf('Transition "%s" is not available.', $transition),
                'available' => $this->getAvailableTransitions($advanceRequest),
            ], 422);
        }

        // Apply transition (side effects run here)
        $this->advanceRequestStateMachine->apply($advanceRequest, $transition, [
            'reason' => $request->getPayload()->get('reason'),
        ]);

        $this->em->flush();

        return $this->json([
            'status' => $advanceRequest->getStatus(),
            'available_transitions' => $this->getAvailableTransitions($advanceRequest),
        ]);
    }

    #[Route('/{id}/transitions', methods: ['GET'])]
    public function availableTransitions(AdvanceRequest $advanceRequest): JsonResponse
    {
        return $this->json([
            'current_status' => $advanceRequest->getStatus(),
            'available_transitions' => $this->getAvailableTransitions($advanceRequest),
        ]);
    }

    private function getAvailableTransitions(AdvanceRequest $advanceRequest): array
    {
        $transitions = $this->advanceRequestStateMachine->getEnabledTransitions($advanceRequest);

        return array_map(
            fn ($t) => $t->getName(),
            $transitions,
        );
    }
}
```

## API Response DTO with Status Info

```php
namespace App\DTO;

final readonly class AdvanceRequestResponse
{
    public function __construct(
        public string $id,
        public string $status,
        public string $statusLabel,
        public string $requesterName,
        public float $amount,
        public string $createdAt,
        public ?string $approvedBy,
        public ?string $approvedAt,
        public ?string $rejectionReason,
        /** @var string[] */
        public array $availableTransitions,
    ) {}
}
```

## Testing Workflows

```php
namespace App\Tests\Functional;

use App\Entity\AdvanceRequest;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Workflow\WorkflowInterface;

final class AdvanceRequestWorkflowTest extends KernelTestCase
{
    private WorkflowInterface $workflow;

    protected function setUp(): void
    {
        self::bootKernel();
        $this->workflow = self::getContainer()->get('state_machine.advance_request');
    }

    public function test_submit_from_draft_succeeds(): void
    {
        $request = new AdvanceRequest();
        // status = 'draft' by default

        $this->assertTrue($this->workflow->can($request, 'submit'));

        $this->workflow->apply($request, 'submit');

        $this->assertSame('submitted', $request->getStatus());
    }

    public function test_cannot_skip_leader_approval(): void
    {
        $request = new AdvanceRequest();
        $request->setStatus('submitted');

        $this->assertFalse($this->workflow->can($request, 'to_finance_review'));
    }

    public function test_can_reject_from_submitted_and_leader_approved(): void
    {
        $submitted = new AdvanceRequest();
        $submitted->setStatus('submitted');
        $this->assertTrue($this->workflow->can($submitted, 'reject'));

        $leaderApproved = new AdvanceRequest();
        $leaderApproved->setStatus('leader_approved');
        $this->assertTrue($this->workflow->can($leaderApproved, 'reject'));
    }
}
```

## Metadata for Status Labels

```yaml
# In workflow.yaml - add metadata for UI
framework:
    workflows:
        advance_request:
            metadata:
                title: 'Advance Request Process'
            places:
                draft:
                    metadata:
                        label: 'Szkic'
                        color: 'gray'
                        icon: 'edit'
                submitted:
                    metadata:
                        label: 'Złożony'
                        color: 'blue'
                        icon: 'send'
                leader_approved:
                    metadata:
                        label: 'Zaakceptowany przez lidera'
                        color: 'yellow'
                        icon: 'check'
                finance_approved:
                    metadata:
                        label: 'Zatwierdzony przez finanse'
                        color: 'green'
                        icon: 'check-double'
                rejected:
                    metadata:
                        label: 'Odrzucony'
                        color: 'red'
                        icon: 'x'
                settled:
                    metadata:
                        label: 'Rozliczony'
                        color: 'green'
                        icon: 'archive'
```

## Common Patterns

### Storing Transition Context

```php
// In transition listener - store who approved and when
public function onLeaderApproved(CompletedEvent $event): void
{
    /** @var AdvanceRequest $request */
    $request = $event->getSubject();
    $context = $event->getContext();

    $request->setApprovedBy($this->security->getUser());
    $request->setApprovedAt(new \DateTimeImmutable());
}

public function onRejected(CompletedEvent $event): void
{
    /** @var AdvanceRequest $request */
    $request = $event->getSubject();
    $context = $event->getContext();

    $request->setRejectionReason($context['reason'] ?? null);
    $request->setRejectedBy($this->security->getUser());
    $request->setRejectedAt(new \DateTimeImmutable());
}
```

### Deadline / Expiry Check (Scheduled)

```php
namespace App\Command;

use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Workflow\WorkflowInterface;

#[AsCommand(name: 'app:workflow:check-deadlines')]
final class WorkflowDeadlineCommand extends Command
{
    public function __construct(
        private readonly AdvanceRequestRepository $repository,
        private readonly WorkflowInterface $advanceRequestStateMachine,
        private readonly EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $staleRequests = $this->repository->findSubmittedOlderThan(new \DateInterval('P7D'));

        foreach ($staleRequests as $request) {
            if ($this->advanceRequestStateMachine->can($request, 'auto_remind')) {
                $this->advanceRequestStateMachine->apply($request, 'auto_remind');
            }
        }

        $this->em->flush();

        return Command::SUCCESS;
    }
}
```

### Multi-Department Approval Chain

```yaml
# Complex workflow with parallel approval paths
framework:
    workflows:
        purchase_order:
            type: state_machine
            supports: [App\Entity\PurchaseOrder]
            initial_marking: draft
            places:
                - draft
                - submitted
                - dept_approved       # Department leader
                - budget_approved     # Budget controller
                - cfo_approved        # CFO (only for amounts > threshold)
                - ordered
                - delivered
                - settled
            transitions:
                submit:
                    from: draft
                    to: submitted
                approve_dept:
                    from: submitted
                    to: dept_approved
                approve_budget:
                    from: dept_approved
                    to: budget_approved
                approve_cfo:
                    from: budget_approved
                    to: cfo_approved
                    metadata:
                        description: 'Required for amounts > 5000 PLN'
                skip_cfo:
                    from: budget_approved
                    to: ordered
                    metadata:
                        description: 'Auto-skip for amounts <= 5000 PLN'
                mark_ordered:
                    from: cfo_approved
                    to: ordered
                mark_delivered:
                    from: ordered
                    to: delivered
                mark_settled:
                    from: delivered
                    to: settled
```

```php
// Guard: auto-skip CFO for small amounts
public function guardSkipCfo(GuardEvent $event): void
{
    /** @var PurchaseOrder $order */
    $order = $event->getSubject();

    if ($order->getAmount() > 5000) {
        $event->setBlocked(true, 'CFO approval required for amounts > 5000 PLN');
    }
}

public function guardApproveCfo(GuardEvent $event): void
{
    /** @var PurchaseOrder $order */
    $order = $event->getSubject();

    if ($order->getAmount() <= 5000) {
        $event->setBlocked(true, 'CFO approval not needed for amounts <= 5000 PLN');
    }
}
```

---

> **Version:** 1.0 | **Stack:** Symfony 7.4 LTS, Doctrine ORM, PostgreSQL  
> **See also:** `SECURITY_PATTERNS.md` (Voters for authorization), `DOCTRINE_PATTERNS.md` (entity relations)
