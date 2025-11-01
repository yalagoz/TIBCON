checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    populateSidebarUser();
    document.getElementById('logout-button-sidebar').addEventListener('click', logout);
    
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');

    const statuses = ['Bekliyor', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi'];
    
    // --- Firestore Fonksiyonları ---

    // 1. Verileri GERÇEK ZAMANLI olarak dinle
    db.collection('tasks').orderBy('id', 'desc').onSnapshot(snapshot => {
        const tasks = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
        renderTasks(tasks);
    });

    function renderTasks(tasks) {
        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Henüz görev eklenmemiş.</td></tr>';
            return;
        }
        tasks.forEach(task => {
            const tr = document.createElement('tr');
            // Tarihleri Firestore'dan doğru okumak için
            const startDate = new Date(task.start), endDate = new Date(task.end), today = new Date();
            let progress = 0;
            if (endDate > startDate) {
                 progress = Math.max(0, Math.min(100, ((today - startDate) / (endDate - startDate)) * 100));
            }
            if (task.status === 'Tamamlandı' || (today > endDate && task.status !== 'İptal Edildi')) progress = 100;
            
            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            let daysRemainingText = `${daysRemaining} gün`;
            if (daysRemaining < 0) daysRemainingText = `<span class="badge bg-danger">Süre Doldu</span>`;
            else if (task.status === 'Tamamlandı') daysRemainingText = `<span class="badge bg-success">Bitti</span>`;
            
            let statusClass = "status-" + task.status.toLowerCase().replace(/ /g, '-');
            if (task.status === 'İptal Edildi') statusClass = 'status-iptal';
            let statusOptions = statuses.map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${s}</option>`).join('');
            
            tr.innerHTML = `
                <td>${task.name}</td><td>${task.assigned}</td><td>${task.createdBy || '-'}</td>
                <td>${startDate.toLocaleDateString('tr-TR')}</td><td>${endDate.toLocaleDateString('tr-TR')}</td>
                <td><div class="progress" style="height: 20px;"><div class="progress-bar" role="progressbar" style="width: ${progress}%;">${Math.round(progress)}%</div></div></td>
                <td class="text-center">${daysRemainingText}</td>
                <td><select class="form-select form-select-sm status-select ${statusClass}" data-doc-id="${task.docId}">${statusOptions}</select></td>
                <td><button class="btn btn-sm btn-outline-danger delete-btn" data-doc-id="${task.docId}"><i class="bi bi-trash"></i></button></td>
            `;
            taskList.appendChild(tr);
        });
    }
    
    // 2. Yeni görev EKLE
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTask = {
            id: Date.now(), // Sıralama için hala kullanışlı
            name: document.getElementById('task-name').value,
            start: document.getElementById('start-date').value,
            end: document.getElementById('end-date').value,
            assigned: document.getElementById('assigned-to').value,
            status: 'Bekliyor',
            createdBy: sessionStorage.getItem('loggedInUser')
        };
        db.collection('tasks').add(newTask)
            .then(() => {
                taskForm.reset();
            })
            .catch(error => console.error("Hata: Görev eklenemedi: ", error));
    });

    taskList.addEventListener('click', e => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const docId = deleteBtn.dataset.docId;
            if (confirm('Görevi silmek istediğinizden emin misiniz?')) {
                // 3. Görev SİL
                db.collection('tasks').doc(docId).delete().catch(error => console.error("Hata: Görev silinemedi: ", error));
            }
        }
    });

    taskList.addEventListener('change', e => {
        if (e.target.classList.contains('status-select')) {
            const docId = e.target.dataset.docId;
            const newStatus = e.target.value;
            // 4. Görev GÜNCELLE
            db.collection('tasks').doc(docId).update({ status: newStatus }).catch(error => console.error("Hata: Görev güncellenemedi: ", error));
        }
    });
});