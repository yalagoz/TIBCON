checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Kullanıcı Bilgilerini Doldurma ---
    function populateSidebarUser() {
        const loggedInUser = sessionStorage.getItem('loggedInUser');
        if (loggedInUser) {
            document.getElementById('user-name-sidebar').textContent = loggedInUser;
            const initials = loggedInUser.split(' ').map(n => n[0]).join('');
            document.getElementById('user-avatar-sidebar').src = `https://ui-avatars.com/api/?name=${initials}&background=random&color=fff`;
        }
    }
    populateSidebarUser();
    
    // --- Element Seçimleri ---
    const ordersContainer = document.getElementById('orders-container');
    const orderForm = document.getElementById('order-form');
    const newOrderModal = new bootstrap.Modal(document.getElementById('newOrderModal'));
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const cardViewBtn = document.getElementById('card-view-btn');
    const tableViewBtn = document.getElementById('table-view-btn');
    
    // --- State Yönetimi ---
    let currentView = 'card'; // 'card' or 'table'
    let allOrders = [];

    // --- Sipariş Fonksiyonları ---
    function getOrders() { return JSON.parse(localStorage.getItem('siparisler_v2')) || []; }
    function saveOrders(orders) { localStorage.setItem('siparisler_v2', JSON.stringify(orders)); }

    function renderOrders(ordersToRender) {
        ordersContainer.innerHTML = '';
        if (ordersToRender.length === 0) {
            ordersContainer.innerHTML = `<p class="text-center text-muted">Gösterilecek sipariş bulunamadı.</p>`;
            return;
        }

        if (currentView === 'card') {
            ordersToRender.forEach(order => ordersContainer.innerHTML += createOrderCardHTML(order));
        } else {
            ordersContainer.innerHTML = createOrderTableHTML(ordersToRender);
        }
    }

    function displayFilteredOrders() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedStatus = statusFilter.value;

        let filtered = allOrders.filter(order => {
            const matchesSearch = searchTerm === '' || 
                                order.musteri.toLowerCase().includes(searchTerm) ||
                                order.urun.toLowerCase().includes(searchTerm) ||
                                `ORD-${String(order.id).padStart(5, '0')}`.toLowerCase().includes(searchTerm);
            
            const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        renderOrders(filtered);
    }

    // --- HTML Şablonları ---
    function createOrderCardHTML(order) {
        const statusClass = order.status.toLowerCase().replace(' ', '');
        const total = (order.miktar * order.birimFiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
        const teslimat = order.teslimatTarihi ? new Date(order.teslimatTarihi).toLocaleDateString('tr-TR') : 'Belirtilmedi';

        return `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">ORD-${String(order.id).padStart(5, '0')}</span>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
            <div class="order-details">
                <span>Müşteri</span>
                <p>${order.musteri}</p>
            </div>
            <div class="order-details">
                <span>Ürün</span>
                <p>${order.urun}</p>
            </div>
            <div class="order-pricing">
                <span>Miktar</span>
                <p>${order.miktar} adet</p>
            </div>
            <div class="order-pricing">
                <span>Tutar</span>
                <p>${total}</p>
            </div>
            <div class="order-details">
                <span>Teslimat</span>
                <p>${teslimat}</p>
            </div>
            <div class="order-actions">
                <span>İşlemler</span>
                <div class="actions-buttons">
                    <button class="btn" onclick="editOrder(${order.id})"><i class="bi bi-pencil"></i> Düzenle</button>
                    <button class="btn" onclick="deleteOrder(${order.id})"><i class="bi bi-trash"></i> Sil</button>
                </div>
            </div>
        </div>`;
    }

    function createOrderTableHTML(orders) {
        let rows = orders.map(order => {
            const total = (order.miktar * order.birimFiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
            const teslimat = order.teslimatTarihi ? new Date(order.teslimatTarihi).toLocaleDateString('tr-TR') : 'Belirtilmedi';
            return `
            <tr>
                <td>ORD-${String(order.id).padStart(5, '0')}</td>
                <td>${order.musteri}</td>
                <td>${order.urun}</td>
                <td>${order.miktar}</td>
                <td>${total}</td>
                <td>${teslimat}</td>
                <td><span class="badge order-status ${order.status.toLowerCase()}">${order.status}</span></td>
                <td>
                    <button class="btn btn-sm btn-outline-light" onclick="editOrder(${order.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteOrder(${order.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        }).join('');

        return `
        <table class="table table-dark table-hover align-middle">
            <thead>
                <tr>
                    <th>Sipariş No</th>
                    <th>Müşteri</th>
                    <th>Ürün</th>
                    <th>Miktar</th>
                    <th>Tutar</th>
                    <th>Teslimat</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>`;
    }

    // --- Form Yönetimi ---
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const orderId = document.getElementById('order-id').value;

        const newOrder = {
            id: orderId ? parseInt(orderId) : Date.now(),
            musteri: document.getElementById('musteri-adi').value,
            urun: document.getElementById('urun').value,
            miktar: parseFloat(document.getElementById('miktar').value),
            birimFiyat: parseFloat(document.getElementById('birim-fiyat').value),
            teslimatTarihi: document.getElementById('teslimat-tarihi').value,
            notlar: document.getElementById('notlar').value,
            dosya: document.getElementById('dosya').files[0]?.name || null,
            status: 'Yeni', // Varsayılan durum
            createdBy: sessionStorage.getItem('loggedInUser')
        };
        
        if (orderId) { // Düzenleme
            allOrders = allOrders.map(o => o.id === newOrder.id ? newOrder : o);
        } else { // Ekleme
            allOrders.push(newOrder);
        }

        saveOrders(allOrders);
        displayFilteredOrders();
        newOrderModal.hide();
        orderForm.reset();
    });
    
    // Toplam tutarı anlık hesapla
    ['miktar', 'birim-fiyat'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const miktar = parseFloat(document.getElementById('miktar').value) || 0;
            const fiyat = parseFloat(document.getElementById('birim-fiyat').value) || 0;
            document.getElementById('total-price').textContent = (miktar * fiyat).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
        });
    });

    // --- Düzenle ve Sil Fonksiyonları (Global scope'da olmalı) ---
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
            // Dosya input'unu sıfırla, düzenlemede yeniden seçilmeli
            document.getElementById('dosya').value = '';
            // Toplam tutarı güncelle
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

    // --- Olay Dinleyicileri (Event Listeners) ---
    searchInput.addEventListener('input', displayFilteredOrders);
    statusFilter.addEventListener('change', displayFilteredOrders);

    cardViewBtn.addEventListener('click', () => {
        currentView = 'card';
        cardViewBtn.classList.add('active');
        tableViewBtn.classList.remove('active');
        displayFilteredOrders();
    });

    tableViewBtn.addEventListener('click', () => {
        currentView = 'table';
        tableViewBtn.classList.add('active');
        cardViewBtn.classList.remove('active');
        displayFilteredOrders();
    });
    
    document.getElementById('logout-button-sidebar').addEventListener('click', logout);

    // --- Başlangıç ---
    allOrders = getOrders();
    displayFilteredOrders();
});