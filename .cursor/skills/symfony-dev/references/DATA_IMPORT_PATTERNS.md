# Data Import/Export Patterns

CSV/XLSX import and export patterns with validation, batch processing, duplicate detection, and error reporting.

> **Use case:** Import danych bankowych, import/eksport CSV lokalizacji, masowe zasilanie danych.

## Dependencies

```bash
docker compose exec php composer require league/csv
# Optional for XLSX:
docker compose exec php composer require phpoffice/phpspreadsheet
```

## Import Command (Console)

```php
namespace App\Command;

use App\Service\Import\PaymentImportService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:import:payments',
    description: 'Import payment data from CSV file',
)]
final class ImportPaymentsCommand extends Command
{
    public function __construct(
        private readonly PaymentImportService $importService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('file', InputArgument::REQUIRED, 'Path to CSV file')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Preview without saving')
            ->addOption('skip-duplicates', null, InputOption::VALUE_NONE, 'Skip duplicate rows');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $filePath = $input->getArgument('file');
        $dryRun = $input->getOption('dry-run');

        if (!file_exists($filePath)) {
            $io->error(sprintf('File not found: %s', $filePath));
            return Command::FAILURE;
        }

        $result = $this->importService->import($filePath, [
            'dry_run' => $dryRun,
            'skip_duplicates' => $input->getOption('skip-duplicates'),
        ]);

        $io->table(
            ['Metric', 'Count'],
            [
                ['Total rows', $result->totalRows],
                ['Imported', $result->imported],
                ['Skipped (duplicates)', $result->skippedDuplicates],
                ['Errors', $result->errorCount],
            ],
        );

        if ($result->hasErrors()) {
            $io->warning('Errors found:');
            foreach ($result->errors as $error) {
                $io->writeln(sprintf('  Row %d: %s', $error->row, $error->message));
            }
        }

        if ($dryRun) {
            $io->note('DRY RUN - no data was saved.');
        } else {
            $io->success(sprintf('%d records imported.', $result->imported));
        }

        return $result->hasErrors() ? Command::FAILURE : Command::SUCCESS;
    }
}
```

## Import Result DTO

```php
namespace App\DTO;

final class ImportResult
{
    /** @var ImportError[] */
    public array $errors = [];

    public function __construct(
        public int $totalRows = 0,
        public int $imported = 0,
        public int $skippedDuplicates = 0,
    ) {}

    public function addError(int $row, string $message, ?string $field = null): void
    {
        $this->errors[] = new ImportError($row, $message, $field);
    }

    public int $errorCount {
        get => count($this->errors);
    }

    public function hasErrors(): bool
    {
        return $this->errorCount > 0;
    }
}

final readonly class ImportError
{
    public function __construct(
        public int $row,
        public string $message,
        public ?string $field = null,
    ) {}
}
```

## Import Service (Core Logic)

```php
namespace App\Service\Import;

use App\DTO\ImportResult;
use App\Entity\Payment;
use App\Repository\PaymentRepository;
use Doctrine\ORM\EntityManagerInterface;
use League\Csv\Reader;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class PaymentImportService
{
    private const BATCH_SIZE = 50;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly ValidatorInterface $validator,
        private readonly PaymentRepository $paymentRepository,
        private readonly DuplicateDetector $duplicateDetector,
    ) {}

    /**
     * @param array{dry_run: bool, skip_duplicates: bool} $options
     */
    public function import(string $filePath, array $options = []): ImportResult
    {
        $csv = Reader::createFromPath($filePath);
        $csv->setHeaderOffset(0);
        $csv->setDelimiter(';'); // Polish bank exports often use semicolon

        $result = new ImportResult();
        $result->totalRows = $csv->count();
        $batchCount = 0;

        foreach ($csv->getRecords() as $rowIndex => $record) {
            $rowNumber = $rowIndex + 2; // +2: header + 0-indexed

            // Map CSV columns to entity
            $payment = $this->mapToEntity($record, $rowNumber, $result);
            if ($payment === null) {
                continue; // mapping error already recorded
            }

            // Validate
            $violations = $this->validator->validate($payment);
            if (count($violations) > 0) {
                foreach ($violations as $violation) {
                    $result->addError(
                        $rowNumber,
                        $violation->getMessage(),
                        $violation->getPropertyPath(),
                    );
                }
                continue;
            }

            // Check duplicates
            if ($this->duplicateDetector->isDuplicate($payment)) {
                $result->skippedDuplicates++;
                if ($options['skip_duplicates'] ?? false) {
                    continue;
                }
                $result->addError($rowNumber, 'Duplicate payment detected');
                continue;
            }

            if (!($options['dry_run'] ?? false)) {
                $this->em->persist($payment);
                $batchCount++;

                // Batch flush to avoid memory issues
                if ($batchCount % self::BATCH_SIZE === 0) {
                    $this->em->flush();
                    $this->em->clear();
                }
            }

            $result->imported++;
        }

        // Final flush for remaining entities
        if (!($options['dry_run'] ?? false)) {
            $this->em->flush();
            $this->em->clear();
        }

        return $result;
    }

    private function mapToEntity(array $record, int $rowNumber, ImportResult $result): ?Payment
    {
        try {
            $payment = new Payment();
            $payment->setTransactionDate(new \DateTimeImmutable($record['data_transakcji'] ?? ''));
            $payment->setAmount((float) str_replace(',', '.', $record['kwota'] ?? '0'));
            $payment->setSenderName(trim($record['nadawca'] ?? ''));
            $payment->setTitle(trim($record['tytul'] ?? ''));
            $payment->setAccountNumber(trim($record['nr_rachunku'] ?? ''));

            return $payment;
        } catch (\Throwable $e) {
            $result->addError($rowNumber, sprintf('Parse error: %s', $e->getMessage()));
            return null;
        }
    }
}
```

