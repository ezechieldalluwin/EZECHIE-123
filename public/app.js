const state = {
    movies: [],
    featured: [],
    genres: [],
    activeGenre: 'All',
    searchQuery: '',
    sortBy: 'latest',
    heroIndex: 0,
    heroTimer: null,
    token: localStorage.getItem('cinestream_admin_token') || null,
    editingId: null
};

const els = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    bindEvents();
    document.getElementById('footer-year').textContent = new Date().getFullYear();
    init();
});

function cacheElements() {
    els.searchInput = document.getElementById('search-input');
    els.genrePills = document.getElementById('genre-pills');
    els.moviesGrid = document.getElementById('movies-grid');
    els.resultCount = document.getElementById('result-count');
    els.emptyState = document.getElementById('empty-state');
    els.sortSelect = document.getElementById('sort-select');
    els.heroBackdrop = document.getElementById('hero-backdrop');
    els.heroTitle = document.getElementById('hero-title');
    els.heroDesc = document.getElementById('hero-desc');
    els.heroQuality = document.getElementById('hero-quality');
    els.heroGenre = document.getElementById('hero-genre');
    els.heroRating = document.getElementById('hero-rating');
    els.heroYear = document.getElementById('hero-year');
    els.heroDuration = document.getElementById('hero-duration');
    els.heroViews = document.getElementById('hero-views');
    els.heroDots = document.getElementById('hero-dots');
    els.playerModal = document.getElementById('player-modal');
    els.playerTitle = document.getElementById('player-title');
    els.videoPlayer = document.getElementById('video-player');
    els.adminLoginModal = document.getElementById('admin-login-modal');
    els.adminModal = document.getElementById('admin-modal');
    els.loginForm = document.getElementById('login-form');
    els.loginError = document.getElementById('login-error');
    els.adminTableBody = document.getElementById('admin-table-body');
    els.movieFormWrap = document.getElementById('movie-form-wrap');
    els.movieForm = document.getElementById('movie-form');
    els.movieFormTitle = document.getElementById('movie-form-title');
    els.dbStatusLabel = document.getElementById('db-status-label');
    els.statTotal = document.getElementById('stat-total');
    els.statViews = document.getElementById('stat-views');
    els.statDownloads = document.getElementById('stat-downloads');
    els.statDb = document.getElementById('stat-db');
    els.toast = document.getElementById('toast');
}

function bindEvents() {
    els.searchInput.addEventListener('input', debounce(() => {
        state.searchQuery = els.searchInput.value.trim();
        loadMovies();
    }, 350));

    els.sortSelect.addEventListener('change', () => {
        state.sortBy = els.sortSelect.value;
        loadMovies();
    });

    document.getElementById('hero-watch-btn').addEventListener('click', () => {
        const m = state.featured[state.heroIndex];
        if (m) openPlayer(m);
    });

    document.getElementById('hero-download-btn').addEventListener('click', () => {
        const m = state.featured[state.heroIndex];
        if (m) triggerDownload(m);
    });

    document.getElementById('hero-prev').addEventListener('click', () => shiftHero(-1));
    document.getElementById('hero-next').addEventListener('click', () => shiftHero(1));

    document.getElementById('player-close').addEventListener('click', closePlayer);
    els.playerModal.addEventListener('click', (e) => {
        if (e.target === els.playerModal) closePlayer();
    });
    document.getElementById('player-download-btn').addEventListener('click', () => {
        if (state.playerMovie) triggerDownload(state.playerMovie);
    });

    document.getElementById('admin-btn').addEventListener('click', openAdmin);
    document.getElementById('admin-login-close').addEventListener('click', () => closeModal(els.adminLoginModal));
    els.adminLoginModal.addEventListener('click', (e) => {
        if (e.target === els.adminLoginModal) closeModal(els.adminLoginModal);
    });
    els.loginForm.addEventListener('submit', handleLogin);

    document.getElementById('admin-close').addEventListener('click', () => closeModal(els.adminModal));
    els.adminModal.addEventListener('click', (e) => {
        if (e.target === els.adminModal) closeModal(els.adminModal);
    });
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('add-movie-btn').addEventListener('click', () => showMovieForm(null));
    document.getElementById('form-cancel-btn').addEventListener('click', hideMovieForm);
    els.movieForm.addEventListener('submit', handleMovieSubmit);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePlayer();
            closeModal(els.adminLoginModal);
            closeModal(els.adminModal);
        }
    });
}

async function init() {
    await loadMovies();
    updateAuthUi();
}

