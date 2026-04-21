<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuCatg;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MenuCatgController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'catg_name' => ['required', 'string', 'max:30'],
            'image' => ['required', 'image', 'max:4096'],
        ]);

        $data['image'] = $request->file('image')->store('menu-categories', 'public');

        MenuCatg::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'food_categories']);
    }

    public function update(Request $request, MenuCatg $menuCatg): RedirectResponse
    {
        $data = $request->validate([
            'catg_name' => ['required', 'string', 'max:30'],
            'image' => ['nullable', 'image', 'max:4096'],
        ]);

        if ($request->hasFile('image')) {
            if ($menuCatg->image) {
                Storage::disk('public')->delete($menuCatg->image);
            }
            $data['image'] = $request->file('image')->store('menu-categories', 'public');
        } else {
            unset($data['image']);
        }

        $menuCatg->update($data);

        return redirect()->route('admin.master-data', ['section' => 'food_categories']);
    }

    public function destroy(MenuCatg $menuCatg): RedirectResponse
    {
        if ($menuCatg->menus()->exists()) {
            throw ValidationException::withMessages([
                'menu_category' => 'ບໍ່ສາມາດລຶບປະເພດນີ້ໄດ້ ເນື່ອງຈາກມີລາຍການອາຫານເຊື່ອມກັບປະເພດນີ້.',
            ]);
        }

        try {
            if ($menuCatg->image) {
                Storage::disk('public')->delete($menuCatg->image);
            }
            $menuCatg->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'menu_category' => 'ບໍ່ສາມາດລຶບປະເພດນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'food_categories']);
    }
}
