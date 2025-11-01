checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    // Sidebar'ı doldur ve çıkış butonunu etkinleştir
    populateSidebarUser();
    document.getElementById('logout-button-sidebar').addEventListener('click', logout);
    
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');

    const statuses = ['Bekliyor', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi'];
    
    function getTasks() { return JSON.parse(localStorage.getItem('tasks')) || []; }
    function saveTasks(tasks) { localStorage.setItem('tasks', JSON.stringify(tasks)); }

    function renderTasks() {
        const tasks = getTasks();
        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = '<tr><td colspan="9" class="text-center text-muted">Henüz görev eklenmemiş.</td></tr>';
            return;
        }
        tasks.forEach(task => {
            const tr = document.createElement('tr');
            const startDate = new Date(task.start), endDate = new Date(task.end), today = new Date();
            let progress = Math.max(0, Math.min(100, ((today - startDate) / (endDate - startDate)) * 100));
            if (task.status === 'Tamamlandı' || today > endDate) progress = 100;
            
            const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            let daysRemainingText = `${daysRemaining} gün`;
            if (daysRemaining < 0) daysRemainingText = `<span class="badge bg-danger">Süre Doldu</span>`;
            else if (task.status === 'Tamamlandı') daysRemainingText = `<span class="badge bg-success">Bitti</span>`;
            
            let statusOptions = statuses.map(s => `<option value="${s}" ${task.status === s ? 'selected' : ''}>${s}</option>`).join('');
            
            tr.innerHTML = `
                <td>${task.name}</td><td>${task.assigned}</td><td>${task.createdBy || '-'}</td>
                <td>${startDate.toLocaleDateString('tr-TR')}</td><td>${endDate.toLocaleDateString('tr-TR')}</td>
                <td><div class="progress" style="height: 10px;"><div class="progress-bar" role="progressbar" style="width: ${progress}%;"></div></div></td>
                <td class="text-center">${daysRemainingText}</td>
                <td><select class="form-select form-select-sm status-select" data-id="${task.id}">${statusOptions}</select></td>
                <td><button class="btn btn-sm btn-outline-danger delete-btn" data-id="${task.id}"><i class="bi bi-trash"></i></button></td>
            `;
            taskList.appendChild(tr);
        });
    }
    
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newTask = {
            id: Date.now(),
            name: document.getElementById('task-name').value,
            assigned: document.getElementById('assigned-to').value,
            start: document.getElementById('start-date').value,
            end: document.getElementById('end-date').value,
            status: 'Bekliyor',
            createdBy: sessionStorage.getItem('loggedInUser')
        };
        const tasks = getTasks();
        tasks.push(newTask);
        saveTasks(tasks);
        renderTasks();
        taskForm.reset();
    });

    taskList.addEventListener('click', e => {
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            const taskId = parseInt(deleteBtn.dataset.id);
            if (confirm('Görevi silmek istediğinizden emin misiniz?')) {
                let tasks = getTasks();
                tasks = tasks.filter(t => t.id !== taskId);
                saveTasks(tasks);
                renderTasks();
            }
        }
    });

    taskList.addEventListener('change', e => {
        if (e.target.classList.contains('status-select')) {
            const taskId = parseInt(e.target.dataset.id);
            const newStatus = e.target.value;
            let tasks = getTasks();
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex > -1) {
                tasks[taskIndex].status = newStatus;
                saveTasks(tasks);
                renderTasks();
            }
        }
    });

    renderTasks();
});
