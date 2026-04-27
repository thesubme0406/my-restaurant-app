import { Head, usePage } from '@inertiajs/react';
import { Share2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import CustomerLayout from '@/Layouts/CustomerLayout';

const PREVIEW_MAX_CHARS = 220;
const PREVIEW_MAX_LINES = 4;

function formatPostDate(iso) {
    if (!iso) {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat('lo-LA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(iso));
    } catch {
        return '—';
    }
}

function buildPreview(content) {
    const text = (content ?? '').trim();
    if (!text) {
        return { preview: '', needsMore: false };
    }
    const lines = text.split(/\r?\n/);
    const headLines = lines.slice(0, PREVIEW_MAX_LINES).join('\n');
    const short = headLines.length > PREVIEW_MAX_CHARS ? `${headLines.slice(0, PREVIEW_MAX_CHARS).trim()}…` : headLines;
    const needsMore = text.length > PREVIEW_MAX_CHARS || lines.length > PREVIEW_MAX_LINES;
    return { preview: short, needsMore };
}

function shareUrl(postId) {
    const base = route('customer.news');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}post=${postId}`;
}

export default function NewsPage() {
    const { posts = [], initialPostId = null } = usePage().props;
    const [detail, setDetail] = useState(null);
    const [shareHint, setShareHint] = useState('');

    const openById = useCallback(
        (id) => {
            const p = posts.find((x) => x.id === id);
            if (p) {
                setDetail(p);
            }
        },
        [posts]
    );

    useEffect(() => {
        if (initialPostId) {
            openById(initialPostId);
        }
    }, [initialPostId, openById]);

    const closeDetail = useCallback(() => setDetail(null), []);

    const handleShare = useCallback(async (post) => {
        const url = shareUrl(post.id);
        const title = post.title ?? '';
        try {
            if (navigator.share) {
                await navigator.share({ title, text: title, url });
                return;
            }
        } catch (e) {
            if (e?.name === 'AbortError') {
                return;
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            setShareHint('ສຳເນົາລິ້ງແລ້ວ');
        } catch {
            setShareHint(url);
        }
        window.setTimeout(() => setShareHint(''), 3200);
    }, []);

    const cards = useMemo(
        () =>
            posts.map((post) => {
                const { preview, needsMore } = buildPreview(post.content);
                return { post, preview, needsMore };
            }),
        [posts]
    );

    return (
        <CustomerLayout>
            <Head title="ຂ່າວສານ ແລະ ໂປຣໂມຊັ່ນ" />

            <div className="space-y-4 pb-6">
                <div className="rounded-2xl border border-[#194c9f]/15 bg-white px-4 py-3 shadow-sm">
                    <h2 className="font-lao text-lg font-bold leading-snug text-[#194c9f]">ຂ່າວສານ ແລະ ໂປຣໂມຊັ່ນ</h2>
                    <p className="mt-1 text-xs text-slate-600">ຕິດຕາມຂ່າວສານ ແລະ ໂປຣໂມຊັ່ນລ່າສຸດຈາກ OSHINEI</p>
                </div>

                {posts.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#194c9f]/25 bg-white px-5 py-12 text-center shadow-sm">
                        <p className="font-lao text-sm font-medium leading-relaxed text-slate-600">
                            ຍັງບໍ່ມີຂ່າວສານ ຫຼື ໂປຣໂມຊັ່ນໃນເວລານີ້
                        </p>
                    </div>
                ) : (
                    <ul className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                        {cards.map(({ post, preview, needsMore }) => (
                            <li key={post.id}>
                                <button
                                    type="button"
                                    onClick={() => setDetail(post)}
                                    className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-md ring-1 ring-black/5 transition hover:border-[#194c9f]/35 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#194c9f]"
                                >
                                    <div className="relative aspect-[16/9] w-full bg-slate-100">
                                        {post.image_url ? (
                                            <img
                                                src={post.image_url}
                                                alt=""
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#194c9f] to-[#0f2f66] text-sm font-semibold text-white/90">
                                                OSHINEI
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2 px-4 pb-4 pt-3">
                                        <h3 className="font-lao text-base font-bold leading-snug text-[#194c9f]">{post.title}</h3>
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                                            <time dateTime={post.published_at ?? undefined}>{formatPostDate(post.published_at)}</time>
                                            <span aria-hidden>·</span>
                                            <span>
                                                {post.author_name}
                                                {post.author_code ? (
                                                    <span className="text-slate-400"> ({post.author_code})</span>
                                                ) : null}
                                            </span>
                                        </div>
                                        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{preview}</p>
                                        {needsMore ? (
                                            <span className="text-sm font-semibold text-[#194c9f]">ເບິ່ງເພີ່ມເຕີມ →</span>
                                        ) : null}
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {detail ? (
                <div
                    className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="news-detail-title"
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-900/50"
                        onClick={closeDetail}
                        aria-label="ປິດ"
                    />
                    <div className="relative flex max-h-[min(92vh,900px)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                            <button
                                type="button"
                                onClick={() => handleShare(detail)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-[#194c9f] hover:bg-slate-50"
                            >
                                <Share2 className="h-4 w-4" />
                                ແຊຣ໌
                            </button>
                            <button
                                type="button"
                                onClick={closeDetail}
                                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                                aria-label="ປິດ"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {shareHint ? (
                            <p className="border-b border-amber-100 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">{shareHint}</p>
                        ) : null}
                        <div className="min-h-0 flex-1 overflow-y-auto">
                            <div className="bg-slate-50">
                                {detail.image_url ? (
                                    <img
                                        src={detail.image_url}
                                        alt=""
                                        className="mx-auto max-h-[min(52vh,420px)] w-full object-contain"
                                    />
                                ) : (
                                    <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-[#194c9f] to-[#0f2f66] text-white">
                                        OSHINEI
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3 px-4 py-4">
                                <h3 id="news-detail-title" className="font-lao text-lg font-bold leading-snug text-[#194c9f]">
                                    {detail.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                                    <time dateTime={detail.published_at ?? undefined}>{formatPostDate(detail.published_at)}</time>
                                    <span>·</span>
                                    <span>
                                        {detail.author_name}
                                        {detail.author_code ? <span className="text-slate-400"> ({detail.author_code})</span> : null}
                                    </span>
                                </div>
                                <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{detail.content}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </CustomerLayout>
    );
}
