// Базовый URL API (JSONPlaceholder)
const API_URL = 'https://jsonplaceholder.typicode.com/todos';

/**
 * GET-запрос: получение списка задач (первые 10)
 * @returns {Promise<Array>}
 */
export async function fetchTasks() {
    const response = await fetch(`${API_URL}?_limit=10`);
    if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
    }
    return await response.json();
}

/**
 * POST-запрос: создание новой задачи на сервере
 * @param {Object} task - объект задачи (title, completed, userId)
 * @returns {Promise<Object>}
 */
export async function createTask(task) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
    });
    if (!response.ok) {
        throw new Error(`Ошибка создания: ${response.status}`);
    }
    return await response.json();
}

/**
 * PATCH-запрос: частичное обновление задачи (например, статус)
 * @param {number} id - идентификатор задачи
 * @param {Object} updates - поля для обновления
 * @returns {Promise<Object>}
 */
export async function updateTask(id, updates) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
    });
    if (!response.ok) {
        throw new Error(`Ошибка обновления: ${response.status}`);
    }
    return await response.json();
}

/**
 * DELETE-запрос: удаление задачи
 * @param {number} id - идентификатор задачи
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(`Ошибка удаления: ${response.status}`);
    }
}