async function loadMovies() {
    const params = new URLSearchParams();
    if (state.searchQuery) params.set('search', state.searchQuery);
    if (state.activeGenre && state.activeGenre !== 'All') params.set('genre', state.activeGenre);
    if (state.sortBy) params.set('sort', state.sortBy);

    showLoading();
    try {
        const res = await fetch(`/api/movies?${params.toString()}`);
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to load movies');

        state.movies = json.data || [];
        state.featured = state.movies.filter(m => m.is_featured) || [];
        if (state.featured.length === 0) state.featured = state.movies.slice(0, 4);

        updateGenres();
        renderHero();
        renderGrid();

        if (state.heroIndex >= state.featured.length) state.heroIndex = 0;
        els.dbStatusLabel.textContent = json.isFallbackMode ? 'JSON Mode' : 'MySQL';
        els.dbStatusLabel.style.color = json.isFallbackMode ? '#f5b301' : '#22c55e';
        els.resultCount.textContent = `${json.count} movie${json.count === 1 ? '' : 's'} found`;
    } catch (err) {
        console.error(err);
        els.moviesGrid.innerHTML = '';
        els.resultCount.textContent = 'Error loading movies';
        showToast(err.message, 'error');
    }
}

function updateGenres() {
    const genres = new Set(state.movies.map(m => m.genre).filter(Boolean));
    const all = ['All', ...genres];
    if (JSON.stringify(all) !== JSON.stringify(state.genres)) {
        state.genres = all;
        els.genrePills.innerHTML = all.map(g =>
            `<button class="genre-pill ${g === state.activeGenre ? 'active' : ''}" data-genre="${escapeAttr(g)}">${escapeHtml(g)}</button>`
        ).join('');
        els.genrePills.querySelectorAll('.genre-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                state.activeGenre = btn.dataset.genre;
                els.genrePills.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                loadMovies();
            });
        });
    }
}

function renderHero() {
    if (state.featured.length === 0) return;
    els.heroDots.innerHTML = state.featured.map((_, i) =>
        `<button class="hero-dot ${i === state.heroIndex ? 'active' : ''}" data-index="${i}"></button>`
    ).join('');
    els.heroDots.querySelectorAll('.hero-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            state.heroIndex = Number(dot.dataset.index);
            showHero();
        });
    });
    showHero();
    clearInterval(state.heroTimer);
    state.heroTimer = setInterval(() => shiftHero(1), 7000);
}

function showHero() {
    const m = state.featured[state.heroIndex];
    if (!m) return;
    els.heroBackdrop.style.backgroundImage = `url("${m.poster_url}")`;
    els.heroTitle.textContent = m.title;
    els.heroDesc.textContent = m.description || '';
    els.heroQuality.textContent = m.quality || 'HD';
    els.heroGenre.textContent = m.genre || 'Movie';
    els.heroRating.textContent = Number(m.rating).toFixed(1);
    els.heroYear.textContent = m.release_year;
    els.heroDuration.textContent = m.duration;
    els.heroViews.textContent = Number(m.views_count || 0).toLocaleString();
    els.heroDots.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === state.heroIndex));
}

function shiftHero(dir) {
    if (state.featured.length === 0) return;
    state.heroIndex = (state.heroIndex + dir + state.featured.length) % state.featured.length;
    showHero();
    clearInterval(state.heroTimer);
    state.heroTimer = setInterval(() => shiftHero(1), 7000);
}

