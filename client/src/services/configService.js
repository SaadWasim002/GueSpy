import api from './api';

/**
 * Fetches application configurations from the backend.
 * @returns {Promise<Array<Object>>} A promise that resolves to a list of configuration objects.
 */
export const getConfigs = () => {
    // The 'api' instance from './api.js' has interceptors for auth and error handling.
    // We return the promise directly for consistency with other services,
    // so the caller should use `.then(response => response.data)` or `(await getConfigs()).data`.
    return api.get('/config/get');
};