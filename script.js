/*
<!-- Woi Kontol Lu ngapain?, mau nyuri ya lu? udh ada Wai masih aja mau genjutsu webnya malu lah sama ortu lu -->
*/
const API_PROXY = "https://api.nekolabs.web.id/px?url=";
const API_BASE = "https://www.sankavollerei.com/comic/komikcast";
const contentArea = document.getElementById('content-area');
const filterPanel = document.getElementById('filter-panel');
const mainNav = document.getElementById('main-nav');
const mobileNav = document.getElementById('mobile-nav');
const progressBar = document.getElementById('progress-bar');
let currentChapterList = [];
let currentComicSlug = null;

// Event listener untuk progress bar
let isLoading = false;
let progressInterval;

document.addEventListener('readystatechange', () => {
  if (document.readyState === 'loading') {
    startProgress();
  } else if (document.readyState === 'complete') {
    stopProgress();
  }
});

function startProgress() {
  isLoading = true;
  let progress = 10;
  progressBar.style.width = `${progress}%`;
  
  progressInterval = setInterval(() => {
    if (!isLoading) {
      clearInterval(progressInterval);
      return;
    }
    progress += Math.random() * 15;
    if (progress > 90) progress = 90;
    progressBar.style.width = `${progress}%`;
  }, 200);
}

function stopProgress() {
  isLoading = false;
  clearInterval(progressInterval);
  progressBar.style.width = '100%';
  
  setTimeout(() => {
    progressBar.style.width = '0%';
  }, 300);
}

function getTypeClass(type) {
  if (!type) return 'type-default';
  const t = type.toLowerCase();
  if (t.includes('manga')) return 'type-manga';
  if (t.includes('manhwa')) return 'type-manhwa';
  if (t.includes('manhua')) return 'type-manhua';
  return 'type-default';
}

function redirectTo404() {
  updateURL('/404.html');
  contentArea.innerHTML = `
    <div class="text-center py-40">
      <h1 class="text-4xl font-bold text-amber-500 mb-4">404</h1>
      <p class="text-xl text-gray-400 mb-8">Halaman tidak ditemukan</p>
      <button onclick="showHome()" class="amber-gradient px-8 py-3 rounded-xl font-bold text-black hover:opacity-90 transition">
        Kembali ke Beranda
      </button>
    </div>
  `;
}

async function fetchAPI(url) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout 15 detik
    
    const response = await fetch(API_PROXY + encodeURIComponent(url), {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (data.success) {
      return data.result?.content || data.result || data;
    }
    return null;
  } catch (e) {
    console.error('API Error:', e);
    if (e.name === 'AbortError') {
      throw new Error('Request timeout. Koneksi lambat atau server tidak merespons.');
    }
    throw e;
  }
}

function toggleFilter() {
  filterPanel.classList.toggle('hidden');
  const genreSelect = document.getElementById('filter-genre');
  if (genreSelect.options.length <= 1 && !genreSelect.dataset.loaded) {
    loadGenres();
    genreSelect.dataset.loaded = 'true';
  }
}

function resetNavs() {
  mainNav.classList.remove('-translate-y-full');
  mobileNav.classList.remove('translate-y-full');
  filterPanel.classList.add('hidden');
}

function updateURL(path) {
  if (window.location.pathname !== path) {
    history.pushState({ path }, '', path);
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
    console.error('Error loading genres:', error);
  }
}

