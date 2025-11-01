checkAuth(); // Sayfa başında giriş kontrolü

document.addEventListener('DOMContentLoaded', () => {
    populateUserInfo(); // Header'ı doldur

    const orderForm = document.getElementById('order-form');
    const orderList = document.getElementById('order-list');
    const excelFileInp = document.getElementById('excel-file');
    const excelDataContainer = document.getElementById('excel-data-container');
    const excelModal = new bootstrap.Modal(document.getElementById('excelModal'));
    const logoutButton = document.getElementById('logout-button');

    if (logoutButton) logoutButton.addEventListener('click', logout);
    
    let excelData = null;
    const orderStatuses = ['Bekliyor', 'Sipariş Verildi', 'Yolda', 'Tamamlandı', 'İptal Edildi'];

    loadOrders();

    excelFileInp.addEventListener('change', (event) => {
        const file = event.target.files[0]; if (!file) { excelData = null; return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            excelData = XLSX.utils.sheet_to_html(workbook.Sheets[workbook.SheetNames[0]]);
        };
        reader.readAsArrayBuffer(file);
    });

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const order = {
            id: Date.now(),
            quantity: document.getElementById('order-quantity').value,
            orderDate: document.getElementById('order-date').value,
            arrivalDate: document.getElementById('arrival-date').value,
            excel: excelData,
            status: 'Bekliyor', // Varsayılan durum
            createdBy: sessionStorage.getItem('loggedInUser') // Siparişi oluşturan kullanıcı
        };
        addOrder(order);
        renderOrders();
        orderForm.reset();
        excelData = null;
    });

    function getOrders() { return JSON.parse(localStorage.getItem('orders')) || []; }
    function saveOrders(orders) { localStorage.setItem('orders', JSON.stringify(orders)); }
    function addOrder(order) { const orders = getOrders(); orders.push(order); saveOrders(orders); }
    function deleteOrder(orderId) { let orders = getOrders(); orders = orders.filter(o => o.id !== orderId); saveOrders(orders); renderOrders(); }

    function updateOrderStatus(orderId, newStatus) {
        let orders = getOrders();
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex > -1) { orders[orderIndex].status = newStatus; saveOrders(orders); renderOrders(); }
    }

    function renderOrders() {
        const orders = getOrders();
        orderList.innerHTML = '';

        if (orders.length === 0) {
            orderList.innerHTML = '<tr><td colspan="9" class="text-center">Henüz sipariş girilmemiş.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            
            // Progress Bar ve Kalan Gün Hesaplamaları
            let progress = 0, daysRemainingText = '<span class="text-muted">Tarih Yok</span>', progressBarColor = 'bg-secondary';
            if (order.arrivalDate) {
                const startDate = new Date(order.orderDate);
                const endDate = new Date(order.arrivalDate);
                const today = new Date();
                const totalDuration = endDate - startDate;
                const elapsedDuration = today - startDate;
                progress = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
                
                const timeRemaining = endDate - today;
                let daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
                daysRemainingText = `${daysRemaining} gün`;

                if (daysRemaining < 0) daysRemainingText = `<span class="badge bg-danger">Süre Doldu</span>`;
                else if (daysRemaining === 0) daysRemainingText = `<span class="badge bg-warning text-dark">Son Gün</span>`;

                progressBarColor = 'bg-primary';
                if (progress >= 100) progressBarColor = 'bg-success';
                if (daysRemaining < 0 && order.status !== 'Tamamlandı') progressBarColor = 'bg-danger';
            }
             if (order.status === 'Tamamlandı') {
                progress = 100;
                progressBarColor = 'bg-success';
                daysRemainingText = `<span class="badge bg-success">Bitti</span>`;
            }


            const formattedOrderDate = new Date(order.orderDate).toLocaleDateString('tr-TR');
            const formattedArrivalDate = order.arrivalDate ? new Date(order.arrivalDate).toLocaleDateString('tr-TR') : '<span class="text-muted">Belirtilmedi</span>';
            let statusOptions = orderStatuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('');

            tr.innerHTML = `
                <td>${order.createdBy || 'Bilinmiyor'}</td>
                <td>${order.quantity}</td>
                <td>${formattedOrderDate}</td>
                <td>${formattedArrivalDate}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${progressBarColor}" style="width: ${progress}%;">${Math.round(progress)}%</div>
                    </div>
                </td>
                <td class="text-center">${daysRemainingText}</td>
                <td><select class="form-select form-select-sm status-select" data-id="${order.id}">${statusOptions}</select></td>
                <td>${order.excel ? `<button class="btn btn-info btn-sm view-details-btn" data-id="${order.id}">Gör</button>` : 'Yok'}</td>
                <td><button class="btn btn-danger btn-sm delete-btn" data-id="${order.id}">Sil</button></td>
            `;
            orderList.appendChild(tr);
        });
    }

    orderList.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const orderId = parseInt(button.getAttribute('data-id'));
        if (button.classList.contains('delete-btn')) { if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) deleteOrder(orderId); }
        if (button.classList.contains('view-details-btn')) {
            const order = getOrders().find(o => o.id === orderId);
            if (order && order.excel) { excelDataContainer.innerHTML = order.excel.replace('<table', '<table class="table table-bordered"'); excelModal.show(); }
        }
    });
    
    orderList.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
            const orderId = parseInt(e.target.getAttribute('data-id'));
            const newStatus = e.target.value;
            updateOrderStatus(orderId, newStatus);
        }
    });

    function loadOrders() { renderOrders(); }
});