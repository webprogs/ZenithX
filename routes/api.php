<?php

use App\Http\Controllers\Api\Auth\InvitationController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\UserController;
use App\Http\Controllers\Api\Admin\AuditLogController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\InvitationLinkController;
use App\Http\Controllers\Api\Admin\MemberController;
use App\Http\Controllers\Api\Admin\NotificationController as AdminNotificationController;
use App\Http\Controllers\Api\Admin\SettingsController;
use App\Http\Controllers\Api\Admin\TopupRequestController as AdminTopupRequestController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Admin\WithdrawalRequestController as AdminWithdrawalRequestController;
use App\Http\Controllers\Api\Member\DashboardController as MemberDashboardController;
use App\Http\Controllers\Api\Member\InvestmentController;
use App\Http\Controllers\Api\Member\NotificationController;
use App\Http\Controllers\Api\Member\ProfileController;
use App\Http\Controllers\Api\Member\TopupRequestController as MemberTopupRequestController;
use App\Http\Controllers\Api\Member\WithdrawalRequestController as MemberWithdrawalRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/auth/login', LoginController::class);
Route::post('/auth/register', RegisterController::class);
Route::get('/invitation/{code}', InvitationController::class);

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'force.logout'])->group(function () {
    Route::post('/auth/logout', LogoutController::class);
    Route::get('/auth/user', UserController::class);

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('admin')->middleware(['admin', 'active'])->group(function () {
        Route::get('/dashboard', AdminDashboardController::class);

        Route::prefix('members')->group(function () {
            Route::get('/', [MemberController::class, 'index']);
            Route::get('/export', [MemberController::class, 'export']);
            Route::get('/{member}', [MemberController::class, 'show']);
            Route::get('/{member}/transactions', [MemberController::class, 'transactions']);
        });

        Route::prefix('topup-requests')->group(function () {
            Route::get('/', [AdminTopupRequestController::class, 'index']);
            Route::get('/{topupRequest}', [AdminTopupRequestController::class, 'show']);
            Route::post('/{topupRequest}/approve', [AdminTopupRequestController::class, 'approve']);
            Route::post('/{topupRequest}/reject', [AdminTopupRequestController::class, 'reject']);
        });

        Route::prefix('withdrawal-requests')->group(function () {
            Route::get('/', [AdminWithdrawalRequestController::class, 'index']);
            Route::get('/{withdrawalRequest}', [AdminWithdrawalRequestController::class, 'show']);
            Route::post('/{withdrawalRequest}/approve', [AdminWithdrawalRequestController::class, 'approve']);
            Route::post('/{withdrawalRequest}/paid', [AdminWithdrawalRequestController::class, 'markPaid']);
            Route::post('/{withdrawalRequest}/reject', [AdminWithdrawalRequestController::class, 'reject']);
        });

        Route::prefix('invitation-links')->group(function () {
            Route::get('/', [InvitationLinkController::class, 'index']);
            Route::post('/', [InvitationLinkController::class, 'store']);
            Route::get('/{invitationLink}', [InvitationLinkController::class, 'show']);
            Route::put('/{invitationLink}', [InvitationLinkController::class, 'update']);
            Route::delete('/{invitationLink}', [InvitationLinkController::class, 'destroy']);
        });

        Route::prefix('users')->group(function () {
            Route::get('/', [UserManagementController::class, 'index']);
            Route::get('/{user}', [UserManagementController::class, 'show']);
            Route::put('/{user}/status', [UserManagementController::class, 'updateStatus']);
            Route::post('/{user}/force-logout', [UserManagementController::class, 'forceLogout']);
            Route::post('/{user}/reset-password', [UserManagementController::class, 'resetPassword']);
            Route::put('/{user}/freeze-withdrawal', [UserManagementController::class, 'toggleWithdrawalFreeze']);
            Route::put('/{user}/interest-rate', [UserManagementController::class, 'adjustInterestRate']);
        });

        Route::get('/settings', [SettingsController::class, 'index']);
        Route::put('/settings', [SettingsController::class, 'update']);

        Route::prefix('audit-logs')->group(function () {
            Route::get('/', [AuditLogController::class, 'index']);
            Route::get('/actions', [AuditLogController::class, 'actions']);
            Route::get('/{auditLog}', [AuditLogController::class, 'show']);
        });

        Route::prefix('notifications')->group(function () {
            Route::get('/', [AdminNotificationController::class, 'index']);
            Route::get('/unread-count', [AdminNotificationController::class, 'unreadCount']);
            Route::put('/{notification}/read', [AdminNotificationController::class, 'markAsRead']);
            Route::put('/read-all', [AdminNotificationController::class, 'markAllAsRead']);
            Route::delete('/{notification}', [AdminNotificationController::class, 'destroy']);
            Route::delete('/', [AdminNotificationController::class, 'clearAll']);
        });
    });

    /*
    |--------------------------------------------------------------------------
    | Member Routes
    |--------------------------------------------------------------------------
    */

    Route::prefix('member')->middleware('active')->group(function () {
        Route::get('/dashboard', MemberDashboardController::class);
        Route::get('/dashboard/chart', [MemberDashboardController::class, 'chart']);

        Route::prefix('investments')->group(function () {
            Route::get('/', [InvestmentController::class, 'index']);
            Route::get('/projections', [InvestmentController::class, 'projections']);
            Route::get('/{investment}', [InvestmentController::class, 'show']);
        });

        Route::prefix('topup-requests')->group(function () {
            Route::get('/', [MemberTopupRequestController::class, 'index']);
            Route::post('/', [MemberTopupRequestController::class, 'store']);
            Route::get('/{topupRequest}', [MemberTopupRequestController::class, 'show']);
        });

        Route::prefix('withdrawal-requests')->group(function () {
            Route::get('/', [MemberWithdrawalRequestController::class, 'index']);
            Route::post('/', [MemberWithdrawalRequestController::class, 'store']);
            Route::get('/balance', [MemberWithdrawalRequestController::class, 'balance']);
            Route::get('/limits', [MemberWithdrawalRequestController::class, 'limits']);
            Route::get('/{withdrawalRequest}', [MemberWithdrawalRequestController::class, 'show']);
        });

        Route::prefix('notifications')->group(function () {
            Route::get('/', [NotificationController::class, 'index']);
            Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
            Route::put('/{notification}/read', [NotificationController::class, 'markAsRead']);
            Route::put('/read-all', [NotificationController::class, 'markAllAsRead']);
            Route::delete('/{notification}', [NotificationController::class, 'destroy']);
            Route::delete('/', [NotificationController::class, 'clearAll']);
        });

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);
        Route::put('/profile/password', [ProfileController::class, 'changePassword']);
    });
});