async function showHome(push = true) {
  stopProgress();
  if (push) updateURL('/');
  resetNavs();
  startProgress();
  
  contentArea.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p class="text-gray-400 text-lg">Memuat konten beranda...</p>
    </div>
  `;
  
  try {
    const data = await fetchAPI(`${API_BASE}/home`);
    if(!data || !data.data) {
      throw new Error('Data tidak tersedia');
    }
    
    contentArea.innerHTML = `
    <section class="mb-10">
      <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"><i class="fa fa-bolt text-amber-500"></i> Populer</h2>
      <div class="flex overflow-x-auto gap-4 hide-scroll pb-4">
        ${data.data.hotUpdates.map(item => `
        <div class="min-w-[160px] md:min-w-[200px] cursor-pointer card-hover relative" onclick="showDetail('${item.slug}')">
          <span class="type-badge ${getTypeClass(item.type)}">${item.type || 'Hot'}</span>
          <img src="${item.image}" class="h-60 md:h-72 w-full object-cover rounded-2xl shadow-xl" onerror="this.src='https://via.placeholder.com/200x300/1e1e2e/646464?text=No+Image'">
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
            <img src="${item.image}" class="h-44 w-full object-cover rounded-xl" onerror="this.src='https://via.placeholder.com/150x220/1e1e2e/646464?text=No+Image'">
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
            <img src="${item.image}" class="w-16 h-20 rounded-xl object-cover" onerror="this.src='https://via.placeholder.com/64x80/1e1e2e/646464?text=No+Image'">
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
  } catch (error) {
    console.error('Error loading home page:', error);
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="text-xl text-gray-400 mb-6">Gagal memuat halaman beranda</p>
        <p class="text-gray-500 mb-8">${error.message || 'Terjadi kesalahan saat memuat konten'}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button onclick="window.location.reload()" class="glass px-6 py-2 rounded-xl hover:bg-amber-500 hover:text-black transition">
            <i class="fa fa-redo mr-2"></i>Coba Lagi
          </button>
          <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
            <i class="fa fa-home mr-2"></i>Beranda
          </button>
        </div>
      </div>
    `;
  } finally {
    stopProgress();
  }
}

async function showOngoing(page = 1) {
  stopProgress();
  updateURL(`/ongoing?page=${page}`);
  resetNavs();
  startProgress();
  
  contentArea.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p class="text-gray-400 text-lg">Memuat komik ongoing...</p>
    </div>
  `;
  
  try {
    const data = await fetchAPI(`${API_BASE}/list?status=Ongoing&orderby=popular&page=${page}`);
    renderGrid(data, "Komik Ongoing Terpopuler", "showOngoing");
  } catch (error) {
    console.error('Error loading ongoing comics:', error);
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="text-xl text-gray-400 mb-6">Gagal memuat komik ongoing</p>
        <p class="text-gray-500 mb-8">${error.message || 'Terjadi kesalahan saat memuat konten'}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button onclick="window.location.reload()" class="glass px-6 py-2 rounded-xl hover:bg-amber-500 hover:text-black transition">
            <i class="fa fa-redo mr-2"></i>Coba Lagi
          </button>
          <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
            <i class="fa fa-home mr-2"></i>Beranda
          </button>
        </div>
      </div>
    `;
  } finally {
    stopProgress();
  }
}

async function showCompleted(page = 1) {
  stopProgress();
  updateURL(`/completed?page=${page}`);
  resetNavs();
  startProgress();
  
  contentArea.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p class="text-gray-400 text-lg">Memuat komik tamat...</p>
    </div>
  `;
  
  try {
    const data = await fetchAPI(`${API_BASE}/list?status=Completed&orderby=popular&page=${page}`);
    renderGrid(data, "Komik Tamat (Selesai)", "showCompleted");
  } catch (error) {
    console.error('Error loading completed comics:', error);
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="text-xl text-gray-400 mb-6">Gagal memuat komik tamat</p>
        <p class="text-gray-500 mb-8">${error.message || 'Terjadi kesalahan saat memuat konten'}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button onclick="window.location.reload()" class="glass px-6 py-2 rounded-xl hover:bg-amber-500 hover:text-black transition">
            <i class="fa fa-redo mr-2"></i>Coba Lagi
          </button>
          <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
            <i class="fa fa-home mr-2"></i>Beranda
          </button>
        </div>
      </div>
    `;
  } finally {
    stopProgress();
  }
}

