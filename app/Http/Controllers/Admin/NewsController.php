<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class NewsController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:staffs,id'],
            'title' => ['required', 'string', 'max:50'],
            'content' => ['required', 'string', 'max:20000'],
            'image' => ['nullable', 'image', 'max:4096'],
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'expired'])],
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('news', 'public');
        } else {
            $data['image'] = null;
        }

        News::query()->create($data);

        return redirect()->route('admin.master-data', ['section' => 'news']);
    }

    public function update(Request $request, News $news): RedirectResponse
    {
        $data = $request->validate([
            'staff_id' => ['required', 'integer', 'exists:staffs,id'],
            'title' => ['required', 'string', 'max:50'],
            'content' => ['required', 'string', 'max:20000'],
            'image' => ['nullable', 'image', 'max:4096'],
            'status' => ['required', 'string', Rule::in(['draft', 'published', 'expired'])],
        ]);

        if ($request->hasFile('image')) {
            if ($news->image) {
                Storage::disk('public')->delete($news->image);
            }
            $data['image'] = $request->file('image')->store('news', 'public');
        } else {
            unset($data['image']);
        }

        $news->update($data);

        return redirect()->route('admin.master-data', ['section' => 'news']);
    }

    public function destroy(News $news): RedirectResponse
    {
        try {
            if ($news->image) {
                Storage::disk('public')->delete($news->image);
            }
            $news->delete();
        } catch (QueryException) {
            throw ValidationException::withMessages([
                'news' => 'ບໍ່ສາມາດລຶບຂ່າວສານນີ້ໄດ້ ເນື່ອງຈາກມີຂໍ້ມູນອ້າງອີງ.',
            ]);
        }

        return redirect()->route('admin.master-data', ['section' => 'news']);
    }
}

