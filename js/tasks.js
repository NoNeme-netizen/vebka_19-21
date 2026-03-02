// Приватное состояние задач
let tasks = [];

/**
 * Инициализация задач (замена массива)
 * @param {Array} initialTasks 
 */
export const initializeTasks = (initialTasks) => {
    tasks = [...initialTasks];
};

/**
 * Получение всех задач
 * @returns {Array}
 */
export const getTasks = () => [...tasks];

/**
 * Добавление новой задачи
 * @param {string} text 
 * @param {string} priority 
 * @returns {Object} созданная задача
 */
export const addTask = (text, priority = 'medium') => {
    const newTask = {
        id: 'local-' + Date.now(),
        title: text.trim(),
        completed: false,
        priority,
        createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    return newTask;
};

/**
 * Обновление приоритета задачи
 * @param {string|number} id 
 * @param {string} newPriority 
 */
export const updateTaskPriority = (id, newPriority) => {
    const task = tasks.find(t => t.id == id);
    if (task) task.priority = newPriority;
};

/**
 * Переключение статуса задачи (выполнено/не выполнено)
 * @param {string|number} id 
 */
export const toggleTask = (id) => {
    const task = tasks.find(t => t.id == id);
    if (task) task.completed = !task.completed;
};

/**
 * Удаление задачи по id
 * @param {string|number} id 
 */
export const removeTask = (id) => {
    tasks = tasks.filter(t => t.id != id);
};

/**
 * Удаление всех выполненных задач
 */
export const removeCompletedTasks = () => {
    tasks = tasks.filter(t => !t.completed);
};

/**
 * Получение задач по фильтру
 * @param {string} filter (all, active, completed)
 * @returns {Array}
 */
export const getFilteredTasks = (filter) => {
    switch (filter) {
        case 'active': return tasks.filter(t => !t.completed);
        case 'completed': return tasks.filter(t => t.completed);
        default: return [...tasks];
    }
};