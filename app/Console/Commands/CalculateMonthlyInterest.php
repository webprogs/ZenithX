<?php

namespace App\Console\Commands;

use App\Services\InterestService;
use App\Services\NotificationService;
use Illuminate\Console\Command;

class CalculateMonthlyInterest extends Command
{
    protected $signature = 'interest:calculate
                            {--dry-run : Run without making changes}';

    protected $description = 'Calculate and credit monthly interest for all active investments';

    public function __construct(
        private InterestService $interestService,
        private NotificationService $notificationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('Starting monthly interest calculation...');
        $this->newLine();

        if ($this->option('dry-run')) {
            $this->warn('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        $startTime = microtime(true);

        try {
            $results = $this->interestService->calculateMonthlyInterestForAll();

            // Display results
            $this->info('Interest Calculation Complete!');
            $this->newLine();

            $this->table(
                ['Metric', 'Value'],
                [
                    ['Processed', $results['processed']],
                    ['Skipped', $results['skipped']],
                    ['Total Interest', '₱' . number_format($results['total_interest'], 2)],
                    ['Errors', count($results['errors'])],
                ]
            );

            if (count($results['errors']) > 0) {
                $this->newLine();
                $this->error('Errors occurred:');
                foreach ($results['errors'] as $error) {
                    $this->line("Investment #{$error['investment_id']}: {$error['error']}");
                }
            }

            $duration = round(microtime(true) - $startTime, 2);
            $this->newLine();
            $this->info("Completed in {$duration} seconds");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to calculate interest: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
