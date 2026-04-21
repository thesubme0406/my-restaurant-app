<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Ingredient;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class IngredientController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'ing_name' => ['required', 'string', 'max:100'],
            'ing_unit' => ['required', 'string', 'max:20'],
            'ing_quantity' => ['required', 'numeric'],
            'ing_min' => ['required', 'numeric'],
        ]);

        Ingredient::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'ingredients_master']);
    }

    public function update(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $data = $request->validate([
            'ing_name' => ['required', 'string', 'max:100'],
            'ing_unit' => ['required', 'string', 'max:20'],
            'ing_quantity' => ['required', 'numeric'],
            'ing_min' => ['required', 'numeric'],
        ]);

        $ingredient->update($data);

        return redirect()->route('admin.master-data', ['section' => 'ingredients_master']);
    }

    public function destroy(Ingredient $ingredient): RedirectResponse
    {
        if ($ingredient->poDetails()->exists() || $ingredient->stockInDetails()->exists() || $ingredient->usageDetails()->exists()) {
            throw ValidationException::withMessages([
                'ingredient' => 'ບໍ່ສາມາດລຶບວັດຖຸດິບນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນເຊື່ອມກັບຢູ່.',
            ]);
        }

        try {
            $ingredient->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'ingredient' => 'ບໍ່ສາມາດລຶບວັດຖຸດິບນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'ingredients_master']);
    }
}

