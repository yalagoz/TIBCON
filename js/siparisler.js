checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    populateSidebarUser();
    
    // --- Element Seçimleri ---
    const ordersContainer = document.getElementById('orders-container');
    const orderForm = document.getElementById('order-form');
    const newOrderModalEl = document.getElementById('newOrderModal');
    const newOrderModal = new bootstrap.Modal(newOrderModalEl);
    const excelViewModal = new bootstrap.Modal(document.getElementById('excelViewModal'));
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const cardViewBtn = document.getElementById('card-view-btn');
    const tableViewBtn = document.getElementById('table-view-btn');
    const statusUpdateSection = document.getElementById('status-update-section');
    const statusSelect = document.getElementById('order-status');
    const modalTitle = document.getElementById('modal-title');
    
    // --- Değişkenler ---
    const orderStatuses = ['Beklemede', 'Sipariş Aşamasında', 'Tamamlandı'];
    let currentView = 'card';
    let allOrders = [];
    let fileData = null; // Sadece o anki modal için geçici dosya verisi

    // --- Veri Yönetimi Fonksiyonları ---
    function getOrders() { return JSON.parse(localStorage.getItem('siparisler_v3')) || []; }
    function saveOrders(orders) { localStorage.setItem('siparisler_v3', JSON.stringify(orders)); }

    // --- Arayüz Fonksiyonları ---
    function renderOrders(ordersToRender) {
        ordersContainer.innerHTML = '';
        if (ordersToRender.length === 0) {
            ordersContainer.innerHTML = `<p class="text-center text-muted mt-4">Gösterilecek sipariş bulunamadı.</p>`;
            return;
        }
        if (currentView === 'card') {
            ordersToRender.forEach(order => ordersContainer.insertAdjacentHTML('beforeend', createOrderCardHTML(order)));
        } else {
            ordersContainer.innerHTML = createOrderTableHTML(ordersToRender);
        }
    }

    function displayFilteredOrders() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;
        const filtered = allOrders.filter(order =>
            (searchTerm === '' || order.musteri.toLowerCase().includes(searchTerm) || order.urun.toLowerCase().includes(searchTerm)) &&
            (selectedStatus === 'all' || order.status === selectedStatus)
        );
        renderOrders(filtered);
    }

    function createOrderCardHTML(order) {
        const statusClass = order.status.toLowerCase().replace(/ /g, '');
        const total = (order.miktar * order.birimFiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
        const teslimat = order.teslimatTarihi ? new Date(order.teslimatTarihi).toLocaleDateString('tr-TR') : 'Belirtilmedi';
        const fileButton = order.dosyaData ? `<button class="btn" onclick="viewFile(${order.id})"><i class="bi bi-file-earmark-text"></i> Detay</button>` : '';

        return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">ORD-${String(order.id).padStart(5, '0')}</span>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
            <div class="order-details"><span>Müşteri</span><p>${order.musteri}</p></div>
            <div class="order-details"><span>Ürün</span><p>${order.urun}</p></div>
            <div class="order-pricing"><span>Miktar</span><p>${order.miktar} adet</p></div>
            <div class="order-pricing"><span>Tutar</span><p>${total}</p></div>
            <div class="order-details"><span>Teslimat</span><p>${teslimat}</p></div>
            <div class="order-actions"><span>İşlemler</span><div class="actions-buttons">
                ${fileButton}
                <button class="btn" onclick="editOrder(${order.id})"><i class="bi bi-pencil"></i> Düzenle</button>
                <button class="btn" onclick="deleteOrder(${order.id})"><i class="bi bi-trash"></i> Sil</button>
            </div></div>
        </div>`;
    }

    function createOrderTableHTML(orders) {
        let rows = orders.map(order => {
            const total = (order.miktar * order.birimFiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
            return `
            <tr>
                <td>ORD-${String(order.id).padStart(5, '0')}</td>
                <td>${order.musteri}</td>
                <td>${order.urun}</td>
                <td><span class="badge order-status ${order.status.toLowerCase().replace(/ /g, '')}">${order.status}</span></td>
                <td>${total}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary" onclick="editOrder(${order.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${order.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');
        return `<div class="table-responsive table-container"><table class="table table-hover align-middle"><thead><tr><th>Sipariş No</th><th>Müşteri</th><th>Ürün</th><th>Durum</th><th>Tutar</th><th>İşlemler</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    }

    // --- Form ve Modal Yönetimi ---
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const orderId = document.getElementById('order-id').value;
        
        // DÜZELTME: Daha basit ve güvenli veri toplama mantığı
        let finalDosyaData;
        if (orderId) { // Eğer düzenleme modundaysa
            const existingOrder = allOrders.find(o => o.id === parseInt(orderId));
            // Eğer yeni bir dosya seçildiyse onu kullan, seçilmediyse eskisini koru.
            finalDosyaData = fileData !== null ? fileData : (existingOrder ? existingOrder.dosyaData : null);
        } else { // Yeni sipariş ise
            finalDosyaData = fileData;
        }

        const order = {
            id: orderId ? parseInt(orderId) : Date.now(),
            musteri: document.getElementById('musteri-adi').value,
            urun: document.getElementById('urun').value,
            miktar: parseFloat(document.getElementById('miktar').value) || 0,
            birimFiyat: parseFloat(document.getElementById('birim-fiyat').value) || 0,
            teslimatTarihi: document.getElementById('teslimat-tarihi').value,
            notlar: document.getElementById('notlar').value,
            dosyaData: finalDosyaData,
            status: orderId ? statusSelect.value : 'Beklemede',
            createdBy: sessionStorage.getItem('loggedInUser')
        };
        
        if (orderId) { allOrders = allOrders.map(o => o.id === order.id ? order : o); }
        else { allOrders.push(order); }
        
        saveOrders(allOrders);
        displayFilteredOrders();
        newOrderModal.hide();
    });

    newOrderModalEl.addEventListener('show.bs.modal', () => {
        const orderId = document.getElementById('order-id').value;
        if (orderId) {
            modalTitle.textContent = 'Siparişi Düzenle';
            statusUpdateSection.style.display = 'block';
        } else {
            modalTitle.textContent = 'Yeni Sipariş Oluştur';
            statusUpdateSection.style.display = 'none';
        }
    });
    
    newOrderModalEl.addEventListener('hidden.bs.modal', () => {
        orderForm.reset();
        fileData = null;
        document.getElementById('order-id').value = '';
        document.getElementById('total-price').textContent = '0,00 ₺';
        statusUpdateSection.style.display = 'none';
    });
    
    document.getElementById('dosya').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) { fileData = null; return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            fileData = XLSX.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]]);
        };
        reader.readAsArrayBuffer(file);
    });

    ['miktar', 'birim-fiyat'].forEach(id => document.getElementById(id).addEventListener('input', () => {
        const miktar = parseFloat(document.getElementById('miktar').value) || 0;
        const fiyat = parseFloat(document.getElementById('birim-fiyat').value) || 0;
        document.getElementById('total-price').textContent = (miktar * fiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    }));

    // --- Global Fonksiyonlar (HTML içinden çağrılanlar) ---
    window.editOrder = function(id) {
        const order = allOrders.find(o => o.id === id);
        if (order) {
            document.getElementById('order-id').value = order.id;
            document.getElementById('musteri-adi').value = order.musteri;
            document.getElementById('urun').value = order.urun;
            document.getElementById('miktar').value = order.miktar;
            document.getElementById('birim-fiyat').value = order.birimFiyat;
            document.getElementById('teslimat-tarihi').value = order.teslimatTarihi;
            document.getElementById('notlar').value = order.notlar;

            statusSelect.innerHTML = '';
            orderStatuses.forEach(status => {
                const option = document.createElement('option');
                option.value = status;
                option.textContent = status;
                if (order.status === status) option.selected = true;
                statusSelect.appendChild(option);
            });
            
            fileData = null; // Düzenlemeye başlarken yeni dosya verisini temizle
            document.getElementById('dosya').value = '';

            document.getElementById('total-price').textContent = (order.miktar * order.birimFiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
            
            newOrderModal.show();
        }
    }

    window.deleteOrder = function(id) {
        if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
            allOrders = allOrders.filter(o => o.id !== id);
            saveOrders(allOrders);
            displayFilteredOrders();
        }
    }

    window.viewFile = function(id) {
        const order = allOrders.find(o => o.id === id);
        if (order && order.dosyaData) {
            const container = document.getElementById('excel-data-container');
            container.innerHTML = order.dosyaData;
            container.querySelector('table').classList.add('table', 'table-bordered', 'table-striped');
            excelViewModal.show();
        }
    }

    // --- Olay Dinleyicileri ---
    searchInput.addEventListener('input', displayFilteredOrders);
    statusFilter.addEventListener('change', displayFilteredOrders);
    cardViewBtn.addEventListener('click', () => { currentView = 'card'; cardViewBtn.classList.add('active'); tableViewBtn.classList.remove('active'); displayFilteredOrders(); });
    tableViewBtn.addEventListener('click', () => { currentView = 'table'; tableViewBtn.classList.add('active'); cardViewBtn.classList.remove('active'); displayFilteredOrders(); });
    document.getElementById('logout-button-sidebar').addEventListener('click', logout);

    // --- Başlangıç ---
    allOrders = getOrders();
    displayFilteredOrders();
});