async function showGenre(slug, page = 1) {
  stopProgress();
  updateURL(`/genre/${slug}?page=${page}`);
  resetNavs();
  startProgress();
  
  contentArea.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p class="text-gray-400 text-lg">Memuat genre: ${slug}...</p>
    </div>
  `;
  
  try {
    const data = await fetchAPI(`${API_BASE}/genre/${slug}/${page}`);
    if(!data || !data.data || data.data.length === 0) {
      throw new Error('Komik tidak ditemukan untuk genre ini');
    }
    renderGrid(data, `Genre: ${slug.replace(/-/g, ' ').toUpperCase()}`, "showGenre", slug);
  } catch (error) {
    console.error('Error loading genre comics:', error);
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="text-xl text-gray-400 mb-6">Gagal memuat genre komik</p>
        <p class="text-gray-500 mb-8">${error.message || 'Terjadi kesalahan saat memuat konten'}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
            <i class="fa fa-home mr-2"></i>Beranda
          </button>
        </div>
      </div>
    `;
  } finally {
    stopProgress();
  }
}

async function applyAdvancedFilter() {
  const query = document.getElementById('search-input').value.trim();
  const genre = document.getElementById('filter-genre').value;
  const type = document.getElementById('filter-type').value;
  const status = document.getElementById('filter-status').value;
  
  stopProgress();
  filterPanel.classList.add('hidden');
  startProgress();
  
  contentArea.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p class="text-gray-400 text-lg">Sedang mencari...</p>
    </div>
  `;
  
  try {
    if (query) {
      updateURL(`/search?q=${encodeURIComponent(query)}`);
      const data = await fetchAPI(`${API_BASE}/search/${encodeURIComponent(query)}/1`);
      renderGrid(data, `Hasil Pencarian: "${query}"`, null);
      return;
    }
    
    if (genre) {
      const genreElement = document.getElementById('filter-genre').selectedOptions[0];
      const genreTitle = genreElement ? genreElement.text : genre;
      updateURL(`/genre/${genre}`);
      const data = await fetchAPI(`${API_BASE}/genre/${genre}/1`);
      renderGrid(data, `Genre: ${genreTitle.toUpperCase()}`, "showGenre", genre);
      return;
    }
    
    let url = `${API_BASE}/list?page=1`;
    let title = "Hasil Filter";
    
    if (type) {
      url += `&type=${type}`;
      title += ` - ${type.toUpperCase()}`;
    }
    if (status) {
      url += `&status=${status}`;
      title += ` - ${status.toUpperCase()}`;
    }
    url += `&orderby=popular`;
    
    updateURL(`/filter?type=${type}&status=${status}`);
    const data = await fetchAPI(url);
    renderGrid(data, title, null);
  } catch (error) {
    console.error('Error applying filters:', error);
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="text-xl text-gray-400 mb-6">Gagal memuat hasil filter</p>
        <p class="text-gray-500 mb-8">${error.message || 'Terjadi kesalahan saat memuat konten'}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button onclick="window.location.reload()" class="glass px-6 py-2 rounded-xl hover:bg-amber-500 hover:text-black transition">
            <i class="fa fa-redo mr-2"></i>Coba Lagi
          </button>
          <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
            <i class="fa fa-home mr-2"></i>Beranda
          </button>
        </div>
      </div>
    `;
  } finally {
    stopProgress();
  }
}

