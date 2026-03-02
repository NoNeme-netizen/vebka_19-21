// Ключи для хранилищ
const STORAGE_KEYS = {
    TASKS: 'todo_app_tasks',
    FILTER: 'todo_app_filter'
};

/**
 * Загрузка задач из LocalStorage
 * @returns {Array}
 */
export const loadTasks = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Ошибка загрузки из localStorage', e);
        return [];
    }
};

/**
 * Сохранение задач в LocalStorage
 * @param {Array} tasks 
 */
export const saveTasks = (tasks) => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

/**
 * Загрузка текущего фильтра из SessionStorage
 * @returns {string}
 */
export const loadFilter = () => {
    return sessionStorage.getItem(STORAGE_KEYS.FILTER) || 'all';
};

/**
 * Сохранение фильтра в SessionStorage
 * @param {string} filter 
 */
export const saveFilter = (filter) => {
    sessionStorage.setItem(STORAGE_KEYS.FILTER, filter);
};