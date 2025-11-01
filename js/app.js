// Sayfa yüklendiğinde ilk olarak giriş kontrolü yap
checkAuth();

document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const logoutButton = document.getElementById('logout-button');

    // Mümkün durumlar
    const statuses = ['Bekliyor', 'Devam Ediyor', 'Tamamlandı', 'İptal Edildi'];

    // Sayfa yüklendiğinde mevcut görevleri LocalStorage'dan yükle
    loadTasks();

    logoutButton.addEventListener('click', logout);

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const task = {
            id: Date.now(),
            name: document.getElementById('task-name').value,
            assigned: document.getElementById('assigned-to').value,
            start: document.getElementById('start-date').value,
            end: document.getElementById('end-date').value,
            status: 'Bekliyor'
        };
        addTask(task);
        renderTasks();
        taskForm.reset();
    });

    function getTasks() {
        return JSON.parse(localStorage.getItem('tasks')) || [];
    }

    function saveTasks(tasks) {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function addTask(task) {
        const tasks = getTasks();
        tasks.push(task);
        saveTasks(tasks);
    }

    function deleteTask(taskId) {
        let tasks = getTasks();
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks(tasks);
        renderTasks();
    }

    function updateTaskStatus(taskId, newStatus) {
        let tasks = getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex > -1) {
            tasks[taskIndex].status = newStatus;
            saveTasks(tasks);
            renderTasks(); // Durum değişince tabloyu yeniden çiz
        }
    }

    function renderTasks() {
        const tasks = getTasks();
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            taskList.innerHTML = '<tr><td colspan="8" class="text-center">Henüz görev eklenmemiş.</td></tr>';
            return;
        }

        tasks.forEach(task => {
            const tr = document.createElement('tr');
            
            // Tarih ve Progress Bar Hesaplamaları
            const startDate = new Date(task.start);
            const endDate = new Date(task.end);
            const today = new Date();
            
            const totalDuration = endDate - startDate;
            const elapsedDuration = today - startDate;
            let progress = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));

            // Tamamlanmış görevlerin ilerlemesi %100 olsun
            if (task.status === 'Tamamlandı') {
                progress = 100;
            }

            // Kalan gün hesaplaması
            const timeRemaining = endDate - today;
            let daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));
            let daysRemainingText = `${daysRemaining} gün`;
            if (daysRemaining < 0) {
                daysRemainingText = `<span class="badge bg-danger">Süre Doldu</span>`;
            } else if (daysRemaining === 0) {
                daysRemainingText = `<span class="badge bg-warning text-dark">Son Gün</span>`;
            } else if (task.status === 'Tamamlandı') {
                daysRemainingText = `<span class="badge bg-success">Bitti</span>`;
            }

            // Progress Bar rengi
            let progressBarColor = 'bg-primary';
            if (progress >= 100) progressBarColor = 'bg-success';
            if (daysRemaining < 0 && task.status !== 'Tamamlandı') progressBarColor = 'bg-danger';


            // Durumlar için ComboBox (select) oluşturma
            let statusOptions = statuses.map(status =>
                `<option value="${status}" ${task.status === status ? 'selected' : ''}>${status}</option>`
            ).join('');
            
            const statusSelect = `<select class="form-select form-select-sm status-select" data-id="${task.id}">${statusOptions}</select>`;

            tr.innerHTML = `
                <td>${task.name}</td>
                <td>${task.assigned}</td>
                <td>${startDate.toLocaleDateString('tr-TR')}</td>
                <td>${endDate.toLocaleDateString('tr-TR')}</td>
                <td>
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${progressBarColor}" role="progressbar" style="width: ${progress}%;" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">${Math.round(progress)}%</div>
                    </div>
                </td>
                <td class="text-center">${daysRemainingText}</td>
                <td>${statusSelect}</td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${task.id}">Sil</button>
                </td>
            `;
            taskList.appendChild(tr);
        });
    }
    
    // Olay Dinleyicileri (Event Listeners)
    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const taskId = parseInt(e.target.getAttribute('data-id'));
            if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
                deleteTask(taskId);
            }
        }
    });

    taskList.addEventListener('change', (e) => {
        if (e.target.classList.contains('status-select')) {
            const taskId = parseInt(e.target.getAttribute('data-id'));
            const newStatus = e.target.value;
            updateTaskStatus(taskId, newStatus);
        }
    });

    function loadTasks() {
        renderTasks();
    }
});