function renderGrid() {
    els.moviesGrid.innerHTML = '';
    els.emptyState.hidden = state.movies.length > 0;

    if (state.movies.length === 0) return;

    state.movies.forEach(m => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <div class="movie-poster-wrap">
                <img class="movie-poster" src="${escapeAttr(m.poster_url)}" alt="${escapeAttr(m.title)}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1000&auto=format&fit=crop'">
                <span class="quality-badge">${escapeHtml(m.quality || 'HD')}</span>
                ${m.is_featured ? '<span class="feat-badge"><i class="fa-solid fa-star"></i> Featured</span>' : ''}
                <div class="movie-overlay">
                    <button class="overlay-btn watch" data-action="watch" data-id="${m.id}" title="Watch"><i class="fa-solid fa-play"></i></button>
                    <button class="overlay-btn download" data-action="download" data-id="${m.id}" title="Download"><i class="fa-solid fa-download"></i></button>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${escapeHtml(m.title)}</h3>
                <div class="movie-meta">
                    <span class="rating"><i class="fa-solid fa-star"></i> ${Number(m.rating).toFixed(1)}</span>
                    <span class="sep">|</span>
                    <span>${m.release_year}</span>
                    <span class="sep">|</span>
                    <span>${escapeHtml(m.duration || '')}</span>
                </div>
            </div>
        `;

        card.querySelector('.movie-poster-wrap').addEventListener('click', (e) => {
            const btn = e.target.closest('[data-action]');
            if (!btn) return;
            if (btn.dataset.action === 'watch') openPlayer(m);
            else triggerDownload(m);
        });

        els.moviesGrid.appendChild(card);
    });
}

function openPlayer(movie) {
    state.playerMovie = movie;
    els.playerTitle.textContent = movie.title;
    els.videoPlayer.src = `/api/movies/${movie.id}/stream`;
    els.playerModal.hidden = false;
}

function closePlayer() {
    els.videoPlayer.pause();
    els.videoPlayer.removeAttribute('src');
    els.videoPlayer.load();
    els.playerModal.hidden = true;
    state.playerMovie = null;
}

function triggerDownload(movie) {
    window.location.href = `/api/movies/${movie.id}/download`;
    showToast(`Download started: ${movie.title}`, 'success');
}

function showLoading() {
    els.moviesGrid.innerHTML = '<div class="loader-ring"></div>';
}

function openAdmin() {
    if (state.token) {
        openAdminDashboard();
    } else {
        els.loginError.hidden = true;
        els.loginForm.reset();
        els.adminLoginModal.hidden = false;
        setTimeout(() => document.getElementById('login-username').focus(), 100);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('login-submit-btn');
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';

    try {
        const res = await fetch('/api/auth/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Login failed');

        state.token = json.token;
        localStorage.setItem('cinestream_admin_token', json.token);
        closeModal(els.adminLoginModal);
        updateAuthUi();
        openAdminDashboard();
        showToast(`Welcome back, ${json.admin.username}!`, 'success');
    } catch (err) {
        els.loginError.textContent = err.message;
        els.loginError.hidden = false;
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';
    }
}

function handleLogout() {
    state.token = null;
    localStorage.removeItem('cinestream_admin_token');
    closeModal(els.adminModal);
    updateAuthUi();
    showToast('Logged out successfully', 'success');
}

function updateAuthUi() {
    const adminBtn = document.getElementById('admin-btn');
    adminBtn.innerHTML = state.token
        ? '<i class="fa-solid fa-gauge-high"></i><span class="btn-text">Dashboard</span>'
        : '<i class="fa-solid fa-user-shield"></i><span class="btn-text">Admin</span>';
}

function openAdminDashboard() {
    renderAdminStats();
    renderAdminTable();
    hideMovieForm();
    els.adminModal.hidden = false;
}

function renderAdminStats() {
    const total = state.movies.length;
    const views = state.movies.reduce((s, m) => s + Number(m.views_count || 0), 0);
    const downloads = state.movies.reduce((s, m) => s + Number(m.download_count || 0), 0);
    els.statTotal.textContent = total;
    els.statViews.textContent = views.toLocaleString();
    els.statDownloads.textContent = downloads.toLocaleString();
    els.statDb.textContent = els.dbStatusLabel.textContent;
}

function renderAdminTable() {
    els.adminTableBody.innerHTML = state.movies.map(m => `
        <tr>
            <td><img class="table-poster" src="${escapeAttr(m.poster_url)}" onerror="this.style.display='none'"></td>
            <td><strong>${escapeHtml(m.title)}</strong></td>
            <td>${escapeHtml(m.genre)}</td>
            <td><span class="movie-meta"><span class="rating"><i class="fa-solid fa-star"></i> ${Number(m.rating).toFixed(1)}</span></span></td>
            <td>${m.release_year}</td>
            <td>${escapeHtml(m.quality || 'HD')}</td>
            <td>${Number(m.views_count || 0).toLocaleString()}</td>
            <td>${Number(m.download_count || 0).toLocaleString()}</td>
            <td>
                <div class="table-actions">
                    <button class="icon-btn edit" data-edit="${m.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                    <button class="icon-btn delete" data-delete="${m.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    els.adminTableBody.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
            const m = state.movies.find(x => x.id === Number(btn.dataset.edit));
            if (m) showMovieForm(m);
        });
    });

    els.adminTableBody.querySelectorAll('[data-delete]').forEach(btn => {
        btn.addEventListener('click', async () => {
            const m = state.movies.find(x => x.id === Number(btn.dataset.delete));
            if (!m) return;
            if (!confirm(`Delete "${m.title}" permanently?`)) return;
            await deleteMovie(m.id);
        });
    });
}

