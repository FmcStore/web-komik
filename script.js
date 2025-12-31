/* 
 <!-- Woi Kontol Lu ngapain?, mau nyuri ya lu? udh ada Wai masih aja mau genjutsu webnya malu lah sama ortu lu -->
*/

const API_PROXY = "https://api.nekolabs.web.id/px?url=";
const API_BASE = "https://www.sankavollerei.com/comic/komikcast";

const contentArea = document.getElementById('content-area');
const filterPanel = document.getElementById('filter-panel');
const mainNav = document.getElementById('main-nav');
const mobileNav = document.getElementById('mobile-nav');

let currentChapterList = [];
let currentComicSlug = null;

function getTypeClass(type) {
    if (!type) return 'type-default';
    const t = type.toLowerCase();
    if (t.includes('manga')) return 'type-manga';
    if (t.includes('manhwa')) return 'type-manhwa';
    if (t.includes('manhua')) return 'type-manhua';
    return 'type-default';
}

function showError(message, retryFunction = null) {
    contentArea.innerHTML = `
        <div class="text-center py-20">
            <div class="text-amber-500 text-6xl mb-4">😢</div>
            <h2 class="text-2xl font-bold mb-2">${message}</h2>
            <p class="text-gray-400 mb-6">Silakan coba lagi nanti atau hubungi admin jika masalah berlanjut.</p>
            ${retryFunction ? `
                <button onclick="${retryFunction}" class="amber-gradient px-6 py-3 rounded-xl font-bold text-black mr-3">
                    Coba Lagi
                </button>
            ` : ''}
            <button onclick="showHome()" class="bg-white/10 px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition">
                Kembali ke Beranda
            </button>
        </div>
    `;
}

function redirectTo404() {
    window.location.href = '/404.html';
}

