<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function __construct(
        private readonly AuditService $auditService
    ) {}

    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group');

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['required'],
        ]);

        $updated = [];

        foreach ($validated['settings'] as $item) {
            $setting = Setting::where('key', $item['key'])->first();

            if ($setting) {
                $oldValue = $setting->value;
                $setting->update(['value' => $item['value']]);
                $updated[] = $item['key'];

                $this->auditService->log(
                    'setting_update',
                    $setting,
                    ['value' => $oldValue],
                    ['value' => $item['value']],
                    "Setting '{$item['key']}' updated"
                );
            }
        }

        Setting::clearCache();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'data' => [
                'updated' => $updated,
            ],
        ]);
    }
}
