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
        <div class="error-container">
            <h2 class="text-3xl font-bold mb-4">😢 ${message}</h2>
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

async function fetchAPI(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
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
            
            console.error('API returned error:', data);
            
        } catch (e) {
            console.error(`Attempt ${i + 1} failed:`, e.message);
            if (i === retries - 1) {
                // Last attempt, try direct fetch without proxy
                try {
                    console.log('Trying direct fetch...');
                    const directResponse = await fetch(url);
                    return await directResponse.json();
                } catch (directError) {
                    console.error('Direct fetch also failed:', directError);
                    throw e;
                }
            }
            // Wait before retry (exponential backoff)
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
        <div class="loading-container">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mb-4"></div>
            <p class="text-gray-400">Memuat komik terbaru...</p>
        </div>
    `;
    
    try {
        const data = await fetchAPI(`${API_BASE}/home`);
        
        if(!data || !data.data) {
            showError('Gagal memuat data beranda', 'showHome()');
            return;
        }

        contentArea.innerHTML = `
            <section class="mb-12">
                <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
                    <i class="fa fa-bolt text-amber-500"></i> Komik Populer
                </h2>
                <div class="flex overflow-x-auto gap-6 hide-scroll pb-6 px-1">
                    ${data.data.hotUpdates.map(item => `
                        <div class="min-w-[180px] md:min-w-[220px] cursor-pointer card-hover relative group" onclick="showDetail('${item.slug}')">
                            <div class="relative overflow-hidden rounded-2xl">
                                <span class="type-badge ${getTypeClass(item.type)}">${item.type || 'Hot'}</span>
                                <img src="${item.image}" 
                                     class="h-64 md:h-80 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                     onerror="this.src='https://via.placeholder.com/300x400/1f2937/9ca3af?text=Cover'">
                                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            </div>
                            <div class="mt-4">
                                <h3 class="font-bold line-clamp-2 group-hover:text-amber-500 transition">${item.title}</h3>
                                <p class="text-amber-500 text-sm mt-1">${item.chapter || item.latestChapter || 'Ch.?'}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div class="lg:col-span-2">
                    <h2 class="text-2xl font-bold mb-6 border-l-4 border-amber-500 pl-4">Rilis Terbaru</h2>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        ${data.data.latestReleases.slice(0, 12).map(item => `
                            <div class="bg-white/5 border border-white/10 p-3 rounded-2xl cursor-pointer hover:border-amber-500/50 transition group" onclick="showDetail('${item.slug}')">
                                <div class="relative overflow-hidden rounded-xl mb-3">
                                    <img src="${item.image}" 
                                         class="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                         onerror="this.src='https://via.placeholder.com/200x300/1f2937/9ca3af?text=Cover'">
                                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                        <p class="text-[10px] text-amber-500 font-bold">${item.chapters[0]?.title || 'Ch.?'}</p>
                                    </div>
                                </div>
                                <h3 class="text-sm font-bold line-clamp-2 group-hover:text-amber-500 transition">${item.title}</h3>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h2 class="text-2xl font-bold mb-6 border-l-4 border-amber-500 pl-4">Proyek Terbaru</h2>
                    <div class="space-y-4">
                        ${data.data.projectUpdates?.map(item => `
                            <div class="flex gap-4 bg-white/5 p-3 rounded-2xl cursor-pointer hover:bg-white/10 transition group" onclick="showDetail('${item.slug}')">
                                <div class="flex-shrink-0">
                                    <img src="${item.image}" 
                                         class="w-20 h-28 rounded-xl object-cover group-hover:scale-105 transition-transform duration-300"
                                         onerror="this.src='https://via.placeholder.com/80x112/1f2937/9ca3af?text=Cover'">
                                </div>
                                <div class="flex-1 min-w-0">
                                    <h3 class="font-bold text-sm line-clamp-2 group-hover:text-amber-500 transition">${item.title}</h3>
                                    <p class="text-amber-500 text-xs mt-2">${item.chapters[0]?.title || 'Ch.?'}</p>
                                </div>
                            </div>
                        `).join('') || '<p class="text-gray-400 text-center py-8">Tidak ada data</p>'}
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error in showHome:', error);
        showError('Gagal memuat beranda', 'showHome()');
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showOngoing(page = 1) {
    updateURL('/ongoing');
    resetNavs();
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
            <p class="text-gray-400 mt-4">Memuat komik ongoing...</p>
        </div>
    `;
    
    try {
        const data = await fetchAPI(`${API_BASE}/list?status=Ongoing&orderby=popular&page=${page}`);
        renderGrid(data, "🔥 Komik Ongoing Terpopuler", "showOngoing");
    } catch (error) {
        console.error('Error in showOngoing:', error);
        showError('Gagal memuat komik ongoing', `showOngoing(${page})`);
    }
}

async function showCompleted(page = 1) {
    updateURL('/completed');
    resetNavs();
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
            <p class="text-gray-400 mt-4">Memuat komik tamat...</p>
        </div>
    `;
    
    try {
        const data = await fetchAPI(`${API_BASE}/list?status=Completed&orderby=popular&page=${page}`);
        renderGrid(data, "✅ Komik Tamat (Selesai)", "showCompleted");
    } catch (error) {
        console.error('Error in showCompleted:', error);
        showError('Gagal memuat komik tamat', `showCompleted(${page})`);
    }
}

async function showGenre(slug, page = 1) {
    resetNavs();
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
            <p class="text-gray-400 mt-4">Memuat genre ${slug}...</p>
        </div>
    `;
    
    try {
        const data = await fetchAPI(`${API_BASE}/genre/${slug}/${page}`);
        
        if(!data || !data.data || data.data.length === 0) {
            contentArea.innerHTML = `
                <div class="error-container">
                    <h2 class="text-2xl font-bold text-amber-500 mb-4">Genre Tidak Ditemukan</h2>
                    <p class="text-gray-400 mb-6">Genre "${slug}" tidak ditemukan atau tidak memiliki komik.</p>
                    <button onclick="showHome()" class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                        Kembali ke Beranda
                    </button>
                </div>
            `;
            return;
        }
        
        renderGrid(data, `🎭 Genre: ${slug.charAt(0).toUpperCase() + slug.slice(1)}`, "showGenre", slug);
    } catch (error) {
        console.error('Error in showGenre:', error);
        showError(`Gagal memuat genre ${slug}`, `showGenre('${slug}', ${page})`);
    }
}

async function applyAdvancedFilter() {
    const query = document.getElementById('search-input').value.trim();
    const genre = document.getElementById('filter-genre').value;
    const type = document.getElementById('filter-type').value;
    const status = document.getElementById('filter-status').value;

    filterPanel.classList.add('hidden');
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
            <p class="text-gray-400 mt-4">Mencari komik...</p>
        </div>
    `;
    
    try {
        if (query) {
            const data = await fetchAPI(`${API_BASE}/search/${encodeURIComponent(query)}/1`);
            renderGrid(data, `🔍 Hasil Pencarian: "${query}"`, null);
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
        renderGrid(data, "🎯 Hasil Filter", null);
    } catch (error) {
        console.error('Error in applyAdvancedFilter:', error);
        showError('Gagal menerapkan filter', 'applyAdvancedFilter()');
    }
}

function renderGrid(data, title, funcName, extraArg = null) {
    const list = data?.data || [];
    
    if(list.length === 0) {
        contentArea.innerHTML = `
            <div class="text-center py-20">
                <div class="text-amber-500 text-6xl mb-4">📚</div>
                <h2 class="text-2xl font-bold mb-2">${title}</h2>
                <p class="text-gray-400 mb-6">Komik tidak ditemukan.</p>
                <button onclick="showHome()" class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                    Kembali ke Beranda
                </button>
            </div>
        `;
        return;
    }

    let paginationHTML = '';
    if (data.pagination && funcName) {
        const current = data.pagination.currentPage || 1;
        const hasNext = data.pagination.hasNextPage;
        const argStr = extraArg ? `'${extraArg}', ` : '';

        paginationHTML = `
            <div class="mt-14 flex justify-center items-center gap-4">
                ${current > 1 ? `
                    <button onclick="${funcName}(${argStr}${current - 1})" 
                            class="glass px-5 py-2 rounded-xl text-sm hover:bg-amber-500 hover:text-black transition flex items-center gap-2">
                        <i class="fa fa-chevron-left"></i> Prev
                    </button>
                ` : ''}
                
                <span class="bg-amber-500/20 text-amber-500 px-4 py-2 rounded-xl text-sm font-bold">
                    Halaman ${current}
                </span>
                
                ${hasNext ? `
                    <button onclick="${funcName}(${argStr}${current + 1})" 
                            class="glass px-5 py-2 rounded-xl text-sm hover:bg-amber-500 hover:text-black transition flex items-center gap-2">
                        Next <i class="fa fa-chevron-right"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }

    contentArea.innerHTML = `
        <h2 class="text-2xl font-bold mb-8 border-l-4 border-amber-500 pl-4">${title}</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            ${list.map(item => `
                <div class="bg-white/5 rounded-2xl overflow-hidden border border-white/10 card-hover cursor-pointer relative group" onclick="showDetail('${item.slug}')">
                    <div class="relative overflow-hidden">
                        <span class="type-badge ${getTypeClass(item.type)}">${item.type || 'Comic'}</span>
                        <img src="${item.image}" 
                             class="h-56 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                             onerror="this.src='https://via.placeholder.com/300x400/1f2937/9ca3af?text=Cover'">
                        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    </div>
                    <div class="p-4">
                        <h3 class="text-sm font-bold line-clamp-2 group-hover:text-amber-500 transition h-10">${item.title}</h3>
                        <p class="text-amber-500 text-xs mt-2">${item.latestChapter || item.chapter || 'Baca'}</p>
                    </div>
                </div>
            `).join('')}
        </div>
        ${paginationHTML}
    `;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function showDetail(slug, push = true) {
    currentComicSlug = slug;
    
    if (push) updateURL(`/series/${slug}`);

    resetNavs(); 
    contentArea.innerHTML = `
        <div class="loading-container">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mb-4"></div>
            <p class="text-gray-400">Memuat detail komik...</p>
        </div>
    `;
    
    try {
        const data = await fetchAPI(`${API_BASE}/detail/${slug}`);
        
        if(!data || !data.data) {
            contentArea.innerHTML = `
                <div class="error-container">
                    <h2 class="text-3xl font-bold text-amber-500 mb-4">Komik Tidak Ditemukan</h2>
                    <p class="text-gray-400 mb-6">Komik dengan judul "${slug}" tidak ditemukan.</p>
                    <button onclick="showHome()" class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                        Kembali ke Beranda
                    </button>
                </div>
            `;
            return;
        }

        const res = data.data;
        currentChapterList = res.chapters || [];

        const history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
        const savedItem = history.find(h => h.slug === slug);
        
        const startBtnText = savedItem && savedItem.lastChapterTitle ? 
            `Lanjut: ${savedItem.lastChapterTitle}` : 
            "Baca Chapter Pertama";
            
        const startBtnAction = savedItem && savedItem.lastChapterSlug ? 
            `readChapter('${savedItem.lastChapterSlug}', '${slug}')` : 
            `readChapter('${currentChapterList[currentChapterList.length - 1]?.slug || ''}', '${slug}')`;

        const hasChapters = currentChapterList.length > 0;

        contentArea.innerHTML = `
            <div class="flex flex-col lg:flex-row gap-8">
                <div class="lg:w-1/3">
                    <div class="sticky top-24">
                        <div class="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                            <span class="type-badge ${getTypeClass(res.type)} scale-125 top-5 left-5">${res.type || 'Comic'}</span>
                            <img src="${res.image}" 
                                 class="w-full aspect-[3/4] object-cover"
                                 onerror="this.src='https://via.placeholder.com/400x600/1f2937/9ca3af?text=Cover'">
                        </div>
                        
                        <div class="mt-6 space-y-3">
                            <button onclick="${startBtnAction}" 
                                    ${!hasChapters ? 'disabled' : ''}
                                    class="amber-gradient w-full py-4 rounded-2xl font-bold text-black flex items-center justify-center gap-3 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                <i class="fa fa-play"></i> ${startBtnText}
                            </button>
                            
                            <button onclick="toggleBookmark('${slug}', '${res.title.replace(/'/g, "\\'")}', '${res.image}')" 
                                    id="btn-bookmark"
                                    class="w-full py-4 rounded-2xl glass font-bold border border-white/10 hover:bg-white/5 transition flex items-center justify-center gap-3">
                                <i class="fa fa-bookmark"></i> <span id="bookmark-text">Simpan Koleksi</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="lg:w-2/3">
                    <div class="flex flex-wrap gap-2 mb-6">
                        ${res.genres ? res.genres.map(g => `
                            <span class="bg-amber-500/10 text-amber-500 text-xs px-4 py-2 rounded-full font-bold uppercase border border-amber-500/20">
                                ${g.title}
                            </span>
                        `).join('') : ''}
                    </div>
                    
                    <h1 class="text-3xl md:text-4xl font-extrabold mb-4">${res.title}</h1>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div class="glass p-4 rounded-2xl border border-white/5">
                            <div class="text-gray-500 text-xs uppercase font-bold mb-1">Status</div>
                            <div class="text-green-400 font-bold">${res.status || 'Unknown'}</div>
                        </div>
                        <div class="glass p-4 rounded-2xl border border-white/5">
                            <div class="text-gray-500 text-xs uppercase font-bold mb-1">Rating</div>
                            <div class="text-amber-500 font-bold flex items-center gap-1">
                                <i class="fa fa-star"></i> ${res.rating || 'N/A'}
                            </div>
                        </div>
                        <div class="glass p-4 rounded-2xl border border-white/5">
                            <div class="text-gray-500 text-xs uppercase font-bold mb-1">Tipe</div>
                            <div class="text-white font-bold">${res.type || 'Comic'}</div>
                        </div>
                        <div class="glass p-4 rounded-2xl border border-white/5">
                            <div class="text-gray-500 text-xs uppercase font-bold mb-1">Total Chapter</div>
                            <div class="text-white font-bold">${currentChapterList.length}</div>
                        </div>
                    </div>

                    <div class="glass rounded-3xl p-6 border border-white/5 mb-8">
                        <h3 class="text-xl font-bold mb-4 flex items-center gap-2">
                            <i class="fa fa-file-text text-amber-500"></i> Sinopsis
                        </h3>
                        <p class="text-gray-300 leading-relaxed text-justify">
                            ${res.synopsis || "Sinopsis tidak tersedia."}
                        </p>
                    </div>

                    <div class="glass rounded-3xl p-6 border border-white/5">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-bold flex items-center gap-2">
                                <i class="fa fa-list text-amber-500"></i> Daftar Chapter
                            </h3>
                            <span class="text-amber-500 text-sm font-bold">
                                ${currentChapterList.length} Chapter
                            </span>
                        </div>
                        
                        ${hasChapters ? `
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-3 custom-scroll">
                                ${currentChapterList.map((ch, index) => `
                                    <div onclick="readChapter('${ch.slug}', '${slug}')" 
                                         class="bg-white/5 p-4 rounded-xl cursor-pointer hover:bg-amber-500 hover:text-black transition flex justify-between items-center group">
                                        <div class="flex-1 min-w-0">
                                            <div class="font-bold text-sm line-clamp-1">${ch.title}</div>
                                            <div class="text-xs text-gray-400 group-hover:text-black mt-1">
                                                Chapter ${currentChapterList.length - index}
                                            </div>
                                        </div>
                                        <i class="fa fa-chevron-right text-gray-400 group-hover:text-black ml-2"></i>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="text-center py-12">
                                <div class="text-amber-500 text-4xl mb-4">📖</div>
                                <p class="text-gray-400">Belum ada chapter yang tersedia.</p>
                            </div>
                        `}
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
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function readChapter(chSlug, comicSlug = null, push = true) {
    const targetComicSlug = comicSlug || currentComicSlug;
    
    if (push) updateURL(`/chapter/${chSlug}`);

    mainNav.classList.add('-translate-y-full');
    mobileNav.classList.add('translate-y-full');
    
    contentArea.innerHTML = `
        <div class="loading-container min-h-screen">
            <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-amber-500 mb-4"></div>
            <p class="text-gray-400">Memuat chapter...</p>
        </div>
    `;
    
    try {
        const data = await fetchAPI(`${API_BASE}/chapter/${chSlug}`);
        
        if(!data || !data.data) {
            contentArea.innerHTML = `
                <div class="min-h-screen flex items-center justify-center px-4">
                    <div class="error-container">
                        <h2 class="text-3xl font-bold text-amber-500 mb-4">Chapter Tidak Ditemukan</h2>
                        <p class="text-gray-400 mb-6">Chapter tidak dapat dimuat. Mungkin telah dihapus atau terjadi kesalahan.</p>
                        <button onclick="${targetComicSlug ? `showDetail('${targetComicSlug}')` : 'showHome()'}" 
                                class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                            Kembali
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        const res = data.data;
        const backAction = targetComicSlug ? `showDetail('${targetComicSlug}')` : `showHome()`;

        let dropdownHTML = '';
        if (currentChapterList && currentChapterList.length > 0) {
            dropdownHTML = `
                <select onchange="readChapter(this.value, '${targetComicSlug || ''}')" 
                        class="bg-black/80 text-white border border-white/20 rounded-xl px-4 py-2 focus:outline-none focus:border-amber-500 text-sm min-w-[200px]">
                    ${currentChapterList.map(ch => `
                        <option value="${ch.slug}" ${ch.slug === chSlug ? 'selected' : ''}>
                            ${ch.title}
                        </option>
                    `).join('')}
                </select>
            `;
        }

        contentArea.innerHTML = `
            <div class="relative min-h-screen bg-black -mx-4 -mt-24">
                <div id="reader-top" class="reader-ui fixed top-0 w-full glass z-[60] p-4 flex justify-between items-center border-b border-white/10">
                    <div class="flex items-center gap-3">
                        <button onclick="${backAction}" 
                                class="p-2 hover:bg-white/10 rounded-xl transition flex items-center gap-2">
                            <i class="fa fa-arrow-left"></i>
                            <span class="hidden sm:inline text-sm">Kembali</span>
                        </button>
                        <h2 class="text-sm font-bold truncate text-amber-500 max-w-[200px] sm:max-w-md">
                            ${res.title || chSlug.replace(/-/g, ' ')}
                        </h2>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="toggleFullScreen()" 
                                class="p-2 hover:bg-white/10 rounded-xl transition"
                                title="Fullscreen">
                            <i class="fa fa-expand"></i>
                        </button>
                    </div>
                </div>
                
                <div class="flex flex-col items-center pt-20 pb-40" onclick="toggleReaderUI()">
                    ${res.images && res.images.length > 0 ? res.images.map(img => `
                        <img src="${img}" 
                             class="max-w-full md:max-w-3xl mb-1 loading-pulse"
                             loading="lazy"
                             onerror="this.style.display='none'">
                    `).join('') : `
                        <div class="text-center py-40">
                            <div class="text-amber-500 text-6xl mb-4">🖼️</div>
                            <h3 class="text-xl font-bold mb-2">Gambar Tidak Tersedia</h3>
                            <p class="text-gray-400">Chapter ini tidak memiliki gambar atau gagal dimuat.</p>
                        </div>
                    `}
                </div>
                
                <div id="reader-bottom" class="reader-ui fixed bottom-6 left-0 w-full z-[60] px-4 flex justify-center pointer-events-none">
                    <div class="glass p-4 rounded-2xl flex gap-4 items-center shadow-2xl border border-white/10 pointer-events-auto">
                        <button onclick="${res.navigation?.prev ? `readChapter('${res.navigation.prev}', '${targetComicSlug || ''}')` : ''}" 
                                class="p-3 bg-white/10 rounded-xl ${!res.navigation?.prev ? 'opacity-30 cursor-not-allowed' : 'hover:bg-amber-500 hover:text-black transition'}"
                                ${!res.navigation?.prev ? 'disabled' : ''}>
                            <i class="fa fa-chevron-left"></i>
                        </button>
                        
                        ${dropdownHTML || `
                            <div class="px-4">
                                <span class="text-sm font-bold">Chapter ${res.title || ''}</span>
                            </div>
                        `}
                        
                        <button onclick="${res.navigation?.next ? `readChapter('${res.navigation.next}', '${targetComicSlug || ''}')` : ''}" 
                                class="p-3 amber-gradient text-black rounded-xl ${!res.navigation?.next ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-90 transition'}"
                                ${!res.navigation?.next ? 'disabled' : ''}>
                            <i class="fa fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if(targetComicSlug) {
            saveHistory(targetComicSlug, null, null, chSlug, res.title || chSlug.replace(/-/g, ' '));
        }
        
        // Auto-hide UI after 3 seconds
        setTimeout(() => {
            toggleReaderUI();
        }, 3000);
        
    } catch (error) {
        console.error('Error in readChapter:', error);
        contentArea.innerHTML = `
            <div class="min-h-screen flex items-center justify-center px-4">
                <div class="error-container">
                    <h2 class="text-3xl font-bold text-amber-500 mb-4">Gagal Memuat Chapter</h2>
                    <p class="text-gray-400 mb-6">Terjadi kesalahan saat memuat chapter.</p>
                    <button onclick="${targetComicSlug ? `showDetail('${targetComicSlug}')` : 'showHome()'}" 
                            class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                        Kembali
                    </button>
                </div>
            </div>
        `;
    }
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
            title: title || existing?.title || '',
            image: image || existing?.image || '',
            lastChapterSlug: chSlug || existing?.lastChapterSlug || '',
            lastChapterTitle: chTitle || existing?.lastChapterTitle || '',
            timestamp: Date.now()
        };
        
        history = history.filter(h => h.slug !== slug);
        history.unshift(data);
        
        if (history.length > 50) history.pop();
        
        localStorage.setItem('fmc_history', JSON.stringify(history));
    } catch (error) {
        console.error('Error saving history:', error);
    }
}

function showHistory() {
    try {
        let history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
        
        if (history.length === 0) {
            contentArea.innerHTML = `
                <div class="text-center py-20">
                    <div class="text-amber-500 text-6xl mb-4">📖</div>
                    <h2 class="text-2xl font-bold mb-2">Riwayat Baca</h2>
                    <p class="text-gray-400 mb-6">Belum ada riwayat baca.</p>
                    <button onclick="showHome()" class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                        Jelajahi Komik
                    </button>
                </div>
            `;
            return;
        }
        
        renderGrid({ data: history }, "📚 Riwayat Baca Terbaru", null);
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
        
        // Show notification
        const isBookmarked = idx === -1;
        showNotification(isBookmarked ? '✅ Ditambahkan ke favorit' : '❌ Dihapus dari favorit');
    } catch (error) {
        console.error('Error toggling bookmark:', error);
    }
}

function checkBookmarkStatus(slug) {
    try {
        let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
        const btn = document.getElementById('btn-bookmark');
        const text = document.getElementById('bookmark-text');
        
        if (btn && bookmarks.some(b => b.slug === slug)) {
            btn.innerHTML = `<i class="fa fa-check text-amber-500"></i> <span id="bookmark-text">Tersimpan</span>`;
            btn.classList.add('border-amber-500');
        } else if (btn) {
            btn.innerHTML = `<i class="fa fa-bookmark"></i> <span id="bookmark-text">Simpan Koleksi</span>`;
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
            contentArea.innerHTML = `
                <div class="text-center py-20">
                    <div class="text-amber-500 text-6xl mb-4">⭐</div>
                    <h2 class="text-2xl font-bold mb-2">Koleksi Favorit</h2>
                    <p class="text-gray-400 mb-6">Belum ada komik yang disimpan.</p>
                    <button onclick="showHome()" class="amber-gradient px-6 py-3 rounded-xl font-bold text-black">
                        Jelajahi Komik
                    </button>
                </div>
            `;
            return;
        }
        
        renderGrid({ data: bookmarks }, "⭐ Koleksi Favorit", null);
    } catch (error) {
        console.error('Error in showBookmarks:', error);
        showError('Gagal memuat koleksi', 'showBookmarks()');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-24 right-4 glass border border-amber-500/20 px-6 py-3 rounded-xl z-[100] animate-slide-in';
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-amber-500">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS for notification animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
        animation: slide-in 0.3s ease-out;
    }
`;
document.head.appendChild(style);

// Handle browser navigation (back/forward)
window.addEventListener('popstate', () => {
    handleInitialLoad();
});

// Improved routing handler
function handleInitialLoad() {
    const path = window.location.pathname;
    console.log('Loading path:', path);
    
    resetNavs();
    
    // Check if it's a direct link access
    const isDirectAccess = !sessionStorage.getItem('hasLoaded');
    
    if (isDirectAccess) {
        contentArea.innerHTML = `
            <div class="loading-container">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500"></div>
                <p class="text-gray-400 mt-4">Memuat aplikasi...</p>
            </div>
        `;
        sessionStorage.setItem('hasLoaded', 'true');
    }
    
    // Handle different routes
    if (path === '/404.html') {
        // Already on 404 page
        return;
    }
    
    if (path.startsWith('/series/')) {
        const slug = path.split('/series/')[1];
        if (slug && slug.trim() !== '') {
            showDetail(slug, false);
            return;
        }
    }
    
    if (path.startsWith('/chapter/')) {
        const slug = path.split('/chapter/')[1];
        if (slug && slug.trim() !== '') {
            readChapter(slug, null, false);
            return;
        }
    }
    
    if (path.startsWith('/ongoing')) {
        const match = path.match(/\/ongoing(?:\/(\d+))?/);
        const page = match && match[1] ? parseInt(match[1]) : 1;
        showOngoing(page, false);
        return;
    }
    
    if (path.startsWith('/completed')) {
        const match = path.match(/\/completed(?:\/(\d+))?/);
        const page = match && match[1] ? parseInt(match[1]) : 1;
        showCompleted(page, false);
        return;
    }
    
    // Default to home
    showHome(false);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Load genres
    loadGenres();
    
    // Handle initial load
    setTimeout(() => {
        handleInitialLoad();
    }, 100);
    
    // Setup progress bar
    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.getElementById("progress-bar").style.width = scrolled + "%";
    });
});
