<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class MenuController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'category_id' => ['required', 'integer', 'exists:menu_catg,id'],
            'name' => ['required', 'string', 'max:25'],
            'description' => ['nullable', 'string', 'max:10000'],
            'image' => ['required', 'image', 'max:4096'],
            'is_active' => ['required', 'boolean'],
        ]);

        $data['image'] = $request->file('image')->store('menus', 'public');
        $data['description'] = $data['description'] ?? null;

        Menu::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'food_menu']);
    }

    public function update(Request $request, Menu $menu): RedirectResponse
    {
        $data = $request->validate([
            'category_id' => ['required', 'integer', 'exists:menu_catg,id'],
            'name' => ['required', 'string', 'max:25'],
            'description' => ['nullable', 'string', 'max:10000'],
            'image' => ['nullable', 'image', 'max:4096'],
            'is_active' => ['required', 'boolean'],
        ]);

        $data['description'] = $data['description'] ?? null;

        if ($request->hasFile('image')) {
            if ($menu->image) {
                Storage::disk('public')->delete($menu->image);
            }
            $data['image'] = $request->file('image')->store('menus', 'public');
        } else {
            unset($data['image']);
        }

        $menu->update($data);

        return redirect()->route('admin.master-data', ['section' => 'food_menu']);
    }

    public function destroy(Menu $menu): RedirectResponse
    {
        if ($menu->menuDetails()->exists()) {
            throw ValidationException::withMessages([
                'menu' => 'ບໍ່ສາມາດລຶບລາຍການນີ້ໄດ້ ເນື່ອງຈາກມີເມນູບຸບເຟ່ເຊື່ອມກັບລາຍການນີ້.',
            ]);
        }

        try {
            if ($menu->image) {
                Storage::disk('public')->delete($menu->image);
            }
            $menu->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'menu' => 'ບໍ່ສາມາດລຶບລາຍການນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'food_menu']);
    }
}
