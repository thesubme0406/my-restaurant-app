<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BuffetTier;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class BuffetTierController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'tier_name' => ['required', 'string', 'max:25'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:10000'],
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $data['image'] = $request->file('image')->store('buffet-tiers', 'public');
        $data['description'] = $data['description'] ?? null;

        BuffetTier::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'buffet_menu']);
    }

    public function update(Request $request, BuffetTier $buffetTier): RedirectResponse
    {
        $data = $request->validate([
            'tier_name' => ['required', 'string', 'max:25'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['nullable', 'string', 'max:10000'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        $data['description'] = $data['description'] ?? null;

        if ($request->hasFile('image')) {
            if ($buffetTier->image) {
                Storage::disk('public')->delete($buffetTier->image);
            }
            $data['image'] = $request->file('image')->store('buffet-tiers', 'public');
        } else {
            unset($data['image']);
        }

        $buffetTier->update($data);

        return redirect()->route('admin.master-data', ['section' => 'buffet_menu']);
    }

    public function destroy(BuffetTier $buffetTier): RedirectResponse
    {
        if ($buffetTier->bookings()->exists()) {
            throw ValidationException::withMessages([
                'buffet_tier' => 'ບໍ່ສາມາດລຶບໄດ້ ເນື່ອງຈາກມີການຈອງເຊື່ອມກັບປະເພດນີ້.',
            ]);
        }

        try {
            if ($buffetTier->image) {
                Storage::disk('public')->delete($buffetTier->image);
            }
            $buffetTier->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'buffet_tier' => 'ບໍ່ສາມາດລຶບປະເພດນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'buffet_menu']);
    }
}
