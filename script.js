/* 
 <!-- Woi Kontol Lu ngapain?, mau nyuri ya lu? udh ada Wai masih aja mau genjutsu webnya malu lah sama ortu lu -->
*/

const API_PROXY = "https://api.nekolabs.web.id/px?url=";
const API_BASE = "https://www.sankavollerei.com/comic/komikcast";

const contentArea = document.getElementById('content-area');
const filterPanel = document.getElementById('filter-panel');
const mainNav = document.getElementById('main-nav');
const mobileNav = document.getElementById('mobile-nav');

function getTypeClass(type) {
    if (!type) return 'type-default';
    const t = type.toLowerCase();
    if (t.includes('manga')) return 'type-manga';
    if (t.includes('manhwa')) return 'type-manhwa';
    if (t.includes('manhua')) return 'type-manhua';
    return 'type-default';
}

async function fetchAPI(url) {
    try {
        const response = await fetch(API_PROXY + encodeURIComponent(url));
        const data = await response.json();
        if (data.success) {
            return data.result?.content || data.result || data;
        }
        return null;
    } catch (e) { return null; }
}

function toggleFilter() {
    filterPanel.classList.toggle('hidden');
}

function resetNavs() {
    mainNav.classList.remove('-translate-y-full');
    mobileNav.classList.remove('translate-y-full');
    filterPanel.classList.add('hidden');
}


function updateURL(path) {
    if (window.location.pathname !== path) {
        history.pushState(null, null, path);
    }
}


