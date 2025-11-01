checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    populateSidebarUser();
    
    const ordersContainer = document.getElementById('orders-container');
    const orderForm = document.getElementById('order-form');
    const newOrderModalEl = document.getElementById('newOrderModal');
    const newOrderModal = new bootstrap.Modal(newOrderModalEl);
    const excelViewModal = new bootstrap.Modal(document.getElementById('excelViewModal'));
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const cardViewBtn = document.getElementById('card-view-btn');
    const tableViewBtn = document.getElementById('table-view-btn');
    
    const orderStatuses = ['Beklemede', 'Sipariş Aşamasında', 'Tamamlandı'];
    let currentView = 'card';
    let allOrders = [];
    let fileData = null;

    function getOrders() { return JSON.parse(localStorage.getItem('siparisler_v3')) || []; }
    function saveOrders(orders) { localStorage.setItem('siparisler_v3', JSON.stringify(orders)); }

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

        const statusOptions = orderStatuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('');

        return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">ORD-${String(order.id).padStart(5, '0')}</span>
                <select class="form-select form-select-sm" style="max-width: 200px;" onchange="updateOrderStatus(${order.id}, this.value)">${statusOptions}</select>
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

    function createOrderTableHTML(orders) { /* ... Tablo HTML oluşturma fonksiyonu ... */ return 'Tablo görünümü geliştiriliyor...'; }
    
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

    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const orderId = document.getElementById('order-id').value;
        const order = {
            id: orderId ? parseInt(orderId) : Date.now(),
            musteri: document.getElementById('musteri-adi').value,
            urun: document.getElementById('urun').value,
            miktar: parseFloat(document.getElementById('miktar').value),
            birimFiyat: parseFloat(document.getElementById('birim-fiyat').value),
            teslimatTarihi: document.getElementById('teslimat-tarihi').value,
            notlar: document.getElementById('notlar').value,
            dosyaData: fileData,
            status: orderId ? allOrders.find(o => o.id === parseInt(orderId)).status : 'Beklemede',
            createdBy: sessionStorage.getItem('loggedInUser')
        };
        if (orderId) { allOrders = allOrders.map(o => o.id === order.id ? order : o); }
        else { allOrders.push(order); }
        saveOrders(allOrders);
        displayFilteredOrders();
        newOrderModal.hide();
    });

    newOrderModalEl.addEventListener('hidden.bs.modal', () => { orderForm.reset(); fileData = null; document.getElementById('order-id').value = ''; });
    
    ['miktar', 'birim-fiyat'].forEach(id => document.getElementById(id).addEventListener('input', () => {
        const miktar = parseFloat(document.getElementById('miktar').value) || 0;
        const fiyat = parseFloat(document.getElementById('birim-fiyat').value) || 0;
        document.getElementById('total-price').textContent = (miktar * fiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    }));

    window.updateOrderStatus = function(id, newStatus) {
        const orderIndex = allOrders.findIndex(o => o.id === id);
        if(orderIndex > -1) {
            allOrders[orderIndex].status = newStatus;
            saveOrders(allOrders);
            displayFilteredOrders();
        }
    }
    
    window.editOrder = function(id) { /* ... düzenleme fonksiyonu ... */ }
    window.deleteOrder = function(id) { /* ... silme fonksiyonu ... */ }

    window.viewFile = function(id) {
        const order = allOrders.find(o => o.id === id);
        if (order && order.dosyaData) {
            const container = document.getElementById('excel-data-container');
            container.innerHTML = order.dosyaData;
            container.querySelector('table').classList.add('table', 'table-bordered', 'table-striped');
            excelViewModal.show();
        }
    }

    searchInput.addEventListener('input', displayFilteredOrders);
    statusFilter.addEventListener('change', displayFilteredOrders);
    cardViewBtn.addEventListener('click', () => { currentView = 'card'; cardViewBtn.classList.add('active'); tableViewBtn.classList.remove('active'); displayFilteredOrders(); });
    tableViewBtn.addEventListener('click', () => { currentView = 'table'; tableViewBtn.classList.add('active'); cardViewBtn.classList.remove('active'); displayFilteredOrders(); });
    document.getElementById('logout-button-sidebar').addEventListener('click', logout);

    allOrders = getOrders();
    displayFilteredOrders();
});
