// ========== CONFIGURATION ==========
const ADMIN_PASSWORD = 'admin123'; // GANTI PASSWORD INI!
const STORAGE_KEY = 'galleryData_v2';

// ========== DATA ==========
let imageData = [];
let currentData = [];
let currentSort = 'newest';
let selectedCardId = null;
let isAdminLoggedIn = false;

// Default data
const defaultData = [
    {
        id: 1,
        title: "Outfit Casual Streetwear",
        image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
        date: "2024-03-15",
        prompt: "Streetwear fashion photography, model wearing oversized hoodie and cargo pants, urban background, golden hour lighting, candid pose, high quality, detailed fabric texture, 8k, photorealistic",
        model: "Midjourney v6",
        ratio: "3:4",
        hasReference: false,
        views: 0
    },
    {
        id: 2,
        title: "Outfit Olde Money Elegant",
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80",
        date: "2024-03-14",
        prompt: "Old money aesthetic, elegant tweed blazer with pearl accessories, country club setting, soft natural lighting, vintage film look, sophisticated pose, timeless fashion, vogue editorial style",
        model: "DALL-E 3",
        ratio: "4:5",
        hasReference: true,
        references: [
            {url: "https://images.unsplash.com/photo-1594938298603-c8148c4729d7?w=400&q=80", name: "fabric_ref.jpg"}
        ],
        views: 0
    }
];

// ========== INITIALIZATION ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded'); // Debug
    loadData();
    setupEventListeners();
    setupCheckboxListener();
});

function setupEventListeners() {
    setupSearch();
    setupTouchEvents();
}

function setupCheckboxListener() {
    const checkbox = document.getElementById('newHasRef');
    const refInputs = document.getElementById('refInputs');
    if (checkbox && refInputs) {
        checkbox.addEventListener('change', (e) => {
            refInputs.classList.toggle('hidden', !e.target.checked);
        });
    }
}

// ========== DATA MANAGEMENT ==========
function loadData() {
    console.log('Loading data...'); // Debug
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            imageData = parsed.images || parsed;
            imageData.forEach(item => {
                if (typeof item.views === 'undefined') item.views = 0;
            });
            console.log('Loaded from localStorage:', imageData.length, 'items');
        } catch (e) {
            console.error('Error parsing localStorage:', e);
            imageData = [...defaultData];
        }
    } else {
        console.log('No saved data, using default');
        imageData = [...defaultData];
    }
    
    currentData = [...imageData];
    sortImages();
    checkAdminSession();
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({images: imageData}));
    console.log('Data saved');
}

// ========== ADMIN AUTHENTICATION ==========
function checkAdminSession() {
    const session = sessionStorage.getItem('adminSession');
    if (session === 'active') {
        isAdminLoggedIn = true;
        console.log('Admin session active');
    }
}

function openAdminLogin() {
    const login = document.getElementById('adminLogin');
    if (login) {
        login.classList.add('active');
        setTimeout(() => {
            const pass = document.getElementById('adminPass');
            if (pass) pass.focus();
        }, 100);
    }
}

function closeAdminLogin() {
    const login = document.getElementById('adminLogin');
    const pass = document.getElementById('adminPass');
    if (login) login.classList.remove('active');
    if (pass) pass.value = '';
}