async function showHome(push = true) {
    if (push) updateURL('/'); 
    
    resetNavs();
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    const data = await fetchAPI(`${API_BASE}/home`);
    if(!data) return;

    contentArea.innerHTML = `
        <section class="mb-10">
            <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"><i class="fa fa-bolt text-amber-500"></i> Populer</h2>
            <div class="flex overflow-x-auto gap-4 hide-scroll pb-4">
                ${data.data.hotUpdates.map(item => `
                    <div class="min-w-[160px] md:min-w-[200px] cursor-pointer card-hover relative" onclick="showDetail('${item.slug}')">
                        <span class="type-badge ${getTypeClass(item.type)}">${item.type || 'Hot'}</span>
                        <img src="${item.image}" class="h-60 md:h-72 w-full object-cover rounded-2xl shadow-xl">
                        <h3 class="mt-3 text-sm font-bold truncate">${item.title}</h3>
                        <p class="text-amber-500 text-xs">${item.chapter || item.latestChapter}</p>
                    </div>
                `).join('')}
            </div>
        </section>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div class="lg:col-span-2">
                <h2 class="text-xl font-bold mb-6 border-l-4 border-amber-500 pl-4">Terbaru</h2>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    ${data.data.latestReleases.slice(0, 12).map(item => `
                        <div class="bg-zinc-900/30 border border-white/5 p-2 rounded-2xl cursor-pointer hover:border-amber-500/50 transition relative group" onclick="showDetail('${item.slug}')">
                            <img src="${item.image}" class="h-44 w-full object-cover rounded-xl">
                            <h3 class="text-xs font-bold mt-2 line-clamp-2 h-8">${item.title}</h3>
                            <p class="text-[10px] text-gray-500 mt-1">${item.chapters[0]?.title || 'Ch.?'}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div>
                <h2 class="text-xl font-bold mb-6 border-l-4 border-amber-500 pl-4">Proyek Kami</h2>
                <div class="space-y-4">
                    ${data.data.projectUpdates.map(item => `
                        <div class="flex gap-4 bg-zinc-900/20 p-2 rounded-2xl cursor-pointer hover:bg-white/5 transition" onclick="showDetail('${item.slug}')">
                            <img src="${item.image}" class="w-16 h-20 rounded-xl object-cover">
                            <div class="flex-1 flex flex-col justify-center overflow-hidden">
                                <h3 class="font-bold text-xs truncate">${item.title}</h3>
                                <p class="text-amber-500 text-[10px] mt-1">${item.chapters[0]?.title}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    window.scrollTo(0,0);
}

// ONGOING (HOT)
async function showOngoing(page = 1) {
    updateURL('/ongoing');
    resetNavs();
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    const data = await fetchAPI(`${API_BASE}/list?status=Ongoing&orderby=popular&page=${page}`);
    renderGrid(data, "Komik Ongoing Terpopuler", "showOngoing");
}

async function showCompleted(page = 1) {
    resetNavs();
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    const data = await fetchAPI(`${API_BASE}/list?status=Completed&orderby=popular&page=${page}`);
    renderGrid(data, "Komik Tamat (Selesai)", "showCompleted");
}

async function applyAdvancedFilter() {
    const query = document.getElementById('search-input').value;
    if(!query) return;
    filterPanel.classList.add('hidden');
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    const data = await fetchAPI(`${API_BASE}/search/${encodeURIComponent(query)}/1`);
    renderGrid(data, `Hasil Pencarian: ${query}`, null);
}

function renderGrid(data, title, funcName) {
    const list = data?.data || [];
    if(list.length === 0) {
        contentArea.innerHTML = `<div class="text-center py-40 text-gray-500"><p>Komik tidak ditemukan.</p></div>`;
        return;
    }

    let paginationHTML = '';
    if (data.pagination && funcName) {
        const current = data.pagination.currentPage;
        const hasNext = data.pagination.hasNextPage;
        
        paginationHTML = `
            <div class="mt-14 flex justify-center items-center gap-6">
                ${current > 1 ? `<button onclick="${funcName}(${current - 1})" class="glass px-6 py-2 rounded-xl text-xs hover:bg-amber-500 hover:text-black transition">Prev</button>` : ''}
                <span class="bg-amber-500 text-black px-6 py-2 rounded-xl text-xs font-extrabold">${current}</span>
                ${hasNext ? `<button onclick="${funcName}(${current + 1})" class="glass px-6 py-2 rounded-xl text-xs hover:bg-amber-500 hover:text-black transition">Next</button>` : ''}
            </div>
        `;
    }

    contentArea.innerHTML = `
        <h2 class="text-2xl font-bold mb-8 border-l-4 border-amber-500 pl-4">${title}</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            ${list.map(item => `
                <div class="bg-zinc-900/40 rounded-2xl overflow-hidden border border-white/5 card-hover cursor-pointer relative group" onclick="showDetail('${item.slug}')">
                    <span class="type-badge ${getTypeClass(item.type)}">${item.type || 'Comic'}</span>
                    <img src="${item.image}" class="h-64 w-full object-cover">
                    <div class="p-3 text-center">
                        <h3 class="text-xs font-bold truncate group-hover:text-amber-500 transition">${item.title}</h3>
                        <p class="text-[10px] text-amber-500 mt-1">${item.latestChapter || item.chapter || 'Baca'}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        ${paginationHTML}
    `;
    window.scrollTo(0,0);
}


async function showDetail(slug, push = true) {
    if (push) updateURL(`/series/${slug}`);

    resetNavs(); 
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    const data = await fetchAPI(`${API_BASE}/detail/${slug}`);
    if(!data) return;

    const res = data.data;
    const history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
    const savedItem = history.find(h => h.slug === slug);
    
    const startBtnText = savedItem && savedItem.lastChapterTitle ? `Lanjut: ${savedItem.lastChapterTitle}` : "Baca Chapter Pertama";
    const startBtnAction = savedItem && savedItem.lastChapterSlug ? 
        `readChapter('${savedItem.lastChapterSlug}', '${slug}')` : 
        `readChapter('${res.chapters[res.chapters.length - 1].slug}', '${slug}')`;

    contentArea.innerHTML = `
        <div class="flex flex-col md:flex-row gap-10">
            <div class="md:w-1/3">
                <div class="relative">
                    <span class="type-badge ${getTypeClass(res.type)} scale-125 top-5 left-5">${res.type || 'Comic'}</span>
                    <img src="${res.image}" class="w-full rounded-3xl shadow-2xl border border-white/10">
                </div>
                <div class="flex flex-col gap-3 mt-6">
                    <button onclick="${startBtnAction}" class="amber-gradient w-full py-4 rounded-2xl font-bold text-black flex items-center justify-center gap-2 active:scale-95 transition">
                        <i class="fa fa-play"></i> ${startBtnText}
                    </button>
                    <button onclick="toggleBookmark('${slug}', '${res.title.replace(/'/g, "")}', '${res.image}')" id="btn-bookmark"
                        class="w-full py-4 rounded-2xl glass font-bold border-white/10 hover:bg-white/5 transition">
                        <i class="fa fa-bookmark"></i> Simpan Koleksi
                    </button>
                </div>
            </div>
            <div class="md:w-2/3">
                <h1 class="text-3xl font-extrabold mb-4">${res.title}</h1>
                <div class="flex flex-wrap gap-4 mb-6 text-sm">
                    <span class="text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">${res.status}</span>
                    <span class="text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">⭐ ${res.rating}</span>
                </div>
                <p class="text-gray-400 text-sm leading-relaxed mb-8">${res.synopsis || "Sinopsis tidak tersedia."}</p>
                <div class="glass rounded-3xl p-6 border-white/5">
                    <h3 class="text-lg font-bold mb-4">Daftar Chapter</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2">
                        ${res.chapters.map(ch => `
                            <div onclick="readChapter('${ch.slug}', '${slug}')" class="bg-white/5 p-3 rounded-xl cursor-pointer hover:bg-amber-500 hover:text-black transition text-sm flex justify-between">
                                <span>${ch.title}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
    checkBookmarkStatus(slug);
    saveHistory(slug, res.title, res.image);
    window.scrollTo(0,0);
}

async function readChapter(chSlug, comicSlug, push = true) {
    if (push) updateURL(`/chapter/${chSlug}`);

    mainNav.classList.add('-translate-y-full');
    mobileNav.classList.add('translate-y-full');
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    const data = await fetchAPI(`${API_BASE}/chapter/${chSlug}`);
    if(!data) return;

    const res = data.data;

    const backAction = comicSlug ? `showDetail('${comicSlug}')` : `showHome()`;

    contentArea.innerHTML = `
        <div class="relative min-h-screen bg-black -mx-4 -mt-24">
            <div id="reader-top" class="reader-ui fixed top-0 w-full glass z-[60] p-4 flex justify-between items-center border-b border-white/10">
                <button onclick="${backAction}" class="p-2 hover:bg-white/10 rounded-full"><i class="fa fa-arrow-left"></i></button>
                <h2 class="text-xs font-bold truncate text-amber-500 max-w-[200px]">${chSlug.replace(/-/g, ' ')}</h2>
                <div class="w-10"></div>
            </div>
            <div class="flex flex-col items-center pt-20 pb-40" onclick="toggleReaderUI()">
                ${res.images.map(img => `<img src="${img}" class="max-w-full md:max-w-3xl" loading="lazy">`).join('')}
            </div>
            <div id="reader-bottom" class="reader-ui fixed bottom-6 left-0 w-full z-[60] px-4 flex justify-center">
                <div class="glass p-3 rounded-2xl flex gap-6 items-center shadow-2xl border border-white/10">
                    <button onclick="${res.navigation.prev ? `readChapter('${res.navigation.prev}', '${comicSlug || ''}')` : ''}" class="p-4 bg-white/5 rounded-xl ${!res.navigation.prev ? 'opacity-10' : 'hover:bg-amber-500 hover:text-black transition'}"><i class="fa fa-chevron-left"></i></button>
                    <span class="text-xs font-bold px-4">Navigasi</span>
                    <button onclick="${res.navigation.next ? `readChapter('${res.navigation.next}', '${comicSlug || ''}')` : ''}" class="p-4 amber-gradient text-black rounded-xl ${!res.navigation.next ? 'opacity-10' : 'hover:scale-105 transition'}"><i class="fa fa-chevron-right"></i></button>
                </div>
            </div>
        </div>
    `;
    
    if(comicSlug) {
        saveHistory(comicSlug, null, null, chSlug, chSlug.replace(/-/g, ' '));
    }
    window.scrollTo(0,0);
}

function toggleReaderUI() {
    document.getElementById('reader-top').classList.toggle('ui-hidden-top');
    document.getElementById('reader-bottom').classList.toggle('ui-hidden-bottom');
}

function handleSearch(e) { if(e.key === 'Enter') applyAdvancedFilter(); }


function saveHistory(slug, title, image, chSlug, chTitle) {
    let history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
    let existing = history.find(h => h.slug === slug);
    const data = {
        slug,
        title: title || existing?.title,
        image: image || existing?.image,
        lastChapterSlug: chSlug || existing?.lastChapterSlug,
        lastChapterTitle: chTitle || existing?.lastChapterTitle
    };
    history = history.filter(h => h.slug !== slug);
    history.unshift(data);
    if (history.length > 30) history.pop();
    localStorage.setItem('fmc_history', JSON.stringify(history));
}

function showHistory() {
    let history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
    renderGrid({ data: history }, "Riwayat Baca", null);
}

function toggleBookmark(slug, title, image) {
    let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
    const idx = bookmarks.findIndex(b => b.slug === slug);
    if (idx > -1) bookmarks.splice(idx, 1);
    else bookmarks.push({ slug, title, image });
    localStorage.setItem('fmc_bookmarks', JSON.stringify(bookmarks));
    checkBookmarkStatus(slug);
}

function checkBookmarkStatus(slug) {
    let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
    const btn = document.getElementById('btn-bookmark');
    if (btn && bookmarks.some(b => b.slug === slug)) {
        btn.innerHTML = `<i class="fa fa-check text-amber-500"></i> Tersimpan`;
    } else if (btn) {
        btn.innerHTML = `<i class="fa fa-bookmark"></i> Simpan Koleksi`;
    }
}

function showBookmarks() {
    let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
    renderGrid({ data: bookmarks }, "Koleksi Favorit", null);
}


window.addEventListener('popstate', () => {
    handleInitialLoad();
});

function handleInitialLoad() {
    const path = window.location.pathname;
    
    resetNavs(); 

    if (path === '/' || path === '/index.html') {
        showHome(false); // false = jangan pushState karena kita sudah di URL tsb
    } 
    else if (path.startsWith('/series/')) {
        //  slug dari URL: /series/nama-komik
        const parts = path.split('/');
        // parts[0] = "", parts[1] = "series", parts[2] = "nama-komik"
        const slug = parts[2];
        if (slug) showDetail(slug, false);
        else showHome(false);
    } 
    else if (path.startsWith('/chapter/')) {
        // slug dari URL: /chapter/nama-chapter
        const parts = path.split('/');
        const slug = parts[2];
        if (slug) readChapter(slug, null, false); 
        else showHome(false);
    } 
    else {
        showHome(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    handleInitialLoad();
});
