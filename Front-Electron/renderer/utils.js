/**
 * Ejemplo de uso:
 * import { httpRequest } from './utils';
 * // GET sin token a user-api (proxy a https://spotme.jafetguzman.me/users/)
 * const data = await httpRequest({ url: '/user-api' });
 * 
 * // POST con body a user-api
 * const data = await httpRequest({
 *   url: '/user-api',
 *   method: 'POST',
 *   body: { nombre: 'item' }
 * });
 * 
 * // GET sin token a tracking-api (proxy a https://spotme.jafetguzman.me/tracking/)
 * const data = await httpRequest({ url: '/tracking-api' });
 * 
 * // POST con body a tracking-api
 * const data = await httpRequest({
 *   url: '/tracking-api',
 *   method: 'POST',
 *   body: { evento: 'login' }
 * });
 */

export async function httpRequest({ url, method = 'GET', useToken = false, body, params }) {
    // Loader global: window.setGlobalLoader(true/false)
    if (typeof window.setGlobalLoader === 'function') window.setGlobalLoader(true);

    // Agregar query params si existen
    if (params && typeof params === 'object') {
        const query = new URLSearchParams(params).toString();
        url += (url.includes('?') ? '&' : '?') + query;
    }

    let authToken = null;
    if (useToken) {
        authToken = localStorage.getItem('authToken');
    }

    const fetchHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (useToken && authToken) {
        fetchHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    const fetchOptions = {
        method,
        headers: fetchHeaders,
    };

    if (body) {
        fetchOptions.body = JSON.stringify(body);
    }
    try {
        console.log("Fetching:", url); 
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'HTTP error');
        }

        return response.json();
    } finally {
        if (typeof window.setGlobalLoader === 'function') window.setGlobalLoader(false);
    }
}