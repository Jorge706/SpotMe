import React, { useEffect, useRef, useState } from 'react';

function AuthWebView({ onAuthSuccess, shouldReset = false }) {
    const webviewRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUrl, setCurrentUrl] = useState('');
    const [debugMode, setDebugMode] = useState(false);
    const [authSuccess, setAuthSuccess] = useState(false);
    const [sessionId, setSessionId] = useState(() => Date.now()); // ID único para cada sesión

    // Manejar reset del WebView cuando se requiera
    useEffect(() => {
        if (shouldReset) {
            console.log('Reset solicitado, generando nueva sesión...');
            
            // Generar nueva sesión con ID único
            const newSessionId = Date.now();
            console.log('Generando nueva sesión:', newSessionId);
            setSessionId(newSessionId);
            
            // Resetear estados
            setAuthSuccess(false);
            setCurrentUrl('');
        }
    }, [shouldReset]);

    // Exponer función para logout desde el exterior
    useEffect(() => {
        window.logoutFromWebView = async () => {
            const webview = webviewRef.current;
            if (webview) {
                try {
                    console.log('Iniciando logout COMPLETO en WebView...');
                    
                    // Ejecutar script de limpieza rápido
                    await webview.executeJavaScript(`
                        (function() {
                            try {
                                // Limpieza básica pero efectiva
                                localStorage.clear();
                                sessionStorage.clear();
                                
                                // Limpiar cookies principales
                                document.cookie.split(";").forEach(function(c) { 
                                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                                });
                                
                                console.log('Sesión limpiada');
                                return 'CLEARED';
                                
                            } catch (error) {
                                console.error('Error en limpieza:', error);
                                return 'ERROR: ' + error.message;
                            }
                        })();
                    `);

                } catch (error) {
                    console.error('Error ejecutando script de logout:', error);
                }
            }

            // Generar nuevo ID de sesión INMEDIATAMENTE (esto recreará el WebView)
            const newSessionId = Date.now();
            console.log('Generando nueva sesión tras logout:', newSessionId);
            setSessionId(newSessionId);

            // Resetear estados locales - NO poner isLoading en true
            setAuthSuccess(false);
            setCurrentUrl('');

            console.log('Logout COMPLETO ejecutado - WebView será recreado');
        };

        return () => {
            delete window.logoutFromWebView;
        };
    }, []);

    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        console.log('Configurando WebView con sessionId:', sessionId);

        // Función para extraer el token del WebView
        const extractTokenFromWebview = async (webview) => {
            try {
                console.log('Intentando extraer token...');

                // Método 1: Buscar en localStorage
                const localStorageScript = `
                    (function() {
                        try {
                            const keys = [
                                'token', 'authToken', 'access_token', 'jwt', 
                                'bearer_token', 'auth_token', 'accessToken',
                                'user_token', 'session_token', 'login_token'
                            ];
                            
                            const roleKeys = [
                                'userRole', 'role', 'user_role', 'userType',
                                'user_type', 'account_type', 'permission_level'
                            ];

                            const userInfoKeys = [
                                'userName', 'user_name', 'username', 'name', 'fullName', 
                                'full_name', 'displayName', 'display_name', 'email',
                                'firstName', 'first_name', 'lastName', 'last_name'
                            ];
                            
                            let token = null;
                            let userRole = null;
                            let userInfo = {};
                            
                            // Buscar token
                            for (const key of keys) {
                                const value = localStorage.getItem(key);
                                if (value && value.length > 10) {
                                    token = value;
                                    break;
                                }
                            }
                            
                            // Buscar rol
                            for (const key of roleKeys) {
                                const value = localStorage.getItem(key);
                                if (value) {
                                    userRole = value;
                                    break;
                                }
                            }

                            // Buscar información del usuario
                            for (const key of userInfoKeys) {
                                const value = localStorage.getItem(key);
                                if (value) {
                                    userInfo[key] = value;
                                }
                            }
                            
                            // También buscar en objetos complejos
                            const complexKeys = ['user', 'auth', 'session', 'userData', 'currentUser', 'profile'];
                            for (const key of complexKeys) {
                                try {
                                    const value = localStorage.getItem(key);
                                    if (value) {
                                        const parsed = JSON.parse(value);
                                        if (parsed.token || parsed.access_token) {
                                            token = parsed.token || parsed.access_token;
                                        }
                                        if (parsed.role || parsed.userRole || parsed.type) {
                                            userRole = parsed.role || parsed.userRole || parsed.type;
                                        }
                                        // Extraer información del usuario del objeto
                                        if (parsed.name) userInfo.name = parsed.name;
                                        if (parsed.userName || parsed.username) userInfo.userName = parsed.userName || parsed.username;
                                        if (parsed.firstName) userInfo.firstName = parsed.firstName;
                                        if (parsed.lastName) userInfo.lastName = parsed.lastName;
                                        if (parsed.email) userInfo.email = parsed.email;
                                        if (parsed.fullName) userInfo.fullName = parsed.fullName;
                                        if (parsed.displayName) userInfo.displayName = parsed.displayName;
                                    }
                                } catch (e) {}
                            }
                            
                            return { 
                                token, 
                                userRole, 
                                userInfo,
                                storage: 'localStorage',
                                allKeys: Object.keys(localStorage)
                            };
                        } catch (error) {
                            return { error: error.message };
                        }
                    })();
                `;
                
                const storageResult = await webview.executeJavaScript(localStorageScript);
                console.log('localStorage result:', storageResult);
                
                if (storageResult.token) {
                    handleTokenFound(storageResult.token, storageResult.userRole, storageResult.userInfo, 'localStorage');
                    return;
                }

                // Método 2: Buscar en sessionStorage
                const sessionStorageScript = localStorageScript.replace(/localStorage/g, 'sessionStorage');
                const sessionResult = await webview.executeJavaScript(sessionStorageScript);
                console.log('sessionStorage result:', sessionResult);
                
                if (sessionResult.token) {
                    handleTokenFound(sessionResult.token, sessionResult.userRole, sessionResult.userInfo, 'sessionStorage');
                    return;
                }

                // Método 3: Buscar en cookies
                const cookieScript = `
                    (function() {
                        try {
                            const cookies = document.cookie.split(';');
                            let token = null;
                            let userRole = null;
                            let userInfo = {};
                            
                            const tokenNames = ['token', 'authToken', 'access_token', 'jwt', 'auth'];
                            const roleNames = ['role', 'userRole', 'type', 'userType'];
                            const userNames = ['userName', 'user_name', 'name', 'email', 'fullName'];
                            
                            cookies.forEach(cookie => {
                                const [name, value] = cookie.trim().split('=');
                                if (tokenNames.some(tn => name.includes(tn)) && value && value.length > 10) {
                                    token = decodeURIComponent(value);
                                }
                                if (roleNames.some(rn => name.includes(rn)) && value) {
                                    userRole = decodeURIComponent(value);
                                }
                                if (userNames.some(un => name.includes(un)) && value) {
                                    userInfo[name] = decodeURIComponent(value);
                                }
                            });
                            
                            return { 
                                token, 
                                userRole, 
                                userInfo,
                                storage: 'cookies',
                                allCookies: document.cookie
                            };
                        } catch (error) {
                            return { error: error.message };
                        }
                    })();
                `;
                
                const cookieResult = await webview.executeJavaScript(cookieScript);
                console.log('Cookie result:', cookieResult);
                
                if (cookieResult.token) {
                    handleTokenFound(cookieResult.token, cookieResult.userRole, cookieResult.userInfo, 'cookies');
                    return;
                }

                // Método 4: Buscar en el DOM y en la página
                const domScript = `
                    (function() {
                        try {
                            let token = null;
                            let userRole = null;
                            let userInfo = {};
                            
                            // Buscar en elementos con data attributes
                            const tokenElement = document.querySelector('[data-token]') || 
                                               document.querySelector('[data-auth-token]') ||
                                               document.querySelector('#token') ||
                                               document.querySelector('.token');
                            
                            const roleElement = document.querySelector('[data-role]') || 
                                              document.querySelector('[data-user-role]') ||
                                              document.querySelector('#role') ||
                                              document.querySelector('.role');

                            const nameElement = document.querySelector('[data-name]') ||
                                              document.querySelector('[data-user-name]') ||
                                              document.querySelector('#userName') ||
                                              document.querySelector('.user-name');
                            
                            if (tokenElement) {
                                token = tokenElement.dataset.token || 
                                       tokenElement.dataset.authToken ||
                                       tokenElement.value || 
                                       tokenElement.textContent;
                            }
                            
                            if (roleElement) {
                                userRole = roleElement.dataset.role || 
                                          roleElement.dataset.userRole ||
                                          roleElement.value || 
                                          roleElement.textContent;
                            }

                            if (nameElement) {
                                userInfo.name = nameElement.dataset.name ||
                                               nameElement.dataset.userName ||
                                               nameElement.value ||
                                               nameElement.textContent;
                            }
                            
                            // Buscar en el texto de la página por patrones comunes
                            const pageText = document.body.textContent || document.body.innerText;
                            const tokenMatch = pageText.match(/(?:token|auth)["']?:\\s*["']([A-Za-z0-9_-]{20,})["']/i);
                            const roleMatch = pageText.match(/(?:role|type)["']?:\\s*["'](admin|administrator|user|guest)["']/i);
                            const nameMatch = pageText.match(/(?:name|userName|user_name)["']?:\\s*["']([^"']+)["']/i);
                            
                            if (tokenMatch && !token) {
                                token = tokenMatch[1];
                            }
                            
                            if (roleMatch && !userRole) {
                                userRole = roleMatch[1];
                            }

                            if (nameMatch && !userInfo.name) {
                                userInfo.name = nameMatch[1];
                            }
                            
                            return { 
                                token, 
                                userRole, 
                                userInfo,
                                storage: 'DOM',
                                url: window.location.href,
                                title: document.title
                            };
                        } catch (error) {
                            return { error: error.message };
                        }
                    })();
                `;
                
                const domResult = await webview.executeJavaScript(domScript);
                console.log('DOM result:', domResult);
                
                if (domResult.token) {
                    handleTokenFound(domResult.token, domResult.userRole, domResult.userInfo, 'DOM');
                    return;
                }

                console.log('No se encontró token en ninguna ubicación');

            } catch (error) {
                console.error('Error extracting token:', error);
            }
        };

        // Función que maneja cuando se encuentra un token
        const handleTokenFound = (token, userRole, userInfo, source) => {
            console.log(`Token encontrado en ${source}:`, { 
                token: token?.substring(0, 20) + '...', 
                userRole,
                userInfo 
            });
            
            // Crear un nombre para mostrar basado en la información disponible
            let displayName = 'Usuario';
            if (userInfo) {
                displayName = userInfo.fullName || 
                             userInfo.displayName || 
                             userInfo.name ||
                             (userInfo.firstName && userInfo.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : '') ||
                             userInfo.userName ||
                             userInfo.email ||
                             'Usuario';
            }
            
            // Verificar si el usuario es administrador
            const isAdmin = userRole && (
                userRole.toLowerCase().includes('admin') || 
                userRole.toLowerCase().includes('administrador') ||
                userRole.toLowerCase() === 'admin' ||
                userRole === 'administrator' ||
                userRole.toLowerCase() === 'superuser'
            );
            
            // Para desarrollo, permitir cualquier rol si no se encuentra uno específico
            const allowAccess = isAdmin || !userRole || userRole.toLowerCase() === 'user';
            
            if (allowAccess) {
                // Almacenar el token para uso en la aplicación
                localStorage.setItem('authToken', token);
                if (userRole) {
                    localStorage.setItem('userRole', userRole);
                }
                if (userInfo) {
                    localStorage.setItem('userInfo', JSON.stringify(userInfo));
                }
                localStorage.setItem('displayName', displayName);
                
                console.log('Acceso permitido, redirigiendo al dashboard...');
                
                // Mostrar mensaje de éxito antes de cerrar
                setAuthSuccess(true);
                setIsLoading(true);
                
                // Pequeño delay para que el usuario vea que fue exitoso
                setTimeout(() => {
                    onAuthSuccess(token, userRole || 'admin', displayName, userInfo);
                }, 1500);
                
            } else {
                console.warn('Usuario no tiene permisos de administrador:', userRole);
                alert('Esta aplicación está disponible solo para usuarios administradores.');
            }
        };

        // Event listeners para el WebView
        const handleDomReady = () => {
            console.log('WebView DOM ready - sessionId:', sessionId);
            setIsLoading(false);
            
            // Verificar inmediatamente si ya hay un token
            setTimeout(() => {
                extractTokenFromWebview(webview);
            }, 2000);
        };

        const handleDidNavigate = (event) => {
            const url = event.url || webview.getURL();
            console.log('WebView navigated to:', url);
            setCurrentUrl(url);
            
            // Verificar inmediatamente si la URL indica éxito en la autenticación
            if (url.includes('dashboard') || url.includes('success') || url.includes('home') || url.includes('admin')) {
                console.log('URL de éxito detectada, verificando token...');
                setTimeout(() => {
                    extractTokenFromWebview(webview);
                }, 500);
            } else {
                // Verificar token después de navegación normal
                setTimeout(() => {
                    extractTokenFromWebview(webview);
                }, 1500);
            }
        };

        const handleDidNavigateInPage = (event) => {
            const url = event.url || webview.getURL();
            console.log('WebView navigated in page to:', url);
            setCurrentUrl(url);
            
            // Verificar inmediatamente si la URL indica éxito en la autenticación
            if (url.includes('dashboard') || url.includes('success') || url.includes('home') || url.includes('admin') || url.includes('verification')) {
                console.log('URL importante detectada, verificando token inmediatamente...');
                setTimeout(() => {
                    extractTokenFromWebview(webview);
                }, 200);
            } else {
                // Verificar token en navegaciones SPA
                setTimeout(() => {
                    extractTokenFromWebview(webview);
                }, 1000);
            }
        };

        const handleDidFinishLoad = () => {
            console.log('WebView finished loading');
            setTimeout(() => {
                extractTokenFromWebview(webview);
            }, 1000);
            
            // Verificar periódicamente si estamos en una página post-autenticación
            const currentURL = webview.getURL();
            if (currentURL && (currentURL.includes('dashboard') || currentURL.includes('admin') || currentURL.includes('home'))) {
                console.log('Página post-autenticación detectada, verificando tokens con mayor frecuencia...');
                
                // Verificar cada 2 segundos durante 10 segundos
                let attempts = 0;
                const maxAttempts = 5;
                const checkInterval = setInterval(() => {
                    attempts++;
                    extractTokenFromWebview(webview);
                    
                    if (attempts >= maxAttempts) {
                        clearInterval(checkInterval);
                    }
                }, 2000);
            }
        };

        // Agregar event listeners
        webview.addEventListener('dom-ready', handleDomReady);
        webview.addEventListener('did-navigate', handleDidNavigate);
        webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
        webview.addEventListener('did-finish-load', handleDidFinishLoad);

        // Limpiar event listeners al desmontar
        return () => {
            if (webview) {
                webview.removeEventListener('dom-ready', handleDomReady);
                webview.removeEventListener('did-navigate', handleDidNavigate);
                webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
                webview.removeEventListener('did-finish-load', handleDidFinishLoad);
            }
        };
    }, [onAuthSuccess, sessionId]); // Agregar sessionId como dependencia

    // Función para testing manual
    const testToken = () => {
        const testTokenValue = 'test-admin-token-' + Date.now();
        const testUserInfo = {
            name: 'Usuario de Prueba',
            email: 'test@spotme.com'
        };
        handleTokenFound(testTokenValue, 'admin', testUserInfo, 'manual-test');
    };

    const handleTokenFound = (token, userRole, userInfo, source) => {
        // Crear un nombre para mostrar basado en la información disponible
        let displayName = 'Usuario';
        if (userInfo) {
            displayName = userInfo.fullName || 
                         userInfo.displayName || 
                         userInfo.name ||
                         (userInfo.firstName && userInfo.lastName ? `${userInfo.firstName} ${userInfo.lastName}` : '') ||
                         userInfo.userName ||
                         userInfo.email ||
                         'Usuario';
        }

        localStorage.setItem('authToken', token);
        if (userRole) {
            localStorage.setItem('userRole', userRole);
        }
        if (userInfo) {
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        }
        localStorage.setItem('displayName', displayName);
        
        onAuthSuccess(token, userRole || 'admin', displayName, userInfo);
    };

    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
            {/* Solo mostrar overlay durante autenticación exitosa */}
            {authSuccess && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 178, 202, 0.3)', // lower opacity for glass effect
                    backdropFilter: 'blur(50px)',         // glass blur
                    WebkitBackdropFilter: 'blur(50px)',   // Safari support
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '18px',
                    zIndex: 1000
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        ¡Autenticación exitosa!
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                        Redirigiendo al dashboard...
                    </div>
                    <div style={{ 
                        marginTop: '20px', 
                        fontSize: '30px'
                    }}>
                        ✓
                    </div>
                </div>
            )}
            
            {/* Panel de debug (solo en desarrollo) */}
            {debugMode && (
                <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    zIndex: 1001,
                    maxWidth: '350px'
                }}>
                    <div><strong>URL:</strong> {currentUrl}</div>
                    <div><strong>Estado:</strong> {
                        authSuccess ? 'Autenticado' : 'No autenticado'
                    }</div>
                    <div><strong>Reset solicitado:</strong> {shouldReset ? 'Sí' : 'No'}</div>
                    <div><strong>Sesión ID:</strong> {sessionId}</div>
                    <div style={{ marginTop: '10px' }}>
                        <button 
                            onClick={testToken}
                            style={{
                                marginRight: '5px',
                                padding: '5px 10px',
                                backgroundColor: '#00B2CA',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}
                        >
                            Test Login
                        </button>
                        <button 
                            onClick={() => {
                                const webview = webviewRef.current;
                                if (webview) extractTokenFromWebview(webview);
                            }}
                            style={{
                                padding: '5px 10px',
                                backgroundColor: '#FF6B6B',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '11px'
                            }}
                        >
                            Check Token
                        </button>
                    </div>
                    <div style={{ fontSize: '10px', marginTop: '5px', opacity: 0.7 }}>
                        Tip: Después de la verificación, haz clic en "Check Token"
                    </div>
                </div>
            )}

            {/* Botón para activar modo debug */}
            <button
                onClick={() => setDebugMode(!debugMode)}
                style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    border: 'none',
                    padding: '5px 10px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    zIndex: 1001,
                    fontSize: '12px'
                }}
            >
                Debug
            </button>

            <webview
                key={sessionId} // Esto forzará un remontaje completo cuando cambie sessionId
                ref={webviewRef}
                src="https://spotme.jafetguzman.me"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                }}
                allowpopups="true"
                nodeintegration="false"
                webpreferences="contextIsolation=false,nodeIntegration=false,webSecurity=false,allowRunningInsecureContent=true"
                useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                partition={`persist:spotme-session-${sessionId}`}
            />
        </div>
    );
}

export default AuthWebView;
