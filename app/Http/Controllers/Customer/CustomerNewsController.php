<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\News;
use App\Support\PublicStorageUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CustomerNewsController extends Controller
{
    /**
     * @return array<string, mixed>
     */
    private function serializeNews(News $n): array
    {
        $staff = $n->staff;
        $authorName = $staff !== null ? trim((string) ($staff->name.' '.$staff->surname)) : '';
        if ($authorName === '') {
            $authorName = $staff?->username ?? '—';
        }

        return [
            'id' => $n->id,
            'title' => $n->title,
            'content' => $n->content,
            'image_url' => PublicStorageUrl::from($n->image),
            'author_code' => $staff?->username ?? '',
            'author_name' => $authorName,
            'published_at' => $n->published_at?->toIso8601String(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function publishedPostsPayload(): array
    {
        return News::query()
            ->where('status', 'published')
            ->with('staff')
            ->orderByRaw('published_at IS NULL')
            ->orderByDesc('published_at')
            ->orderByDesc('id')
            ->get()
            ->map(fn (News $n): array => $this->serializeNews($n))
            ->values()
            ->all();
    }

    public function index(Request $request): Response
    {
        $postId = (int) $request->query('post', 0);

        return Inertia::render('Customer/NewsPage', [
            'posts' => $this->publishedPostsPayload(),
            'initialPostId' => $postId > 0 ? $postId : null,
        ]);
    }

    /**
     * JSON list of published news (same payload as the Inertia page) for integrations or future clients.
     */
    public function publishedApi(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->publishedPostsPayload(),
        ]);
    }
}
