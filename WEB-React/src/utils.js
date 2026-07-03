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

    // Si hay parámetros para GET, agregarlos a la URL
    let requestUrl = url;
    if (method === 'GET' && params) {
        const searchParams = new URLSearchParams(params);
        requestUrl = `${url}?${searchParams.toString()}`;
    }

    let authToken = null;
    if (useToken) {
        authToken = localStorage.getItem('token');
    }

    const fetchHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };

    if (authToken) {
        fetchHeaders.Authorization = `Bearer ${authToken}`;
    }

    const fetchOptions = {
        method,
        headers: fetchHeaders,
    };

    if (body && method !== 'GET') {
        fetchOptions.body = JSON.stringify(body);
    }


    const response = await fetch(requestUrl, fetchOptions);

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (parseError) {
            // Si no se puede parsear como JSON, usar texto plano
            const errorText = await response.text();
            throw new Error(errorText || `HTTP error ${response.status}`);
        }
        
        // Lanzar error con los datos JSON parseados
        throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    return data;
}

// 🎯 FUNCIÓN GLOBAL PARA COMUNICACIÓN CON APP MÓVIL
window.sendAuthToMobile = function(authData) {
    try {
        if (window.webkit?.messageHandlers?.mobileAuthHandler) {
            window.webkit.messageHandlers.mobileAuthHandler.postMessage(authData);
        } else if (window.ReactNativeWebView) {
            // Para Android React Native WebView
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'AUTH_SUCCESS',
                data: authData
            }));
        } else {
            console.warn('⚠️ No se detectó interfaz de app móvil disponible');
        }
    } catch (error) {
        console.error('❌ Error enviando datos a app móvil:', error);
    }
};