function checkPassword() {
    const input = document.getElementById('adminPass')?.value;
    if (input === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        sessionStorage.setItem('adminSession', 'active');
        closeAdminLogin();
        toggleAdmin();
        showToast('Login berhasil!');
    } else {
        showToast('Password salah!');
        const pass = document.getElementById('adminPass');
        if (pass) {
            pass.style.borderColor = '#ef4444';
            setTimeout(() => pass.style.borderColor = '#e5e7eb', 1000);
        }
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    sessionStorage.removeItem('adminSession');
    toggleAdmin();
    showToast('Logged out');
}

// ========== ADMIN PANEL ==========
function toggleAdmin() {
    const panel = document.getElementById('adminPanel');
    if (!panel) return;
    
    const isVisible = panel.classList.contains('active');
    
    if (!isVisible) {
        if (!isAdminLoggedIn) {
            openAdminLogin();
            return;
        }
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
        updateStats();
        showSection('add');
    } else {
        panel.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(el => {
        el.classList.add('hidden');
    });
    
    const target = document.getElementById(`section-${sectionName}`);
    if (target) {
        target.classList.remove('hidden');
    }
    
    if (sectionName === 'manage') {
        renderAdminList();
    }
}

function updateStats() {
    const totalEl = document.getElementById('totalImages');
    const viewsEl = document.getElementById('totalViews');
    const storageEl = document.getElementById('storageUsed');
    
    if (totalEl) totalEl.textContent = imageData.length;
    
    const totalViews = imageData.reduce((sum, item) => sum + (item.views || 0), 0);
    if (viewsEl) viewsEl.textContent = totalViews;
    
    const dataSize = new Blob([JSON.stringify(imageData)]).size;
    const sizeKB = (dataSize / 1024).toFixed(1);
    if (storageEl) storageEl.textContent = `${sizeKB} KB`;
}

// ========== CONTENT MANAGEMENT ==========
function addNewImage(e) {
    e.preventDefault();
    
    const refsInput = document.getElementById('newRefs')?.value || '';
    const refs = refsInput.split(',').map(url => url.trim()).filter(url => url).map((url, idx) => ({
        url: url,
        name: `reference_${idx + 1}.jpg`
    }));
    
    const newImage = {
        id: Date.now(),
        title: document.getElementById('newTitle')?.value || 'Untitled',
        image: document.getElementById('newImage')?.value || '',
        date: new Date().toISOString().split('T')[0],
        prompt: document.getElementById('newPrompt')?.value || '',
        model: document.getElementById('newModel')?.value || 'Midjourney v6',
        ratio: document.getElementById('newRatio')?.value || '3:4',
        hasReference: document.getElementById('newHasRef')?.checked && refs.length > 0,
        references: refs,
        views: 0
    };
    
    imageData.unshift(newImage);
    saveData();
    
    const form = document.getElementById('addForm');
    if (form) form.reset();
    
    const refInputs = document.getElementById('refInputs');
    if (refInputs) refInputs.classList.add('hidden');
    
    currentData = [...imageData];
    sortImages();
    updateStats();
    
    showToast('✓ Gambar berhasil dipublish!');
    setTimeout(() => showSection('manage'), 500);
}

function deleteImage(id) {
    const item = imageData.find(i => i.id === id);
    if (!item) return;
    
    if (confirm(`Hapus "${item.title}"?`)) {
        imageData = imageData.filter(i => i.id !== id);
        saveData();
        currentData = [...imageData];
        sortImages();
        updateStats();
        renderAdminList();
        showToast('Gambar dihapus');
    }
}

function editImage(id) {
    const item = imageData.find(i => i.id === id);
    if (!item) return;
    
    const newTitle = prompt('Edit judul:', item.title);
    if (newTitle && newTitle !== item.title) {
        item.title = newTitle;
        saveData();
        currentData = [...imageData];
        sortImages();
        renderAdminList();
        showToast('Judul diperbarui');
    }
}

// PERBAIKAN: Tambahkan fungsi moveUp dan moveDown
function moveUp(id) {
    moveImage(id, 'up');
}

function moveDown(id) {
    moveImage(id, 'down');
}

function moveImage(id, direction) {
    const idx = imageData.findIndex(i => i.id === id);
    if (idx === -1) return;
    
    if (direction === 'up' && idx > 0) {
        [imageData[idx], imageData[idx - 1]] = [imageData[idx - 1], imageData[idx]];
    } else if (direction === 'down' && idx < imageData.length - 1) {
        [imageData[idx], imageData[idx + 1]] = [imageData[idx + 1], imageData[idx]];
    }
    
    saveData();
    currentData = [...imageData];
    sortImages();
    renderAdminList();
}

function renderAdminList() {
    const list = document.getElementById('adminList');
    if (!list) return;
    
    list.innerHTML = imageData.map((item, index) => `
        <div class="content-item">
            <img src="${item.image}" onerror="this.src='https://via.placeholder.com/60'" alt="">
            <div class="content-info">
                <div class="content-title">${item.title}</div>
                <div class="content-meta">
                    <span>${item.model}</span>
                    <span>•</span>
                    <span>${formatDate(item.date)}</span>
                    <span>•</span>
                    <span>${item.views || 0} views</span>
                </div>
            </div>
            <div class="content-actions">
                <button class="content-btn move" onclick="moveUp(${item.id})" title="Naik" ${index === 0 ? 'disabled style="opacity:0.3"' : ''}>↑</button>
                <button class="content-btn edit" onclick="editImage(${item.id})" title="Edit">✎</button>
                <button class="content-btn delete" onclick="deleteImage(${item.id})" title="Hapus">🗑</button>
            </div>
        </div>
    `).join('');
}

// ========== BACKUP & SETTINGS ==========
function exportData() {
    const dataStr = JSON.stringify({images: imageData, exportedAt: new Date().toISOString()}, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gallery-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Data diexport!');
}

function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            const images = data.images || data;
            if (Array.isArray(images)) {
                if (confirm(`Import ${images.length} gambar? Data saat ini akan ditimpa.`)) {
                    imageData = images;
                    saveData();
                    currentData = [...imageData];
                    sortImages();
                    updateStats();
                    renderAdminList();
                    showToast('Import berhasil!');
                }
            } else {
                alert('Format file tidak valid!');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function resetData() {
    if (confirm('Yakin reset semua data? Ini tidak bisa dibatalkan!')) {
        if (confirm('Data akan kembali ke default. Lanjutkan?')) {
            imageData = [...defaultData];
            saveData();
            currentData = [...imageData];
            sortImages();
            updateStats();
            renderAdminList();
            showToast('Data direset');
        }
    }
}

function changePassword() {
    const current = prompt('Password saat ini:');
    if (current !== ADMIN_PASSWORD) {
        alert('Password salah!');
        return;
    }
    
    const newPass = prompt('Password baru (min 6 karakter):');
    if (!newPass || newPass.length < 6) {
        alert('Password terlalu pendek!');
        return;
    }
    
    const confirmPass = prompt('Konfirmasi password baru:');
    if (newPass !== confirmPass) {
        alert('Password tidak cocok!');
        return;
    }
    
    alert('Password berhasil diubah! Update manual di kode untuk permanen.');
}

function clearCache() {
    if (confirm('Clear cache browser?')) {
        showToast('Cache diclear');
    }
}

function toggleAutoBackup(checkbox) {
    localStorage.setItem('autoBackup', checkbox.checked ? 'enabled' : 'disabled');
    showToast(checkbox.checked ? 'Auto backup ON' : 'Auto backup OFF');
}

// ========== UI FUNCTIONS ==========
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    const hamburger = document.getElementById('hamburgerBtn');
    
    if (!menu || !overlay || !hamburger) return;
    
    const isOpen = menu.classList.contains('active');
    
    if (isOpen) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        hamburger.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        menu.classList.add('active');
        overlay.classList.add('active');
        hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function goHome() {
    window.scrollTo({top: 0, behavior: 'smooth'});
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu && sideMenu.classList.contains('active')) {
        toggleMenu();
    }
    setTimeout(() => location.reload(), 300);
}

function openPortfolio() {
    toggleMenu();
    const modal = document.getElementById('portfolioModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closePortfolio() {
    const modal = document.getElementById('portfolioModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        
        if (term.length > 0) {
            if (clearBtn) clearBtn.classList.remove('hidden');
            const filtered = imageData.filter(item => 
                item.title.toLowerCase().includes(term)
            );
            currentData = filtered;
            renderGrid(filtered, term);
        } else {
            if (clearBtn) clearBtn.classList.add('hidden');
            currentData = [...imageData];
            renderGrid(currentData);
        }
    });
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearSearch');
    
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    currentData = [...imageData];
    sortImages();
}

function sortImages() {
    const sortSelect = document.getElementById('sortSelect');
    const sortType = sortSelect ? sortSelect.value : 'newest';
    currentSort = sortType;
    
    let sorted = [...currentData];
    if (sortType === 'newest') {
        sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
        sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    renderGrid(sorted);
}

function renderGrid(data, highlightTerm = '') {
    const grid = document.getElementById('imageGrid');
    const resultCount = document.getElementById('resultCount');
    
    if (!grid) {
        console.error('imageGrid not found!');
        return;
    }
    
    grid.innerHTML = '';
    
    if (resultCount) {
        resultCount.textContent = data.length === imageData.length ? 'Semua gambar' : `${data.length} hasil`;
    }

    data.forEach(item => {
        const card = createCard(item, highlightTerm);
        grid.appendChild(card);
    });
}

function createCard(item, highlightTerm = '') {
    const div = document.createElement('div');
    div.className = 'masonry-item';
    
    let displayTitle = item.title;
    if (highlightTerm) {
        const regex = new RegExp(`(${highlightTerm})`, 'gi');
        displayTitle = item.title.replace(regex, '<span class="highlight">$1</span>');
    }
    
    div.innerHTML = `
        <div class="image-card">
            <div class="image-wrapper" onclick="openImageModal(${item.id})">
                <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/400?text=No+Image'">
            </div>
            <div class="card-footer">
                <h3 class="card-title" title="${item.title}">${displayTitle}</h3>
                <button class="three-dots" onclick="toggleCardDropdown(event, ${item.id})" aria-label="Options">
                    <svg fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="6" r="2"/>
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="18" r="2"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
    return div;
}

// ========== IMAGE MODAL ==========
function openImageModal(id) {
    const item = imageData.find(i => i.id === id);
    if (!item) return;
    
    item.views = (item.views || 0) + 1;
    saveData();
    
    selectedCardId = id;
    
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalPrompt = document.getElementById('modalPrompt');
    const modalSpecs = document.getElementById('modalSpecs');
    const modalDate = document.getElementById('modalDate');
    const refSection = document.getElementById('referenceSection');
    const refGrid = document.getElementById('referenceGrid');
    const modal = document.getElementById('imageModal');
    
    if (modalImage) modalImage.src = item.image;
    if (modalTitle) modalTitle.textContent = item.title;
    if (modalPrompt) modalPrompt.textContent = item.prompt;
    if (modalSpecs) modalSpecs.textContent = `${item.model} • ${item.ratio}`;
    if (modalDate) modalDate.textContent = `Diunggah ${formatDate(item.date)}`;
    
    if (refSection && refGrid) {
        if (item.hasReference && item.references && item.references.length > 0) {
            refSection.classList.remove('hidden');
            refGrid.innerHTML = item.references.map((ref, idx) => `
                <div class="reference-item">
                    <img src="${ref.url}" alt="Ref ${idx + 1}" onerror="this.style.display='none'">
                    <button class="ref-download" onclick="downloadImage('${ref.url}', '${ref.name}')" aria-label="Download">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                    </button>
                </div>
            `).join('');
        } else {
            refSection.classList.add('hidden');
        }
    }
    
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function downloadMainImage() {
    const item = imageData.find(i => i.id === selectedCardId);
    if (item) {
        downloadImage(item.image, `${item.title.replace(/\s+/g, '_')}.jpg`);
        showToast('Gambar diunduh');
    }
}

function copyMainPrompt() {
    const item = imageData.find(i => i.id === selectedCardId);
    if (item) {
        copyToClipboard(item.prompt);
        showToast('Prompt disalin');
    }
}

// ========== DROPDOWN MENU ==========
function toggleCardDropdown(event, id) {
    event.stopPropagation();
    const dropdown = document.getElementById('cardDropdown');
    const btn = event.currentTarget;
    const rect = btn.getBoundingClientRect();
    
    if (!dropdown) return;
    
    selectedCardId = id;
    const item = imageData.find(i => i.id === id);
    
    const dropdownHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        dropdown.style.top = `${rect.top + window.scrollY - dropdownHeight}px`;
    } else {
        dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
    }
    
    dropdown.style.left = `${Math.min(rect.right - 200, window.innerWidth - 220)}px`;
    
    const preview = document.getElementById('dropdownPreview');
    if (preview && item) preview.src = item.image;
    
    dropdown.classList.toggle('active');
}

function downloadFromDropdown() {
    const item = imageData.find(i => i.id === selectedCardId);
    if (item) {
        downloadImage(item.image, `${item.title.replace(/\s+/g, '_')}.jpg`);
        showToast('Gambar diunduh');
    }
    closeDropdown();
}

function copyFromDropdown() {
    const item = imageData.find(i => i.id === selectedCardId);
    if (item) {
        copyToClipboard(item.prompt);
        showToast('Prompt disalin');
    }
    closeDropdown();
}

function closeDropdown() {
    const dropdown = document.getElementById('cardDropdown');
    if (dropdown) dropdown.classList.remove('active');
}

// ========== UTILITIES ==========
function downloadImage(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return 'hari ini';
    if (diff === 1) return 'kemarin';
    if (diff < 7) return `${diff} hari lalu`;
    if (diff < 30) return `${Math.floor(diff/7)} minggu lalu`;
    return date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
}

function setupTouchEvents() {
    window.addEventListener('scroll', () => {
        const dropdown = document.getElementById('cardDropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            closeDropdown();
        }
    }, {passive: true});
    
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('cardDropdown');
        if (dropdown && dropdown.classList.contains('active') && !e.target.closest('.image-card')) {
            closeDropdown();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const imageModal = document.getElementById('imageModal');
            const adminPanel = document.getElementById('adminPanel');
            const portfolioModal = document.getElementById('portfolioModal');
            const sideMenu = document.getElementById('sideMenu');
            
            if (imageModal?.classList.contains('active')) {
                closeImageModal();
            } else if (adminPanel?.classList.contains('active')) {
                toggleAdmin();
            } else if (portfolioModal?.classList.contains('active')) {
                closePortfolio();
            } else if (sideMenu?.classList.contains('active')) {
                toggleMenu();
            }
        }
    });
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, {passive: false});
}

function showUploadHint() {
    alert('1. Upload gambar ke imgur.com atau postimages.org\n2. Copy URL gambar (direct link)\n3. Paste di field URL Gambar');
}
