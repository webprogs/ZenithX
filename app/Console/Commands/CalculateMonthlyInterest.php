<?php

namespace App\Console\Commands;

use App\Services\InterestService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CalculateMonthlyInterest extends Command
{
    protected $signature = 'interest:calculate
                            {--dry-run : Run without making changes}
                            {--date= : Specific date to process (Y-m-d format)}';

    protected $description = 'Calculate and credit interest for investments due today (based on investment anniversary dates)';

    public function __construct(
        private InterestService $interestService,
        private NotificationService $notificationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $date = $this->option('date')
            ? Carbon::parse($this->option('date'))
            : now();

        $this->info("Interest Calculation - {$date->toDateString()}");
        $this->info("Checking today and yesterday for eligible investments...");
        $this->newLine();

        if ($this->option('dry-run')) {
            return $this->handleDryRun($date);
        }

        return $this->handleRealRun($date);
    }

    private function handleDryRun(Carbon $date): int
    {
        $this->warn('DRY RUN MODE - No changes will be made');
        $this->newLine();

        $startTime = microtime(true);

        try {
            $results = $this->interestService->previewDailyInterest($date);

            $this->info('Preview Results:');
            $this->newLine();

            $this->table(
                ['Metric', 'Value'],
                [
                    ['Date', $results['date']],
                    ['Would Process', $results['would_process']],
                    ['Would Skip', $results['would_skip']],
                    ['Total Interest', '₱' . number_format($results['total_interest'], 2)],
                ]
            );

            if (!empty($results['investments'])) {
                $this->newLine();
                $this->info('Investments that would receive interest:');

                $tableData = array_map(function ($inv) {
                    return [
                        $inv['period'],
                        "#{$inv['investment_id']}",
                        $inv['user_name'],
                        '₱' . number_format($inv['amount'], 2),
                        "{$inv['interest_rate']}%",
                        $inv['start_date'],
                        '₱' . number_format($inv['interest_would_credit'], 2),
                    ];
                }, $results['investments']);

                $this->table(
                    ['Period', 'Inv ID', 'User', 'Amount', 'Rate', 'Start Date', 'Interest'],
                    $tableData
                );
            } else {
                $this->newLine();
                $this->info('No investments due for interest today or yesterday.');
            }

            $duration = round(microtime(true) - $startTime, 2);
            $this->newLine();
            $this->info("Preview completed in {$duration} seconds");

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Preview failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function handleRealRun(Carbon $date): int
    {
        $startTime = microtime(true);

        try {
            $results = $this->interestService->calculateDailyInterest($date);

            $this->info('Interest Calculation Complete!');
            $this->newLine();

            $this->table(
                ['Metric', 'Value'],
                [
                    ['Date', $results['date']],
                    ['Processed', $results['processed']],
                    ['Skipped', $results['skipped']],
                    ['Total Interest', '₱' . number_format($results['total_interest'], 2)],
                    ['Errors', count($results['errors'])],
                ]
            );

            // Show details by period
            if (!empty($results['details'])) {
                foreach ($results['details'] as $period => $investments) {
                    $this->newLine();
                    $this->info("Processed ({$period}):");

                    $tableData = array_map(function ($inv) {
                        return [
                            "#{$inv['investment_id']}",
                            $inv['user_name'],
                            '₱' . number_format($inv['amount'], 2),
                            '₱' . number_format($inv['interest_credited'], 2),
                        ];
                    }, $investments);

                    $this->table(
                        ['Investment ID', 'User', 'Amount', 'Interest Credited'],
                        $tableData
                    );
                }
            }

            // Show errors if any
            if (count($results['errors']) > 0) {
                $this->newLine();
                $this->error('Errors occurred:');
                foreach ($results['errors'] as $error) {
                    $this->line("  Investment #{$error['investment_id']}: {$error['error']}");
                }
            }

            $duration = round(microtime(true) - $startTime, 2);
            $this->newLine();
            $this->info("Completed in {$duration} seconds");

            // Send notifications for credited interest
            if ($results['processed'] > 0) {
                $this->sendInterestNotifications($results);
            }

            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Failed to calculate interest: ' . $e->getMessage());
            return self::FAILURE;
        }
    }

    private function sendInterestNotifications(array $results): void
    {
        try {
            foreach ($results['details'] as $investments) {
                foreach ($investments as $inv) {
                    $this->notificationService->notify(
                        $inv['user_id'],
                        'interest_credited',
                        "Monthly interest of ₱" . number_format($inv['interest_credited'], 2) . " has been credited to your account.",
                        [
                            'investment_id' => $inv['investment_id'],
                            'amount' => $inv['interest_credited'],
                        ]
                    );
                }
            }
        } catch (\Exception $e) {
            $this->warn('Failed to send some notifications: ' . $e->getMessage());
        }
    }
}
