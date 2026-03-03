<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class BranchScope
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Admin can access all branches
        if ($user->isAdmin()) {
            return $next($request);
        }

        // Check if request has branch_id parameter
        $branchId = $request->route('branch_id')
            ?? $request->input('branch_id')
            ?? $request->header('X-Branch-Id');

        if ($branchId && !$user->canAccessBranch((int) $branchId)) {
            return response()->json([
                'message' => 'ليس لديك صلاحية للوصول لهذا الفرع',
            ], 403);
        }

        // Auto-set branch_id for non-admin users
        if (!$branchId && $user->branch_id) {
            $request->merge(['branch_id' => $user->branch_id]);
        }

        return $next($request);
    }
}
