import { fetchTasks, createTask, updateTask, deleteTask } from './api.js';
import { 
    initializeTasks, getTasks, addTask, toggleTask, removeTask, 
    updateTaskPriority, removeCompletedTasks, getFilteredTasks 
} from './tasks.js';
import { loadTasks, saveTasks, loadFilter, saveFilter } from './storage.js';

// ===== Элементы DOM =====
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const taskList = document.getElementById('task-list');
const filterContainer = document.getElementById('filter-container');
const loadTasksBtn = document.getElementById('load-tasks-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const taskStats = document.getElementById('task-stats');

// ===== Состояние =====
let currentFilter = loadFilter();               // текущий фильтр
const savedTasks = loadTasks();                 // загрузка из LocalStorage
initializeTasks(savedTasks);                    // инициализация задач

// ===== Вспомогательная функция: сохранить и перерисовать =====
const saveAndRender = () => {
    saveTasks(getTasks());
    renderTasks();
};

// ===== Отрисовка задач =====
const renderTasks = () => {
    const tasksToRender = getFilteredTasks(currentFilter);
    taskList.innerHTML = ''; // очистка

    // Цвета для приоритетов
    const priorityColors = {
        low: 'bg-green-500',
        medium: 'bg-yellow-500',
        high: 'bg-red-500'
    };

    tasksToRender.forEach(task => {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.className = `flex items-start gap-3 p-3 border rounded-lg hover:shadow-sm transition ${task.completed ? 'completed' : ''}`;

        const priorityColor = priorityColors[task.priority] || 'bg-gray-500';

        li.innerHTML = `
            <div class="flex items-center h-6">
                <input type="checkbox" ${task.completed ? 'checked' : ''} class="task-checkbox w-5 h-5 text-blue-600">
            </div>
            <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full ${priorityColor}"></span>
                    <span class="task-text font-medium">${task.title}</span>
                </div>
                <div class="text-xs text-gray-400">ID: ${task.id}</div>
            </div>
            <button class="delete-btn text-gray-400 hover:text-red-500 transition">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        // Двойной клик для смены приоритета
        li.addEventListener('dblclick', (e) => {
            if (e.target.closest('.task-checkbox') || e.target.closest('.delete-btn')) return;
            startPriorityEdit(task, li, li.querySelector('.task-text'));
        });

        taskList.appendChild(li);
    });

    // Обновление статистики
    const all = getTasks();
    const completedCount = all.filter(t => t.completed).length;
    taskStats.textContent = `${completedCount} / ${all.length} выполнено`;

    // Обновление активной кнопки фильтра
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const filterValue = btn.dataset.filter;
        btn.classList.toggle('active', filterValue === currentFilter);
    });
};

// ===== Режим редактирования приоритета (по двойному клику) =====
const startPriorityEdit = (task, li, textElement) => {
    // Создаём select
    const select = document.createElement('select');
    select.className = 'border rounded px-2 py-1 text-sm bg-white shadow';

    const priorities = ['low', 'medium', 'high'];
    priorities.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p === 'low' ? 'Низкий' : p === 'medium' ? 'Средний' : 'Высокий';
        if (p === task.priority) option.selected = true;
        select.appendChild(option);
    });

    // Вставляем select после текста задачи
    textElement.parentNode.insertAdjacentElement('afterend', select);
    select.focus();

    // Функция сохранения
    const savePriority = () => {
        const newPriority = select.value;
        if (newPriority !== task.priority) {
            updateTaskPriority(task.id, newPriority);
            saveAndRender();

            // Если это серверная задача (числовой id) — отправляем PATCH
            if (!isNaN(parseInt(task.id))) {
                updateTask(parseInt(task.id), { priority: newPriority }).catch(console.warn);
            }
        }
        select.remove();
    };

    select.addEventListener('change', savePriority);
    select.addEventListener('blur', savePriority);
    select.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') savePriority();
    });
};

// ===== Обработчик изменения статуса (чекбокс) =====
taskList.addEventListener('change', async (e) => {
    if (!e.target.classList.contains('task-checkbox')) return;

    const li = e.target.closest('li');
    if (!li) return;

    const id = li.dataset.id;
    toggleTask(id);
    saveTasks(getTasks());

    // Обновляем статус на сервере, если задача серверная
    if (!isNaN(parseInt(id))) {
        try {
            await updateTask(parseInt(id), { completed: e.target.checked });
        } catch (err) {
            console.warn('Не удалось обновить на сервере', err);
        }
    }

    renderTasks(); // перерисовка обновит класс completed
});

// ===== Обработчик удаления задачи =====
taskList.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (!deleteBtn) return;

    const li = deleteBtn.closest('li');
    if (!li) return;

    const id = li.dataset.id;
    removeTask(id);
    saveTasks(getTasks());

    // Удаляем с сервера, если это серверная задача
    if (!isNaN(parseInt(id))) {
        try {
            await deleteTask(parseInt(id));
        } catch (err) {
            console.warn('Не удалось удалить на сервере', err);
        }
    }

    renderTasks();
});

// ===== Добавление задачи через форму =====
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const text = taskInput.value.trim();
    if (!text) return;

    const priority = prioritySelect.value;
    const newTask = addTask(text, priority);
    saveTasks(getTasks());

    // Отправляем на сервер (JSONPlaceholder вернёт задачу с числовым id)
    try {
        const created = await createTask({
            title: text,
            completed: false,
            userId: 1
        });
        // Заменяем локальный id на серверный
        newTask.id = created.id;
        saveTasks(getTasks());
    } catch (err) {
        console.warn('Задача создана локально, но не отправлена на сервер', err);
    }

    taskInput.value = '';
    prioritySelect.value = 'medium';
    renderTasks();
});

// ===== Фильтрация задач =====
filterContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const filter = btn.dataset.filter;
    if (!filter) return;

    currentFilter = filter;
    saveFilter(currentFilter);
    renderTasks();
});

// ===== Загрузка задач с сервера =====
loadTasksBtn.addEventListener('click', async () => {
    loadTasksBtn.disabled = true;
    loadTasksBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Загрузка...`;

    try {
        const serverTasks = await fetchTasks();

        // Подготовка: набор существующих текстов задач (чтобы избежать дубликатов)
        const existingTitles = new Set(
            getTasks().map(t => t.title.trim().toLowerCase())
        );

        let addedCount = 0;

        serverTasks.forEach(st => {
            const titleLower = st.title.trim().toLowerCase();
            if (!existingTitles.has(titleLower)) {
                // Добавляем как новую локальную задачу, но с серверным id
                const newTask = {
                    id: st.id,               // числовой id от сервера
                    title: st.title,
                    completed: st.completed,
                    priority: 'medium',       // по умолчанию
                    createdAt: new Date().toISOString()
                };
                // Используем addTask? нет, addTask генерирует локальный id.
                // Просто добавляем напрямую в массив.
                getTasks().push(newTask);
                existingTitles.add(titleLower);
                addedCount++;
            }
        });

        saveTasks(getTasks());
        renderTasks();

        if (addedCount > 0) {
            alert(`Загружено ${addedCount} новых задач.`);
        } else {
            alert('Новых задач не найдено (все уже есть).');
        }
    } catch (err) {
        alert('Ошибка при загрузке с сервера: ' + err.message);
    } finally {
        loadTasksBtn.disabled = false;
        loadTasksBtn.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Загрузить с сервера`;
    }
});

// ===== Очистка выполненных =====
clearCompletedBtn.addEventListener('click', () => {
    if (!confirm('Удалить все выполненные задачи?')) return;

    // Получаем список id серверных задач для удаления
    const completedServerIds = getTasks()
        .filter(t => t.completed && !isNaN(parseInt(t.id)))
        .map(t => parseInt(t.id));

    removeCompletedTasks();
    saveTasks(getTasks());
    renderTasks();

    // Удаляем на сервере (асинхронно, без ожидания)
    completedServerIds.forEach(id => {
        deleteTask(id).catch(err => console.warn(`Ошибка удаления задачи ${id}`, err));
    });
});

// ===== Инициализация приложения =====
renderTasks();
loadTasksBtn.addEventListener('click', async () => {
    console.log('1. Кнопка нажата');
    
    try {
        const serverTasks = await fetchTasks();
        console.log('2. Задачи получены:', serverTasks);
        
        console.log('3. Текущие задачи ДО:', getTasks());
        
        // ... остальной код ...
        
        console.log('4. Текущие задачи ПОСЛЕ:', getTasks());
        console.log('5. Фильтр сейчас:', currentFilter);
        
        renderTasks();
        console.log('6. Рендер выполнен');
    } catch (err) {
        console.error('ОШИБКА:', err);
    }
});