function renderGrid(data, title, funcName, extraArg = null) {
  const list = data?.data || [];
  if(list.length === 0) {
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-search"></i></div>
        <p class="text-xl text-gray-400 mb-6">Tidak ada komik ditemukan</p>
        <p class="text-gray-500 mb-8">Coba gunakan filter atau pencarian lainnya</p>
        <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
          <i class="fa fa-home mr-2"></i>Kembali ke Beranda
        </button>
      </div>
    `;
    return;
  }
  
  let paginationHTML = '';
  if (data.pagination && funcName) {
    const current = data.pagination.currentPage || 1;
    const hasNext = data.pagination.hasNextPage || false;
    const argStr = extraArg ? `'${extraArg}', ` : '';
    paginationHTML = `
    <div class="mt-14 flex justify-center items-center gap-6">
      ${current > 1 ? `<button onclick="${funcName}(${argStr}${current - 1})" class="glass px-6 py-2 rounded-xl text-xs hover:bg-amber-500 hover:text-black transition"><i class="fa fa-arrow-left mr-1"></i> Sebelumnya</button>` : ''}
      <span class="bg-amber-500 text-black px-6 py-2 rounded-xl text-xs font-extrabold">Halaman ${current}</span>
      ${hasNext ? `<button onclick="${funcName}(${argStr}${current + 1})" class="glass px-6 py-2 rounded-xl text-xs hover:bg-amber-500 hover:text-black transition">Selanjutnya <i class="fa fa-arrow-right ml-1"></i></button>` : ''}
    </div>
    `;
  }
  
  contentArea.innerHTML = `
  <h2 class="text-2xl font-bold mb-8 border-l-4 border-amber-500 pl-4">${title}</h2>
  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
    ${list.map(item => `
    <div class="bg-zinc-900/40 rounded-2xl overflow-hidden border border-white/5 card-hover cursor-pointer relative group" onclick="showDetail('${item.slug}')">
      <span class="type-badge ${getTypeClass(item.type)}">${item.type || 'Comic'}</span>
      <img src="${item.image}" class="h-64 w-full object-cover" onerror="this.src='https://via.placeholder.com/200x300/1e1e2e/646464?text=No+Image'">
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
  stopProgress();
  if (push) updateURL(`/series/${slug}`);
  resetNavs();
  startProgress();
  currentComicSlug = slug;
  
  contentArea.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-[60vh] py-12">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p class="text-gray-400 text-lg">Memuat detail komik...</p>
    </div>
  `;
  
  try {
    const data = await fetchAPI(`${API_BASE}/detail/${slug}`);
    if(!data || !data.data) {
      throw new Error('Komik tidak ditemukan');
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
          <img src="${res.image}" class="w-full rounded-3xl shadow-2xl border border-white/10" onerror="this.src='https://via.placeholder.com/300x450/1e1e2e/646464?text=No+Image'">
        </div>
        <div class="flex flex-col gap-3 mt-6">
          <button onclick="${startBtnAction}" class="amber-gradient w-full py-4 rounded-2xl font-bold text-black flex items-center justify-center gap-2 active:scale-95 transition">
            <i class="fa fa-play"></i> ${startBtnText}
          </button>
          <button onclick="toggleBookmark('${slug}', '${res.title.replace(/'/g, "\\'")}', '${res.image}')" id="btn-bookmark"
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
          <h3 class="text-lg font-bold mb-4 flex justify-between items-center">
            Daftar Chapter
            <span class="text-xs bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full">${res.chapters.length} Chapter</span>
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-2 custom-scroll">
            ${res.chapters.map(ch => `
            <div onclick="readChapter('${ch.slug}', '${slug}')" class="bg-white/5 p-3 rounded-xl cursor-pointer hover:bg-amber-500 hover:text-black transition text-sm flex justify-between items-center">
              <span class="truncate">${ch.title}</span>
              <span class="text-[10px] bg-white/10 px-2 py-1 rounded">${ch.date}</span>
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
  } catch (error) {
    console.error('Error loading comic detail:', error);
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="text-xl text-gray-400 mb-6">Gagal memuat detail komik</p>
        <p class="text-gray-500 mb-8">${error.message || 'Terjadi kesalahan saat memuat konten'}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button onclick="window.location.reload()" class="glass px-6 py-2 rounded-xl hover:bg-amber-500 hover:text-black transition">
            <i class="fa fa-redo mr-2"></i>Coba Lagi
          </button>
          <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
            <i class="fa fa-home mr-2"></i>Beranda
          </button>
        </div>
      </div>
    `;
  } finally {
    stopProgress();
  }
}

async function readChapter(chSlug, comicSlug, push = true) {
  stopProgress();
  if (push) updateURL(`/chapter/${chSlug}`);
  
  // Simpan state penting ke localStorage
  if (comicSlug) {
    localStorage.setItem('currentComicSlug', comicSlug);
    currentComicSlug = comicSlug;
  }
  
  mainNav.classList.add('-translate-y-full');
  mobileNav.classList.add('translate-y-full');
  startProgress();
  
  contentArea.innerHTML = `
    <div class="flex flex-col items-center justify-center min-h-screen py-24">
      <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
      <p class="text-gray-400 text-lg">Memuat chapter...</p>
    </div>
  `;
  
  try {
    const data = await fetchAPI(`${API_BASE}/chapter/${chSlug}`);
    if (!data || !data.data) {
      throw new Error('Chapter tidak ditemukan');
    }
    
    const res = data.data;
    const backAction = comicSlug ? `showDetail('${comicSlug}')` : `showHome()`;
    
    // Jika comicSlug tidak tersedia tapi ada di localStorage
    if (!comicSlug) {
      comicSlug = localStorage.getItem('currentComicSlug') || currentComicSlug;
    }
    
    // Load chapter list jika belum ada atau kosong
    if (!currentChapterList || currentChapterList.length === 0) {
      if (comicSlug) {
        try {
          const detailData = await fetchAPI(`${API_BASE}/detail/${comicSlug}`);
          if (detailData?.data?.chapters) {
            currentChapterList = detailData.data.chapters;
          }
        } catch (e) {
          console.warn('Failed to load chapter list:', e);
        }
      }
    }
    
    let dropdownHTML = '';
    if (currentChapterList && currentChapterList.length > 0) {
      dropdownHTML = `
        <select onchange="readChapter(this.value, '${comicSlug}')" class="bg-black/80 text-white border border-white/20 rounded-lg text-xs p-2 mx-2 max-w-[150px]">
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
            <h2 class="text-xs font-bold truncate text-amber-500 max-w-[150px] md:max-w-xs">${res.chapterTitle || chSlug.replace(/-/g, ' ')}</h2>
          </div>
          <button onclick="toggleFullScreen()" class="p-2 hover:bg-white/10 rounded-full text-white/80">
            <i class="fa fa-expand"></i>
          </button>
        </div>
        <div class="flex flex-col items-center pt-20 pb-40" onclick="toggleReaderUI()">
          ${res.images.length > 0 
            ? res.images.map(img => `<img src="${img}" class="max-w-full md:max-w-3xl mb-1" loading="lazy" onerror="this.parentElement.removeChild(this)">`).join('') 
            : `<div class="text-center py-20 text-gray-500">Gambar chapter tidak tersedia.</div>`}
        </div>
        <div id="reader-bottom" class="reader-ui fixed bottom-6 left-0 w-full z-[60] px-4 flex justify-center pointer-events-none">
          <div class="glass p-3 rounded-2xl flex gap-2 items-center shadow-2xl border border-white/10 pointer-events-auto">
            <button onclick="${res.navigation.prev ? `readChapter('${res.navigation.prev}', '${comicSlug || ''}')` : 'return false'}" class="p-3 bg-white/10 rounded-xl ${!res.navigation.prev ? 'opacity-20 cursor-not-allowed' : 'hover:bg-amber-500 hover:text-black transition'}"><i class="fa fa-chevron-left"></i></button>
            ${dropdownHTML}
            <button onclick="${res.navigation.next ? `readChapter('${res.navigation.next}', '${comicSlug || ''}')` : 'return false'}" class="p-3 amber-gradient text-black rounded-xl ${!res.navigation.next ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105 transition'}"><i class="fa fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    `;
    
    if (comicSlug) {
      // Dapatkan judul chapter dari data jika tersedia
      const chapterTitle = res.chapterTitle || chSlug.replace(/-/g, ' ');
      saveHistory(comicSlug, null, null, chSlug, chapterTitle);
    }
    
    window.scrollTo(0, 0);
  } catch (error) {
    console.error('Error loading chapter:', error);
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-exclamation-triangle"></i></div>
        <p class="text-xl text-gray-400 mb-6">Gagal memuat chapter</p>
        <p class="text-gray-500 mb-8">${error.message || 'Terjadi kesalahan saat memuat konten'}</p>
        <div class="flex flex-col sm:flex-row justify-center gap-4">
          <button onclick="window.location.reload()" class="glass px-6 py-2 rounded-xl hover:bg-amber-500 hover:text-black transition">
            <i class="fa fa-redo mr-2"></i>Coba Lagi
          </button>
          <button onclick="${comicSlug ? `showDetail('${comicSlug}')` : 'showHome()'}" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
            <i class="fa ${comicSlug ? 'fa-arrow-left' : 'fa-home'} mr-2"></i>${comicSlug ? 'Kembali ke Komik' : 'Beranda'}
          </button>
        </div>
      </div>
    `;
  } finally {
    stopProgress();
  }
}

function toggleReaderUI() {
  document.getElementById('reader-top').classList.toggle('ui-hidden-top');
  document.getElementById('reader-bottom').classList.toggle('ui-hidden-bottom');
}

function handleSearch(e) { 
  if(e.key === 'Enter') applyAdvancedFilter(); 
}

function saveHistory(slug, title, image, chSlug, chTitle) {
  let history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
  let existing = history.find(h => h.slug === slug);
  const data = {
    slug,
    title: title || existing?.title || 'Komik Tanpa Judul',
    image: image || existing?.image || 'https://via.placeholder.com/150/1e1e2e/646464?text=No+Image',
    lastChapterSlug: chSlug || existing?.lastChapterSlug,
    lastChapterTitle: chTitle || existing?.lastChapterTitle || 'Chapter Terakhir'
  };
  history = history.filter(h => h.slug !== slug);
  history.unshift(data);
  if (history.length > 30) history.pop();
  localStorage.setItem('fmc_history', JSON.stringify(history));
}

function showHistory() {
  stopProgress();
  updateURL('/history');
  resetNavs();
  startProgress();
  
  let history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
  if (history.length === 0) {
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-history"></i></div>
        <p class="text-xl text-gray-400 mb-6">Belum ada riwayat baca</p>
        <p class="text-gray-500 mb-8">Mulai membaca komik untuk melihat riwayat di sini</p>
        <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
          <i class="fa fa-home mr-2"></i>Mulai Membaca
        </button>
      </div>
    `;
    stopProgress();
    return;
  }
  
  renderGrid({ data: history }, "Riwayat Baca", null);
  stopProgress();
}

function toggleBookmark(slug, title, image) {
  let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
  const idx = bookmarks.findIndex(b => b.slug === slug);
  if (idx > -1) {
    bookmarks.splice(idx, 1);
    alert(`"${title}" telah dihapus dari koleksi`);
  } else {
    bookmarks.push({ slug, title, image });
    alert(`"${title}" telah ditambahkan ke koleksi`);
  }
  localStorage.setItem('fmc_bookmarks', JSON.stringify(bookmarks));
  checkBookmarkStatus(slug);
}

function checkBookmarkStatus(slug) {
  let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
  const btn = document.getElementById('btn-bookmark');
  if (btn && bookmarks.some(b => b.slug === slug)) {
    btn.innerHTML = `<i class="fa fa-check text-amber-500"></i> Tersimpan`;
    btn.classList.add('border-amber-500');
  } else if (btn) {
    btn.innerHTML = `<i class="fa fa-bookmark"></i> Simpan Koleksi`;
    btn.classList.remove('border-amber-500');
  }
}

function showBookmarks() {
  stopProgress();
  updateURL('/bookmarks');
  resetNavs();
  startProgress();
  
  let bookmarks = JSON.parse(localStorage.getItem('fmc_bookmarks') || '[]');
  if (bookmarks.length === 0) {
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <div class="text-2xl text-amber-500 mb-4"><i class="fa fa-bookmark"></i></div>
        <p class="text-xl text-gray-400 mb-6">Belum ada koleksi favorit</p>
        <p class="text-gray-500 mb-8">Simpan komik favorit Anda untuk melihatnya di sini</p>
        <button onclick="showHome()" class="amber-gradient px-6 py-2 rounded-xl text-black font-bold hover:opacity-90 transition">
          <i class="fa fa-home mr-2"></i>Cari Komik
        </button>
      </div>
    `;
    stopProgress();
    return;
  }
  
  renderGrid({ data: bookmarks }, "Koleksi Favorit", null);
  stopProgress();
}

window.addEventListener('popstate', (event) => {
  handleInitialLoad();
});

document.addEventListener('click', function(e) {
  if (e.target.closest('.chapter-btn')) {
    const slug = e.target.closest('.chapter-btn').dataset.slug;
    const comicSlug = e.target.closest('.chapter-btn').dataset.comicSlug;
    readChapter(slug, comicSlug);
  }
});

function handleInitialLoad() {
  const path = window.location.pathname;
  resetNavs();
  
  // Handle 404
  if (path === '/404.html') {
    contentArea.innerHTML = `
      <div class="text-center py-40">
        <h1 class="text-4xl font-bold text-amber-500 mb-4">404</h1>
        <p class="text-xl text-gray-400 mb-8">Halaman tidak ditemukan</p>
        <button onclick="showHome()" class="amber-gradient px-8 py-3 rounded-xl font-bold text-black hover:opacity-90 transition">
          Kembali ke Beranda
        </button>
      </div>
    `;
    return;
  }

  try {
    if (path.startsWith('/series/') && path !== '/series/') {
      const slug = path.split('/series/')[1];
      if (slug) {
        showDetail(slug, false);
        return;
      }
    }
    
    if (path.startsWith('/chapter/') && path !== '/chapter/') {
      const slug = path.split('/chapter/')[1];
      if (slug) {
        // Coba ambil comic slug dari localStorage atau history
        let comicSlug = localStorage.getItem('currentComicSlug') || null;
        const history = JSON.parse(localStorage.getItem('fmc_history') || '[]');
        if (!comicSlug && history.length > 0) {
          comicSlug = history[0].slug;
        }
        readChapter(slug, comicSlug, false);
        return;
      }
    }
    
    if (path === '/ongoing') {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page')) || 1;
      showOngoing(page);
      return;
    }
    
    if (path === '/completed') {
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page')) || 1;
      showCompleted(page);
      return;
    }
    
    if (path === '/history') {
      showHistory();
      return;
    }
    
    if (path === '/bookmarks') {
      showBookmarks();
      return;
    }
    
    if (path.startsWith('/genre/')) {
      const slug = path.split('/genre/')[1].split('?')[0];
      const params = new URLSearchParams(window.location.search);
      const page = parseInt(params.get('page')) || 1;
      if (slug) {
        showGenre(slug, page);
        return;
      }
    }
    
    if (path.startsWith('/filter')) {
      const params = new URLSearchParams(window.location.search);
      document.getElementById('filter-type').value = params.get('type') || '';
      document.getElementById('filter-status').value = params.get('status') || '';
      applyAdvancedFilter();
      return;
    }
    
    if (path.startsWith('/search')) {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || '';
      if (q) {
        document.getElementById('search-input').value = q;
        applyAdvancedFilter();
        return;
      }
    }
    
    // Default ke halaman utama
    showHome(false);
  } catch (error) {
    console.error('Error handling initial load:', error);
    redirectTo404();
  }
}

// Function to handle back button in reader
function readerBack() {
  if (currentComicSlug) {
    showDetail(currentComicSlug, false);
  } else {
    showHome(false);
  }
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Escape key to exit fullscreen
  if (e.key === 'Escape' && document.fullscreenElement) {
    document.exitFullscreen();
  }
});

// Handle window load with progress
window.addEventListener('load', function() {
  stopProgress();
});

document.addEventListener('DOMContentLoaded', () => {
  // Preload genres if needed
  const genreSelect = document.getElementById('filter-genre');
  if (genreSelect && !genreSelect.dataset.loaded) {
    loadGenres().then(() => {
      genreSelect.dataset.loaded = 'true';
    });
  }
  
  // Handle initial load after DOM is ready
  setTimeout(handleInitialLoad, 100);
  
  // Add service worker for caching
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed:', error);
      });
  }
});

// Add beforeunload event to save current state
window.addEventListener('beforeunload', function() {
  if (currentComicSlug) {
    localStorage.setItem('lastComicSlug', currentComicSlug);
  }
  if (currentChapterList && currentChapterList.length > 0) {
    localStorage.setItem('lastChapterList', JSON.stringify(currentChapterList));
  }
});
