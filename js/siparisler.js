// siparisler.js (Kart butonları tarihlerin altına taşınmış tam sürüm)

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Gerekli Kontroller ve Başlangıç Ayarları ---
    checkAuth();
    populateSidebarUser();

    // --- Sabitler ve Değişkenler ---
    const db = firebase.firestore();
    const storage = firebase.storage();
    const ordersContainer = document.getElementById('orders-container');
    const orderForm = document.getElementById('order-form');
    const saveOrderBtn = document.getElementById('save-order-btn');
    const modalTitle = document.getElementById('modal-title');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const cardViewBtn = document.getElementById('card-view-btn');
    const tableViewBtn = document.getElementById('table-view-btn');

    // Bootstrap Modal Nesneleri
    const orderModalEl = document.getElementById('orderModal');
    const orderModal = new bootstrap.Modal(orderModalEl);
    const historyModalEl = document.getElementById('historyModal');
    const historyModal = new bootstrap.Modal(historyModalEl);
    
    const orderStatuses = ['Beklemede', 'Sipariş Edildi', 'Sipariş Tamamlandı', 'İptal Edildi'];
    let currentView = 'table';
    let allOrders = [];
    let newFile = null;

    populateStatusFilter();
    setupEventListeners();
    listenForOrders();

    function setupEventListeners() {
        searchInput.addEventListener('input', displayFilteredOrders);
        statusFilter.addEventListener('change', displayFilteredOrders);
        cardViewBtn.addEventListener('click', () => switchView('card'));
        tableViewBtn.addEventListener('click', () => switchView('table'));
        document.getElementById('new-order-btn').addEventListener('click', openNewOrderModal);
        orderForm.addEventListener('submit', handleSaveOrder);
        ['miktar', 'birim-fiyat', 'currency'].forEach(id => {
            document.getElementById(id).addEventListener('input', calculateTotalInModal);
        });
        document.getElementById('dosya').addEventListener('change', (e) => {
            newFile = e.target.files[0] || null;
            const fileInfo = document.getElementById('current-file-info');
            if(newFile) { fileInfo.textContent = `Seçilen yeni dosya: ${newFile.name}`; }
        });
        ordersContainer.addEventListener('click', handleOrderAction);
        document.getElementById('logout-button-sidebar').addEventListener('click', logout);
    }

    function listenForOrders() {
        db.collection('siparisler').orderBy('id', 'desc').onSnapshot(snapshot => {
            allOrders = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            displayFilteredOrders(); 
        }, error => {
            console.error("Firestore'dan veri okunurken hata oluştu: ", error);
            ordersContainer.innerHTML = `<div class="alert alert-danger">Siparişler yüklenirken bir hata oluştu.</div>`;
        });
    }

    function renderOrders(ordersToRender) {
        ordersContainer.innerHTML = '';
        if (ordersToRender.length === 0) {
            ordersContainer.innerHTML = `<p class="text-center text-muted mt-4">Gösterilecek sipariş bulunamadı.</p>`;
            return;
        }
        if (currentView === 'card') {
            const cardHTML = ordersToRender.map(order => createOrderCardHTML(order)).join('');
            ordersContainer.innerHTML = `<div class="row g-3">${cardHTML}</div>`;
        } else {
            ordersContainer.innerHTML = createOrderTableHTML(ordersToRender);
        }
    }

    function displayFilteredOrders() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;
        const filtered = allOrders.filter(order => {
            const matchesSearch = searchTerm === '' || order.musteri.toLowerCase().includes(searchTerm) || order.urun.toLowerCase().includes(searchTerm);
            const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
            return matchesSearch && matchesStatus;
        });
        renderOrders(filtered);
    }
    
    function createOrderTableHTML(orders) {
        const tableRows = orders.map(order => {
            const { progress, daysRemainingText } = calculateProgress(order);
            const statusClass = getStatusClass(order.status);
            return `
            <tr>
                <td>${order.musteri}</td>
                <td>${order.urun}</td>
                <td><div class="progress" title="${Math.round(progress)}%"><div class="progress-bar" role="progressbar" style="width: ${progress}%;"></div></div></td>
                <td class="text-center">${daysRemainingText}</td>
                <td><span class="badge order-status ${statusClass}">${order.status}</span></td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline-secondary" data-action="history" data-id="${order.docId}" title="Geçmişi Gör"><i class="bi bi-clock-history"></i></button>
                        <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${order.docId}" title="Düzenle"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${order.docId}" title="Sil"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>`;
        }).join('');
        return `<div class="table-responsive table-container"><table class="table table-hover align-middle"><thead><tr><th>Müşteri</th><th>Ürün</th><th>İlerleme</th><th class="text-center">Kalan Gün</th><th>Durum</th><th>İşlemler</th></tr></thead><tbody>${tableRows}</tbody></table></div>`;
    }
    