## Duplicate Detection

```php
namespace App\Service\Import;

use App\Entity\Payment;
use App\Repository\PaymentRepository;

final class DuplicateDetector
{
    /** @var array<string, true> Runtime cache of seen hashes */
    private array $seenHashes = [];

    public function __construct(
        private readonly PaymentRepository $repository,
    ) {}

    public function isDuplicate(Payment $payment): bool
    {
        $hash = $this->computeHash($payment);

        // Check runtime cache (duplicates within same file)
        if (isset($this->seenHashes[$hash])) {
            return true;
        }

        // Check database (duplicates with existing records)
        if ($this->repository->existsByHash($hash)) {
            return true;
        }

        $this->seenHashes[$hash] = true;
        return false;
    }

    /**
     * Hash based on business-unique fields.
     * Adjust fields based on what makes a payment unique.
     */
    private function computeHash(Payment $payment): string
    {
        return hash('xxh128', implode('|', [
            $payment->getTransactionDate()->format('Y-m-d'),
            $payment->getAmount(),
            $payment->getAccountNumber(),
            $payment->getTitle(),
        ]));
    }

    public function reset(): void
    {
        $this->seenHashes = [];
    }
}
```

```php
// In PaymentRepository
public function existsByHash(string $hash): bool
{
    return (bool) $this->createQueryBuilder('p')
        ->select('1')
        ->where('p.duplicateHash = :hash')
        ->setParameter('hash', $hash)
        ->setMaxResults(1)
        ->getQuery()
        ->getOneOrNullResult();
}
```

## Fuzzy Duplicate Detection (Donor Matching)

```php
namespace App\Service\Import;

/**
 * Match donors by name similarity (for grouping payments).
 * Useful when bank exports have inconsistent donor names.
 */
final class DonorMatcher
{
    private const SIMILARITY_THRESHOLD = 85; // percent

    public function findMatch(string $donorName, array $existingDonors): ?string
    {
        $normalized = $this->normalize($donorName);

        foreach ($existingDonors as $existing) {
            $normalizedExisting = $this->normalize($existing);

            // Exact match after normalization
            if ($normalized === $normalizedExisting) {
                return $existing;
            }

            // Fuzzy match
            similar_text($normalized, $normalizedExisting, $percent);
            if ($percent >= self::SIMILARITY_THRESHOLD) {
                return $existing;
            }
        }

        return null;
    }

    private function normalize(string $name): string
    {
        $name = mb_strtolower($name);
        $name = preg_replace('/\s+/', ' ', trim($name));
        // Remove common prefixes
        $name = preg_replace('/^(pan|pani|firma|fhu|phu)\s+/i', '', $name);
        return $name;
    }
}
```

## CSV Export

```php
namespace App\Service\Export;

use League\Csv\Writer;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class CsvExporter
{
    /**
     * @param array<string, string> $headers Column mapping: ['property' => 'CSV Header']
     * @param iterable<object> $data
     */
    public function export(array $headers, iterable $data, string $filename): StreamedResponse
    {
        return new StreamedResponse(function () use ($headers, $data) {
            $csv = Writer::createFromStream(fopen('php://output', 'w'));
            $csv->setDelimiter(';');
            $csv->insertOne(array_values($headers));

            foreach ($data as $item) {
                $row = [];
                foreach (array_keys($headers) as $property) {
                    $getter = 'get' . ucfirst($property);
                    $value = $item->$getter();

                    if ($value instanceof \DateTimeInterface) {
                        $value = $value->format('Y-m-d');
                    }

                    $row[] = (string) $value;
                }
                $csv->insertOne($row);
            }
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => sprintf('attachment; filename="%s"', $filename),
        ]);
    }
}
```

## API Controller for Import/Export

