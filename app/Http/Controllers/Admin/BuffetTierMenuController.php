<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuffetTier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BuffetTierMenuController extends Controller
{
    /**
     * Return menu IDs linked to this tier via the buffet_tier_menu pivot (buffet_tier_id / menu_id).
     */
    public function menuIds(BuffetTier $buffetTier): JsonResponse
    {
        $ids = $buffetTier->menus()
            ->orderBy('menus.id')
            ->pluck('menus.id')
            ->values()
            ->all();

        return response()->json(['menu_ids' => $ids]);
    }

    public function sync(Request $request, BuffetTier $buffetTier): RedirectResponse
    {
        $validated = $request->validate([
            'menu_ids' => ['present', 'array'],
            'menu_ids.*' => ['integer', 'exists:menus,id'],
        ]);

        $buffetTier->menus()->sync($validated['menu_ids']);

        return redirect()
            ->route('admin.master-data', [
                'section' => 'tier_menu_binding',
                'tier_id' => $buffetTier->id,
            ])
            ->with('success', 'ບັນທຶກການຜູກເມນູແລ້ວ.');
    }
}
