<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $actionFilter = trim((string) $request->query('action_filter', ''));

        $logs = AuditLog::query()
            ->with('user:id,name,email')
            ->when($actionFilter !== '', function ($query) use ($actionFilter) {
                $query->where('action', 'like', '%'.$actionFilter.'%');
            })
            ->when($search !== '', function ($query) use ($search) {
                $like = '%'.$search.'%';
                $query->where(function ($query) use ($like) {
                    $query->where('action', 'like', $like)
                        ->orWhere('entity_type', 'like', $like)
                        ->orWhereHas('user', function ($query) use ($like) {
                            $query->where('name', 'like', $like)
                                ->orWhere('email', 'like', $like);
                        });
                });
            })
            ->latest()
            ->paginate(config('workbench.pagination.admin', 25));

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