async function fetchAPI(url, retries = 2) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch(API_PROXY + encodeURIComponent(url), {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                return data.result?.content || data.result || data;
            }
            
        } catch (e) {
            console.error(`Attempt ${i + 1} failed:`, e.message);
            if (i === retries - 1) {
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
    return null;
}

function toggleFilter() {
    filterPanel.classList.toggle('hidden');
    const genreSelect = document.getElementById('filter-genre');
    if (genreSelect.options.length <= 1) {
        loadGenres();
    }
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

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

async function loadGenres() {
    try {
        const data = await fetchAPI(`${API_BASE}/genres`);
        if(data && data.data) {
            const select = document.getElementById('filter-genre');
            const sorted = data.data.sort((a, b) => a.title.localeCompare(b.title));
            
            select.innerHTML = '<option value="">Pilih Genre</option>';
            sorted.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.slug;
                opt.text = g.title;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Failed to load genres:', error);
    }
}

async function showHome(push = true) {
    if (push) updateURL('/'); 
    
    resetNavs();
    contentArea.innerHTML = `
        <div class="flex justify-center items-center py-40">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
        </div>
    `;
    
    try {
        const data = await fetchAPI(`${API_BASE}/home`);
        
        if(!data || !data.data) {
            showError('Gagal memuat data beranda', 'showHome()');
            return;
        }

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
    } catch (error) {
        console.error('Error in showHome:', error);
        showError('Gagal memuat beranda', 'showHome()');
    }
    
    window.scrollTo(0,0);
}

async function showOngoing(page = 1) {
    updateURL('/ongoing');
    resetNavs();
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    try {
        const data = await fetchAPI(`${API_BASE}/list?status=Ongoing&orderby=popular&page=${page}`);
        renderGrid(data, "Komik Ongoing Terpopuler", "showOngoing");
    } catch (error) {
        console.error('Error in showOngoing:', error);
        showError('Gagal memuat komik ongoing', `showOngoing(${page})`);
    }
}

async function showCompleted(page = 1) {
    resetNavs();
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    try {
        const data = await fetchAPI(`${API_BASE}/list?status=Completed&orderby=popular&page=${page}`);
        renderGrid(data, "Komik Tamat (Selesai)", "showCompleted");
    } catch (error) {
        console.error('Error in showCompleted:', error);
        showError('Gagal memuat komik tamat', `showCompleted(${page})`);
    }
}

async function showGenre(slug, page = 1) {
    resetNavs();
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    try {
        const data = await fetchAPI(`${API_BASE}/genre/${slug}/${page}`);
        
        if(!data || !data.data || data.data.length === 0) {
            contentArea.innerHTML = `
                <div class="text-center py-20">
                    <h2 class="text-2xl font-bold text-amber-500 mb-4">Genre Tidak Ditemukan</h2>
                    <p class="text-gray-400 mb-6">Genre "${slug}" tidak ditemukan.</p>
                    <button onclick="showHome()" class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                        Kembali ke Beranda
                    </button>
                </div>
            `;
            return;
        }
        
        renderGrid(data, `Genre: ${slug.toUpperCase()}`, "showGenre", slug);
    } catch (error) {
        console.error('Error in showGenre:', error);
        showError(`Gagal memuat genre ${slug}`, `showGenre('${slug}', ${page})`);
    }
}

async function applyAdvancedFilter() {
    const query = document.getElementById('search-input').value;
    const genre = document.getElementById('filter-genre').value;
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;

    filterPanel.classList.add('hidden');
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    try {
        if (query) {
            const data = await fetchAPI(`${API_BASE}/search/${encodeURIComponent(query)}/1`);
            renderGrid(data, `Hasil Pencarian: ${query}`, null);
            return;
        }

        if (genre) {
            showGenre(genre, 1);
            return;
        }

        let url = `${API_BASE}/list?page=1`;
        if (type) url += `&type=${type}`;
        if (status) url += `&status=${status}`;
        url += `&orderby=popular`;

        const data = await fetchAPI(url);
        renderGrid(data, "Hasil Filter", null);
    } catch (error) {
        console.error('Error in applyAdvancedFilter:', error);
        showError('Gagal menerapkan filter', 'applyAdvancedFilter()');
    }
}

function renderGrid(data, title, funcName, extraArg = null) {
    const list = data?.data || [];
    
    if(list.length === 0) {
        contentArea.innerHTML = `<div class="text-center py-40 text-gray-500"><p>Komik tidak ditemukan.</p></div>`;
        return;
    }

    let paginationHTML = '';
    if (data.pagination && funcName) {
        const current = data.pagination.currentPage;
        const hasNext = data.pagination.hasNextPage;
        const argStr = extraArg ? `'${extraArg}', ` : '';

        paginationHTML = `
            <div class="mt-14 flex justify-center items-center gap-6">
                ${current > 1 ? `<button onclick="${funcName}(${argStr}${current - 1})" class="glass px-6 py-2 rounded-xl text-xs hover:bg-amber-500 hover:text-black transition">Prev</button>` : ''}
                <span class="bg-amber-500 text-black px-6 py-2 rounded-xl text-xs font-extrabold">${current}</span>
                ${hasNext ? `<button onclick="${funcName}(${argStr}${current + 1})" class="glass px-6 py-2 rounded-xl text-xs hover:bg-amber-500 hover:text-black transition">Next</button>` : ''}
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
    currentComicSlug = slug;
    
    if (push) updateURL(`/series/${slug}`);

    resetNavs(); 
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    try {
        const data = await fetchAPI(`${API_BASE}/detail/${slug}`);
        
        if(!data || !data.data) {
            redirectTo404();
            return;
        }

        const res = data.data;
        currentChapterList = res.chapters;

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
                    <div class="flex flex-wrap gap-2 mb-4">
                        ${res.genres ? res.genres.map(g => `<span class="bg-amber-500/10 text-amber-500 text-[10px] px-3 py-1 rounded-full font-bold uppercase border border-amber-500/20">${g.title}</span>`).join('') : ''}
                    </div>
                    
                    <h1 class="text-3xl font-extrabold mb-4">${res.title}</h1>
                    
                    <div class="flex gap-6 mb-6 text-sm bg-white/5 p-4 rounded-2xl w-fit border border-white/5">
                        <div class="flex flex-col"><span class="text-gray-500 text-[10px] uppercase font-bold">Status</span><span class="text-green-400 font-bold">${res.status}</span></div>
                        <div class="flex flex-col"><span class="text-gray-500 text-[10px] uppercase font-bold">Rating</span><span class="text-amber-500 font-bold">⭐ ${res.rating}</span></div>
                        <div class="flex flex-col"><span class="text-gray-500 text-[10px] uppercase font-bold">Type</span><span class="text-white font-bold">${res.type}</span></div>
                    </div>

                    <p class="text-gray-400 text-sm leading-relaxed mb-8 text-justify">${res.synopsis || "Sinopsis tidak tersedia."}</p>
                    <div class="glass rounded-3xl p-6 border-white/5">
                        <h3 class="text-lg font-bold mb-4">Daftar Chapter</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2 custom-scroll">
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
        
    } catch (error) {
        console.error('Error in showDetail:', error);
        showError('Gagal memuat detail komik', `showDetail('${slug}')`);
    }
    
    window.scrollTo(0,0);
}

async function readChapter(chSlug, comicSlug = null, push = true) {
    const targetComicSlug = comicSlug || currentComicSlug;
    
    if (push) updateURL(`/chapter/${chSlug}`);

    mainNav.classList.add('-translate-y-full');
    mobileNav.classList.add('translate-y-full');
    contentArea.innerHTML = `<div class="flex justify-center py-40"><div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div></div>`;
    
    try {
        const data = await fetchAPI(`${API_BASE}/chapter/${chSlug}`);
        
        if(!data || !data.data) {
            contentArea.innerHTML = `
                <div class="text-center py-40">
                    <h2 class="text-2xl font-bold text-amber-500 mb-4">Chapter Tidak Ditemukan</h2>
                    <p class="text-gray-400 mb-6">Chapter tidak dapat dimuat.</p>
                    <button onclick="${targetComicSlug ? `showDetail('${targetComicSlug}')` : 'showHome()'}" 
                            class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                        Kembali
                    </button>
                </div>
            `;
            return;
        }

        const res = data.data;
        const backAction = targetComicSlug ? `showDetail('${targetComicSlug}')` : `showHome()`;

        let dropdownHTML = '';
        if (currentChapterList && currentChapterList.length > 0) {
            dropdownHTML = `
                <select onchange="readChapter(this.value, '${targetComicSlug || ''}')" class="bg-black/80 text-white border border-white/20 rounded-lg text-xs p-2 mx-2 max-w-[150px]">
                    ${currentChapterList.map(ch => `<option value="${ch.slug}" ${ch.slug === chSlug ? 'selected' : ''}>${ch.title}</option>`).join('')}
                </select>
            `;
        } else {
            dropdownHTML = `<span class="text-xs font-bold px-4">Navigasi</span>`;
        }

        contentArea.innerHTML = `
            <div class="relative min-h-screen bg-black -mx-4 -mt-24">
                <div id="reader-top" class="reader-ui fixed top-0 w-full glass z-[60] p-4 flex justify-between items-center border-b border-white/10">
                    <div class="flex items-center gap-2">
                        <button onclick="${backAction}" class="p-2 hover:bg-white/10 rounded-full"><i class="fa fa-arrow-left"></i></button>
                        <h2 class="text-xs font-bold truncate text-amber-500 max-w-[150px] md:max-w-xs">${chSlug.replace(/-/g, ' ')}</h2>
                    </div>
                    <button onclick="toggleFullScreen()" class="p-2 hover:bg-white/10 rounded-full text-white/80">
                        <i class="fa fa-expand"></i>
                    </button>
                </div>
                
                <div class="flex flex-col items-center pt-20 pb-40" onclick="toggleReaderUI()">
                    ${res.images.map(img => `
                        <img src="${img}" 
                             class="max-w-full md:max-w-3xl mb-1"
                             loading="lazy"
                             onerror="this.src='https://via.placeholder.com/800x1200/1f2937/9ca3af?text=Gagal+Memuat'">
                    `).join('')}
                </div>
                
                <div id="reader-bottom" class="reader-ui fixed bottom-6 left-0 w-full z-[60] px-4 flex justify-center pointer-events-none">
                    <div class="glass p-3 rounded-2xl flex gap-2 items-center shadow-2xl border border-white/10 pointer-events-auto">
                        <button onclick="${res.navigation.prev ? `readChapter('${res.navigation.prev}', '${targetComicSlug || ''}')` : ''}" class="p-3 bg-white/10 rounded-xl ${!res.navigation.prev ? 'opacity-20' : 'hover:bg-amber-500 hover:text-black transition'}"><i class="fa fa-chevron-left"></i></button>
                        ${dropdownHTML}
                        <button onclick="${res.navigation.next ? `readChapter('${res.navigation.next}', '${targetComicSlug || ''}')` : ''}" class="p-3 amber-gradient text-black rounded-xl ${!res.navigation.next ? 'opacity-20' : 'hover:scale-105 transition'}"><i class="fa fa-chevron-right"></i></button>
                    </div>
                </div>
            </div>
        `;
        
        if(targetComicSlug) {
            saveHistory(targetComicSlug, null, null, chSlug, chSlug.replace(/-/g, ' '));
        }
        
        // Auto-hide UI setelah 3 detik
        setTimeout(() => {
            toggleReaderUI();
        }, 3000);
        
    } catch (error) {
        console.error('Error in readChapter:', error);
        contentArea.innerHTML = `
            <div class="text-center py-40">
                <h2 class="text-2xl font-bold text-amber-500 mb-4">Gagal Memuat Chapter</h2>
                <p class="text-gray-400 mb-6">Terjadi kesalahan saat memuat chapter.</p>
                <button onclick="${targetComicSlug ? `showDetail('${targetComicSlug}')` : 'showHome()'}" 
                        class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                    Kembali
                </button>
            </div>
        `;
    }
    
    window.scrollTo(0,0);
}

function toggleReaderUI() {
    const top = document.getElementById('reader-top');
    const bottom = document.getElementById('reader-bottom');
    if (top && bottom) {
        top.classList.toggle('ui-hidden-top');
        bottom.classList.toggle('ui-hidden-bottom');
    }
}

function handleSearch(e) { 
    if(e.key === 'Enter') applyAdvancedFilter(); 
}

function saveHistory(slug, title, image, chSlug, chTitle) {
    try {
        let history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
        let existing = history.find(h => h.slug === slug);
        
        const data = {
            slug,
            title: title || existing?.title,
            image: image || existing?.image,
            lastChapterSlug: chSlug || existing?.lastChapterSlug,
            lastChapterTitle: chTitle || existing?.lastChapterTitle,
            timestamp: Date.now()
        };
        
        history = history.filter(h => h.slug !== slug);
        history.unshift(data);
        
        if (history.length > 30) history.pop();
        
        localStorage.setItem('fmc_history', JSON.stringify(history));
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

function showHistory() {
    try {
        let history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
        
        if (history.length === 0) {
            contentArea.innerHTML = `<div class="text-center py-40 text-gray-500"><p>Belum ada riwayat baca.</p></div>`;
            return;
        }
        
        renderGrid({ data: history }, "Riwayat Baca", null);
    } catch (error) {
        console.error('Error in showHistory:', error);
        showError('Gagal memuat riwayat', 'showHistory()');
    }
}

function toggleBookmark(slug, title, image) {
    try {
        let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
        const idx = bookmarks.findIndex(b => b.slug === slug);
        
        if (idx > -1) {
            bookmarks.splice(idx, 1);
        } else {
            bookmarks.push({ 
                slug, 
                title, 
                image,
                timestamp: Date.now()
            });
        }
        
        localStorage.setItem('fmc_bookmarks', JSON.stringify(bookmarks));
        checkBookmarkStatus(slug);
    } catch (error) {
        console.error('Error toggling bookmark:', error);
    }
}

function checkBookmarkStatus(slug) {
    try {
        let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
        const btn = document.getElementById('btn-bookmark');
        
        if (btn && bookmarks.some(b => b.slug === slug)) {
            btn.innerHTML = `<i class="fa fa-check text-amber-500"></i> Tersimpan`;
            btn.classList.add('border-amber-500');
        } else if (btn) {
            btn.innerHTML = `<i class="fa fa-bookmark"></i> Simpan Koleksi`;
            btn.classList.remove('border-amber-500');
        }
    } catch (error) {
        console.error('Error checking bookmark:', error);
    }
}

function showBookmarks() {
    try {
        let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
        
        if (bookmarks.length === 0) {
            contentArea.innerHTML = `<div class="text-center py-40 text-gray-500"><p>Belum ada komik yang disimpan.</p></div>`;
            return;
        }
        
        renderGrid({ data: bookmarks }, "Koleksi Favorit", null);
    } catch (error) {
        console.error('Error in showBookmarks:', error);
        showError('Gagal memuat koleksi', 'showBookmarks()');
    }
}

// Handle browser navigation
window.addEventListener('popstate', () => {
    handleInitialLoad();
});

// Improved routing handler
function handleInitialLoad() {
    const path = window.location.pathname;
    
    resetNavs();
    
    if (path === '/404.html') return;

    if (path.startsWith('/series/')) {
        const parts = path.split('/');
        const slug = parts[2];
        if (slug) showDetail(slug, false);
        else showHome(false);
    } 
    else if (path.startsWith('/chapter/')) {
        const parts = path.split('/');
        const slug = parts[2];
        if (slug) readChapter(slug, null, false);
        else showHome(false);
    } 
    else if (path === '/ongoing') {
        showOngoing(1, false);
    }
    else if (path === '/completed') {
        showCompleted(1, false);
    }
    else {
        showHome(false);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadGenres();
    handleInitialLoad();
    
    // Setup progress bar
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.getElementById("progress-bar").style.width = scrolled + "%";
    });
});