function showMovieForm(movie) {
    state.editingId = movie ? movie.id : null;
    els.movieFormTitle.innerHTML = movie
        ? '<i class="fa-solid fa-pen"></i> Edit Movie'
        : '<i class="fa-solid fa-plus"></i> Publish New Movie';
    document.getElementById('form-submit-btn').innerHTML = movie
        ? '<i class="fa-solid fa-check"></i> Update Movie'
        : '<i class="fa-solid fa-check"></i> Save Movie';

    document.getElementById('mv-title').value = movie ? movie.title : '';
    document.getElementById('mv-genre').value = movie ? movie.genre : '';
    document.getElementById('mv-rating').value = movie ? movie.rating : '';
    document.getElementById('mv-year').value = movie ? movie.release_year : new Date().getFullYear();
    document.getElementById('mv-duration').value = movie ? movie.duration : '';
    document.getElementById('mv-quality').value = movie ? movie.quality : '1080p HD';
    document.getElementById('mv-poster-url').value = movie && movie.poster_url && !movie.poster_url.startsWith('/uploads/') ? movie.poster_url : '';
    document.getElementById('mv-video-url').value = movie && movie.video_url && !movie.video_url.startsWith('/uploads/') ? movie.video_url : '';
    document.getElementById('mv-description').value = movie ? movie.description : '';
    document.getElementById('mv-featured').checked = movie ? Boolean(movie.is_featured) : false;
    document.getElementById('mv-poster-file').value = '';
    document.getElementById('mv-video-file').value = '';

    els.movieFormWrap.hidden = false;
    els.movieFormWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideMovieForm() {
    els.movieFormWrap.hidden = true;
    state.editingId = null;
}

async function handleMovieSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('form-submit-btn');
    const isEdit = state.editingId !== null;

    if (!document.getElementById('mv-title').value.trim() || !document.getElementById('mv-genre').value.trim()) {
        showToast('Title and genre are required', 'error');
        return;
    }

    const posterUrl = document.getElementById('mv-poster-url').value.trim();
    const videoUrl = document.getElementById('mv-video-url').value.trim();
    const posterFile = document.getElementById('mv-poster-file').files[0];
    const videoFile = document.getElementById('mv-video-file').files[0];

    const payload = {
        title: document.getElementById('mv-title').value.trim(),
        genre: document.getElementById('mv-genre').value.trim(),
        rating: document.getElementById('mv-rating').value,
        release_year: document.getElementById('mv-year').value,
        duration: document.getElementById('mv-duration').value,
        quality: document.getElementById('mv-quality').value,
        description: document.getElementById('mv-description').value,
        is_featured: document.getElementById('mv-featured').checked,
        poster_url: posterUrl,
        video_url: videoUrl
    };

    let body = JSON.stringify(payload);
    let headers = { 'Content-Type': 'application/json' };

    if (!isEdit) {
        const formData = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
            if (v !== '' && v !== undefined && v !== null) formData.append(k, String(v));
        });
        if (posterFile) formData.append('poster_file', posterFile);
        if (videoFile) formData.append('video_file', videoFile);
        body = formData;
        headers = {};
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    try {
        const url = isEdit ? `/api/movies/${state.editingId}` : '/api/movies';
        const res = await fetch(url, {
            method: isEdit ? 'PUT' : 'POST',
            headers: { 'Authorization': `Bearer ${state.token}`, ...headers },
            body
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to save movie');

        showToast(json.message || 'Movie saved successfully!', 'success');
        hideMovieForm();
        await loadMovies();
        renderAdminStats();
        renderAdminTable();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = state.editingId
            ? '<i class="fa-solid fa-check"></i> Update Movie'
            : '<i class="fa-solid fa-check"></i> Save Movie';
    }
}

async function deleteMovie(id) {
    try {
        const res = await fetch(`/api/movies/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Failed to delete movie');

        showToast(json.message || 'Movie deleted successfully', 'success');
        await loadMovies();
        renderAdminStats();
        renderAdminTable();
    } catch (err) {
        console.error(err);
        showToast(err.message, 'error');
    }
}

function closeModal(modal) {
    modal.hidden = true;
}

function showToast(message, type = 'success') {
    els.toast.textContent = message;
    els.toast.className = `toast ${type}`;
    els.toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        els.toast.hidden = true;
    }, 3200);
}

function debounce(fn, wait) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
    };
}

function escapeHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function escapeAttr(str) {
    return escapeHtml(str);
}