function createOrderCardHTML(order) {
    const { progress, daysRemainingText } = calculateProgress(order);
    const statusClass = getStatusClass(order.status);
    
    // Progress bar'ın rengini duruma göre ayarlayalım
    let progressBarClass = 'bg-primary'; // Varsayılan mavi
    if (order.status === 'Sipariş Tamamlandı') {
        progressBarClass = 'bg-success';
    } else if (order.status === 'İptal Edildi') {
        progressBarClass = 'bg-secondary';
    }

    return `
    <div class="col-md-6 col-lg-4">
        <div class="card h-100 order-card border-${statusClass}">
            <div class="card-body d-flex flex-column">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h5 class="card-title mb-0 me-3">${order.musteri}</h5>
                    <span class="badge order-status ${statusClass} flex-shrink-0">${order.status}</span>
                </div>
                <p class="card-subtitle text-muted">${order.urun}</p>
                
                <div class="mt-auto pt-3">
                    <div class="progress my-2" title="${Math.round(progress)}% tamamlandı">
                        <div class="progress-bar ${progressBarClass}" role="progressbar" style="width: ${progress}%;"></div>
                    </div>
                    <div class="d-flex justify-content-between small text-muted mb-3">
                        <span>Sipariş: ${new Date(order.siparisTarihi).toLocaleDateString('tr-TR')}</span>
                        <span>Kalan: ${daysRemainingText}</span>
                    </div>

                    <div class="d-flex justify-content-center">
                        <div class="btn-group w-100">
                            <button class="btn btn-sm btn-outline-secondary" data-action="history" data-id="${order.docId}" title="Geçmişi Gör"><i class="bi bi-clock-history"></i> Geçmiş</button>
                            <button class="btn btn-sm btn-outline-primary" data-action="edit" data-id="${order.docId}" title="Düzenle"><i class="bi bi-pencil"></i> Düzenle</button>
                            <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${order.docId}" title="Sil"><i class="bi bi-trash"></i> Sil</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
}

    function switchView(view) {
        currentView = view;
        cardViewBtn.classList.toggle('active', view === 'card');
        tableViewBtn.classList.toggle('active', view === 'table');
        displayFilteredOrders();
    }

    function populateStatusFilter() {
        statusFilter.innerHTML = '<option value="all">Tüm Durumlar</option>' + orderStatuses.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // --- Form ve Modal Fonksiyonları ---
    function openNewOrderModal() {
        orderForm.reset();
        modalTitle.textContent = 'Yeni Sipariş Oluştur';
        document.getElementById('order-doc-id').value = '';
        document.getElementById('status-update-section').style.display = 'none';
        document.getElementById('history-section').style.display = 'none';
        document.getElementById('current-file-info').textContent = '';
        document.getElementById('siparis-tarihi').valueAsDate = new Date();
        newFile = null;
        calculateTotalInModal();
        orderModal.show();
    }
    
    function openEditOrderModal(docId) {
        const order = allOrders.find(o => o.docId === docId);
        if (!order) { alert('Sipariş bulunamadı!'); return; }
        orderForm.reset();
        modalTitle.textContent = `Siparişi Düzenle: ${order.musteri}`;
        document.getElementById('order-doc-id').value = order.docId;
        document.getElementById('musteri-adi').value = order.musteri;
        document.getElementById('urun').value = order.urun;
        document.getElementById('miktar').value = order.miktar;
        document.getElementById('birim-fiyat').value = order.birimFiyat;
        document.getElementById('currency').value = order.currency || '₺';
        document.getElementById('siparis-tarihi').value = order.siparisTarihi || '';
        document.getElementById('teslimat-tarihi').value = order.teslimatTarihi || '';
        document.getElementById('notlar').value = order.notlar || '';
        const fileInfo = document.getElementById('current-file-info');
        fileInfo.textContent = order.dosyaAdi ? `Mevcut dosya: ${order.dosyaAdi}` : 'Mevcut dosya yok.';
        const statusSelect = document.getElementById('order-status');
        statusSelect.innerHTML = orderStatuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('');
        document.getElementById('status-update-section').style.display = 'block';
        const historySection = document.getElementById('history-section');
        const historyList = document.getElementById('history-list');
        if (order.history && order.history.length > 0) {
            historySection.style.display = 'block';
            historyList.innerHTML = createHistoryListHTML(order.history);
        } else {
            historySection.style.display = 'none';
        }
        newFile = null;
        calculateTotalInModal();
        orderModal.show();
    }
    
    async function handleSaveOrder(e) {
        e.preventDefault();
        saveOrderBtn.disabled = true;
        saveOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Kaydediliyor...';
        const docId = document.getElementById('order-doc-id').value;
        const currentUser = sessionStorage.getItem('loggedInUser') || 'Bilinmeyen Kullanıcı';
        const timestamp = new Date().toISOString();
        let existingOrder = docId ? allOrders.find(o => o.docId === docId) : null;
        let dosyaUrl = existingOrder ? existingOrder.dosyaUrl : null;
        let dosyaAdi = existingOrder ? existingOrder.dosyaAdi : null;
        if (newFile) {
            try {
                const filePath = `siparisDosyalari/${Date.now()}_${newFile.name}`;
                const fileRef = storage.ref(filePath);
                await fileRef.put(newFile);
                dosyaUrl = await fileRef.getDownloadURL();
                dosyaAdi = newFile.name;
            } catch (error) {
                console.error("Dosya yükleme hatası:", error);
                alert("Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.");
                saveOrderBtn.disabled = false;
                saveOrderBtn.textContent = 'Kaydet';
                return;
            }
        }
        const orderData = {
            musteri: document.getElementById('musteri-adi').value,
            urun: document.getElementById('urun').value,
            miktar: parseFloat(document.getElementById('miktar').value) || 0,
            birimFiyat: parseFloat(document.getElementById('birim-fiyat').value) || 0,
            currency: document.getElementById('currency').value,
            siparisTarihi: document.getElementById('siparis-tarihi').value,
            teslimatTarihi: document.getElementById('teslimat-tarihi').value,
            notlar: document.getElementById('notlar').value,
            dosyaUrl: dosyaUrl,
            dosyaAdi: dosyaAdi,
        };
        try {
            if (docId) {
                const newStatus = document.getElementById('order-status').value;
                const newHistory = [...(existingOrder.history || [])];
                if (newStatus !== existingOrder.status) {
                    newHistory.push({ user: currentUser, action: `Durum '${existingOrder.status}' iken '${newStatus}' olarak değiştirildi`, timestamp: timestamp });
                }
                orderData.status = newStatus;
                orderData.history = newHistory;
                await db.collection('siparisler').doc(docId).update(orderData);
            } else {
                orderData.id = Date.now();
                orderData.status = 'Beklemede';
                orderData.createdBy = currentUser;
                orderData.history = [{ user: currentUser, action: 'Sipariş oluşturuldu', timestamp: timestamp }];
                await db.collection('siparisler').add(orderData);
            }
            orderModal.hide();
        } catch (error) {
            console.error("Kaydetme hatası: ", error);
            alert("Sipariş kaydedilirken bir hata oluştu!");
        } finally {
            saveOrderBtn.disabled = false;
            saveOrderBtn.textContent = 'Kaydet';
        }
    }

    function showHistoryModal(docId) {
        const order = allOrders.find(o => o.docId === docId);
        if (!order) { alert('Sipariş bulunamadı!'); return; }
        document.getElementById('history-modal-title').textContent = `Geçmiş: ${order.musteri}`;
        document.getElementById('history-modal-body').innerHTML = createHistoryListHTML(order.history);
        historyModal.show();
    }
    
    async function deleteOrder(docId) {
        if (confirm('Bu siparişi kalıcı olarak silmek istediğinizden emin misiniz?')) {
            try { await db.collection('siparisler').doc(docId).delete(); } 
            catch (error) { console.error("Hata: Sipariş silinemedi: ", error); alert("Sipariş silinirken bir hata oluştu."); }
        }
    }

    // --- Yardımcı (Utility) Fonksiyonlar ---
    function createHistoryListHTML(history) {
        if (!history || history.length === 0) { return '<p class="text-muted">Bu sipariş için değişiklik geçmişi bulunmuyor.</p>'; }
        const historyItems = history.slice().reverse().map(log => {
            const date = new Date(log.timestamp).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' });
            return `<li class="list-group-item"><strong>${log.user || 'Sistem'}:</strong> ${log.action} <span class="text-muted float-end">${date}</span></li>`;
        }).join('');
        return `<ul class="list-group list-group-flush">${historyItems}</ul>`;
    }
    function calculateTotalInModal() {
        const miktar = parseFloat(document.getElementById('miktar').value) || 0;
        const fiyat = parseFloat(document.getElementById('birim-fiyat').value) || 0;
        const currency = document.getElementById('currency').value;
        document.getElementById('total-price').textContent = (miktar * fiyat).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ` ${currency}`;
    }
    function calculateProgress(order) {
        if (!order.siparisTarihi || !order.teslimatTarihi) return { progress: 0, daysRemainingText: 'Tarih Eksik' };
        const startDate = new Date(order.siparisTarihi);
        const endDate = new Date(order.teslimatTarihi);
        const today = new Date(); today.setHours(0, 0, 0, 0);
        if (endDate < startDate) return { progress: 100, daysRemainingText: `<span class="badge bg-warning text-dark">Geçersiz Süre</span>` };
        if (order.status === 'Sipariş Tamamlandı') return { progress: 100, daysRemainingText: `<span class="badge bg-success">Bitti</span>` };
        if (order.status === 'İptal Edildi') return { progress: 0, daysRemainingText: `<span class="badge bg-secondary">İptal</span>` };
        const totalDuration = endDate - startDate;
        const elapsedDuration = today - startDate;
        let progress = totalDuration > 0 ? Math.max(0, Math.min(100, elapsedDuration / totalDuration * 100)) : 0;
        const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
        let daysRemainingText = `${daysRemaining} gün`;
        if (daysRemaining < 0) daysRemainingText = `<span class="badge bg-danger">Süre Doldu</span>`;
        return { progress, daysRemainingText };
    }
    function getStatusClass(status) {
        const statusMap = { 'Beklemede': 'beklemede', 'Sipariş Edildi': 'siparis-edildi', 'Sipariş Tamamlandı': 'siparis-tamamlandi', 'İptal Edildi': 'iptal-edildi' };
        return statusMap[status] || 'default';
    }

    function handleOrderAction(event) {
        const actionButton = event.target.closest('[data-action]');
        
        if (!actionButton) return;

        const action = actionButton.dataset.action;
        const docId = actionButton.dataset.id;

        switch (action) {
            case 'edit': openEditOrderModal(docId); break;
            case 'delete': deleteOrder(docId); break;
            case 'history': showHistoryModal(docId); break;
        }
    }
});