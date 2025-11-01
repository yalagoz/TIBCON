document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('order-form');
    const orderList = document.getElementById('order-list');
    const excelFileInp = document.getElementById('excel-file');
    const excelDataContainer = document.getElementById('excel-data-container');
    const excelModal = new bootstrap.Modal(document.getElementById('excelModal'));

    let excelData = null; // Excel verisini geçici olarak tutmak için

    // Sayfa yüklendiğinde mevcut siparişleri yükle
    loadOrders();

    // Excel dosyası seçildiğinde veriyi oku ve `excelData` değişkenine ata
    excelFileInp.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // Excel verisini HTML tablosuna dönüştür
            excelData = XLSX.utils.sheet_to_html(worksheet);
        };
        reader.readAsArrayBuffer(file);
    });

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const order = {
            id: Date.now(),
            by: document.getElementById('order-by').value,
            quantity: document.getElementById('order-quantity').value,
            orderDate: document.getElementById('order-date').value,
            arrivalDate: document.getElementById('arrival-date').value,
            excel: excelData // Okunan Excel verisini objeye ekle
        };

        addOrder(order);
        renderOrders();
        orderForm.reset();
        excelData = null; // Formu sıfırladıktan sonra geçici veriyi temizle
    });

    function getOrders() {
        return JSON.parse(localStorage.getItem('orders')) || [];
    }

    function saveOrders(orders) {
        localStorage.setItem('orders', JSON.stringify(orders));
    }

    function addOrder(order) {
        const orders = getOrders();
        orders.push(order);
        saveOrders(orders);
    }

    function deleteOrder(orderId) {
        let orders = getOrders();
        orders = orders.filter(order => order.id !== orderId);
        saveOrders(orders);
        renderOrders();
    }

    function renderOrders() {
        const orders = getOrders();
        orderList.innerHTML = '';

        if (orders.length === 0) {
            orderList.innerHTML = '<tr><td colspan="6" class="text-center">Henüz sipariş girilmemiş.</td></tr>';
            return;
        }

        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${order.by}</td>
                <td>${order.quantity}</td>
                <td>${new Date(order.orderDate).toLocaleDateString('tr-TR')}</td>
                <td>${order.arrivalDate ? new Date(order.arrivalDate).toLocaleDate-string('tr-TR') : 'Belirtilmedi'}</td>
                <td>
                    ${order.excel ? `<button class="btn btn-info btn-sm view-details-btn" data-id="${order.id}">Detay Gör</button>` : 'Yok'}
                </td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${order.id}">Sil</button>
                </td>
            `;
            orderList.appendChild(tr);
        });
    }
    
    // Detayları Gör ve Sil butonları için event listener
    orderList.addEventListener('click', (e) => {
        const target = e.target;
        const orderId = parseInt(target.getAttribute('data-id'));
        
        if (target.classList.contains('delete-btn')) {
            if (confirm('Bu siparişi silmek istediğinizden emin misiniz?')) {
                deleteOrder(orderId);
            }
        }
        
        if (target.classList.contains('view-details-btn')) {
            const orders = getOrders();
            const order = orders.find(o => o.id === orderId);
            if (order && order.excel) {
                // Excel verisini al ve Bootstrap table class'ı ekle
                excelDataContainer.innerHTML = order.excel.replace('<table', '<table class="table table-bordered"');
                excelModal.show();
            }
        }
    });

    function loadOrders() {
        renderOrders();
    }
});