```php
namespace App\Controller;

use App\Service\Export\CsvExporter;
use App\Service\Import\PaymentImportService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\File\UploadedFile;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/payments')]
#[IsGranted('ROLE_IMPORT')]
final class PaymentImportController extends AbstractController
{
    #[Route('/import', methods: ['POST'])]
    public function import(
        Request $request,
        PaymentImportService $importService,
    ): JsonResponse {
        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');

        if ($file === null || !$file->isValid()) {
            return $this->json(['error' => 'No valid file uploaded'], 400);
        }

        // Validate file type
        $extension = $file->getClientOriginalExtension();
        if (!in_array($extension, ['csv', 'txt'], true)) {
            return $this->json(['error' => 'Only CSV files are accepted'], 400);
        }

        $dryRun = $request->request->getBoolean('dry_run', false);

        $result = $importService->import($file->getPathname(), [
            'dry_run' => $dryRun,
            'skip_duplicates' => $request->request->getBoolean('skip_duplicates', false),
        ]);

        return $this->json([
            'total_rows' => $result->totalRows,
            'imported' => $result->imported,
            'skipped_duplicates' => $result->skippedDuplicates,
            'error_count' => $result->errorCount,
            'errors' => array_map(fn ($e) => [
                'row' => $e->row,
                'message' => $e->message,
                'field' => $e->field,
            ], $result->errors),
            'dry_run' => $dryRun,
        ]);
    }

    #[Route('/import/preview', methods: ['POST'])]
    public function preview(
        Request $request,
        PaymentImportService $importService,
    ): JsonResponse {
        /** @var UploadedFile|null $file */
        $file = $request->files->get('file');

        if ($file === null || !$file->isValid()) {
            return $this->json(['error' => 'No valid file uploaded'], 400);
        }

        // Always dry-run for preview
        $result = $importService->import($file->getPathname(), [
            'dry_run' => true,
            'skip_duplicates' => false,
        ]);

        return $this->json($result);
    }

    #[Route('/export', methods: ['GET'])]
    public function export(
        PaymentRepository $repository,
        CsvExporter $exporter,
    ): StreamedResponse {
        $payments = $repository->findForExport();

        return $exporter->export(
            [
                'transactionDate' => 'Data transakcji',
                'amount' => 'Kwota',
                'senderName' => 'Nadawca',
                'title' => 'Tytuł',
                'category' => 'Kategoria',
            ],
            $payments,
            sprintf('payments_%s.csv', date('Y-m-d')),
        );
    }
}
```

## Auto-Categorization

```php
namespace App\Service\Import;

/**
 * Automatically assign payment category based on rules.
 * Rules are checked in order; first match wins.
 */
final class PaymentCategorizer
{
    /** @var CategoryRule[] */
    private array $rules = [];

    public function __construct(
        private readonly CategoryRuleRepository $ruleRepository,
    ) {}

    public function categorize(Payment $payment): ?string
    {
        $rules = $this->ruleRepository->findAllActive();

        foreach ($rules as $rule) {
            if ($this->matches($payment, $rule)) {
                return $rule->getCategoryCode();
            }
        }

        return null; // uncategorized - needs manual review
    }

    private function matches(Payment $payment, CategoryRule $rule): bool
    {
        return match ($rule->getMatchType()) {
            'title_contains' => str_contains(
                mb_strtolower($payment->getTitle()),
                mb_strtolower($rule->getPattern()),
            ),
            'title_regex' => (bool) preg_match($rule->getPattern(), $payment->getTitle()),
            'sender_exact' => mb_strtolower($payment->getSenderName()) === mb_strtolower($rule->getPattern()),
            'amount_range' => $payment->getAmount() >= $rule->getMinAmount()
                && $payment->getAmount() <= $rule->getMaxAmount(),
            default => false,
        };
    }
}
```

## Batch Processing Best Practices

```php
// ✅ GOOD: Flush in batches to control memory
$batchSize = 50;
$count = 0;

foreach ($records as $record) {
    $entity = $this->mapToEntity($record);
    $this->em->persist($entity);
    $count++;

    if ($count % $batchSize === 0) {
        $this->em->flush();
        $this->em->clear(); // Detach all entities to free memory
    }
}

$this->em->flush(); // Final flush for remaining
$this->em->clear();

// ❌ BAD: Flush inside loop (1 query per row)
foreach ($records as $record) {
    $entity = $this->mapToEntity($record);
    $this->em->persist($entity);
    $this->em->flush(); // N queries!
}

// ❌ BAD: Flush once at end without clear (memory explosion for large files)
foreach ($records as $record) {
    $entity = $this->mapToEntity($record);
    $this->em->persist($entity);
}
$this->em->flush(); // All entities in memory!
```

## File Validation

```php
namespace App\Validator;

use Symfony\Component\HttpFoundation\File\UploadedFile;

final class CsvFileValidator
{
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private const ALLOWED_MIMES = ['text/csv', 'text/plain', 'application/csv'];

    public function validate(UploadedFile $file): array
    {
        $errors = [];

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            $errors[] = 'File size exceeds 10MB limit.';
        }

        if (!in_array($file->getMimeType(), self::ALLOWED_MIMES, true)) {
            $errors[] = sprintf('Invalid file type: %s', $file->getMimeType());
        }

        // Check encoding (UTF-8 expected)
        $sample = file_get_contents($file->getPathname(), false, null, 0, 1024);
        if (!mb_check_encoding($sample, 'UTF-8')) {
            $errors[] = 'File is not UTF-8 encoded. Convert before importing.';
        }

        return $errors;
    }
}
```

---

> **Version:** 1.0 | **Stack:** Symfony 7.4 LTS, Doctrine ORM, PostgreSQL, League\Csv  
> **See also:** `DOCTRINE_PATTERNS.md` (batch queries), `API_PATTERNS.md` (file upload endpoints)
