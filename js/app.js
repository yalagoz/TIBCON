document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');

    // Sayfa yüklendiğinde mevcut görevleri LocalStorage'dan yükle
    loadTasks();

    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Formdan değerleri al
        const taskName = document.getElementById('task-name').value;
        const assignedTo = document.getElementById('assigned-to').value;
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        // Yeni görev nesnesi oluştur
        const task = {
            id: Date.now(), // Benzersiz bir ID
            name: taskName,
            assigned: assignedTo,
            start: startDate,
            end: endDate,
            status: 'Bekliyor'
        };

        // Görevi kaydet ve listeyi güncelle
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

    function renderTasks() {
        const tasks = getTasks();
        taskList.innerHTML = ''; // Listeyi temizle

        if (tasks.length === 0) {
            taskList.innerHTML = '<tr><td colspan="6" class="text-center">Henüz görev eklenmemiş.</td></tr>';
            return;
        }

        tasks.forEach(task => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${task.name}</td>
                <td>${task.assigned}</td>
                <td>${new Date(task.start).toLocaleDateString('tr-TR')}</td>
                <td>${new Date(task.end).toLocaleDateString('tr-TR')}</td>
                <td><span class="badge bg-warning text-dark">${task.status}</span></td>
                <td>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${task.id}">Sil</button>
                </td>
            `;
            taskList.appendChild(tr);
        });
    }
    
    // Silme butonu için event listener
    taskList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const taskId = parseInt(e.target.getAttribute('data-id'));
            if (confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
                deleteTask(taskId);
            }
        }
    });

    function loadTasks() {
        renderTasks();
    }
});