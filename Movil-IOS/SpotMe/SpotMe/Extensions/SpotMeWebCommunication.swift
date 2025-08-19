//
//  SpotMeWebCommunication.swift
//  SpotMe
//
//  Created by System on 06/08/25.
//

import Foundation
import WebKit

// MARK: - Web Communication Protocol
protocol SpotMeWebCommunicationDelegate: AnyObject {
    func didReceiveAuthSuccess(authData: [String: Any])
    func didReceiveLogoutRequest()
    func didReceivePasswordChangeComplete()
    func didReceiveRouteChange(route: String)
    func didReceiveSPAStateUpdate(state: [String: Any])
}

// MARK: - Web Communication Manager
class SpotMeWebCommunicationManager: NSObject {
    
    weak var delegate: SpotMeWebCommunicationDelegate?
    
    // MARK: - JavaScript Injection
    static func getJavaScriptCode() -> String {
        return """
        // Configurar la comunicación con la app nativa iOS para SPA
        window.webkit = window.webkit || {};
        window.webkit.messageHandlers = window.webkit.messageHandlers || {};
        
        // Variables de control para SPA
        window.SpotMeMobile = {
            isConfigured: false,
            currentRoute: '',
            authState: null
        };
        
        // Función para enviar mensajes a iOS de manera segura
        window.sendToiOS = function(type, data = {}) {
            try {
                if (window.webkit.messageHandlers && window.webkit.messageHandlers.mobileAuthHandler) {
                    console.log('📱➡️ [SPA] Enviando a iOS:', type, data);
                    window.webkit.messageHandlers.mobileAuthHandler.postMessage({
                        type: type,
                        data: data,
                        timestamp: Date.now(),
                        route: window.location.hash || window.location.pathname
                    });
                }
            } catch (error) {
                console.error('❌ Error enviando mensaje a iOS:', error);
            }
        };
        
        // Función para enviar datos de autenticación a la app nativa
        window.sendAuthToMobile = function(authData) {
            console.log('📱 [SPA] Enviando datos de auth a iOS:', authData);
            window.SpotMeMobile.authState = authData;
            window.sendToiOS('AUTH_SUCCESS', authData);
        };
        
        // Función para solicitar logout
        window.requestLogoutFromMobile = function() {
            console.log('📱 [SPA] Solicitando logout a iOS');
            window.SpotMeMobile.authState = null;
            window.sendToiOS('LOGOUT_REQUEST');
        };
        
        // Función para notificar cambio de contraseña completado
        window.notifyPasswordChangeComplete = function() {
            console.log('📱 [SPA] Notificando cambio de contraseña completado');
            window.sendToiOS('PASSWORD_CHANGE_COMPLETE');
        };
        
        // Función para notificar cambios de ruta en SPA
        window.notifyRouteChange = function(newRoute) {
            console.log('📱 [SPA] Cambio de ruta detectado:', newRoute);
            window.SpotMeMobile.currentRoute = newRoute;
            window.sendToiOS('ROUTE_CHANGE', { route: newRoute });
            
            // Si navegamos a password-manager, activar detección de cambio de contraseña
            if (newRoute.includes('/password-manager')) {
                console.log('🔐 [PWD] Navegación a password-manager detectada, activando detección...');
                setTimeout(() => {
                    window.detectPasswordChangeSuccess();
                }, 1000);
            }
        };
        
        // Función para verificar si está en app móvil
        window.isInMobileApp = function() {
            return !!(window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.mobileAuthHandler);
        };
        
        // Función para reportar estado actual de la SPA
        window.reportSPAState = function() {
            const state = {
                route: window.location.hash || window.location.pathname,
                isAuthenticated: !!window.SpotMeMobile.authState,
                authData: window.SpotMeMobile.authState,
                timestamp: Date.now()
            };
            console.log('📱 [SPA] Reportando estado:', state);
            window.sendToiOS('SPA_STATE_UPDATE', state);
        };
        
        // Configurar monitoreo de cambios de ruta para SPA
        window.setupSPAMonitoring = function() {
            if (window.SpotMeMobile.isConfigured) return;
            
            console.log('📱 [SPA] Configurando monitoreo de SPA...');
            
            // Monitorear cambios en el hash (React Router hash mode)
            window.addEventListener('hashchange', function(event) {
                const newRoute = window.location.hash;
                console.log('📱 [SPA] Hash cambió:', newRoute);
                window.notifyRouteChange(newRoute);
            });
            
            // Monitorear cambios en el historial (React Router browser mode)
            const originalPushState = history.pushState;
            const originalReplaceState = history.replaceState;
            
            history.pushState = function() {
                originalPushState.apply(history, arguments);
                setTimeout(() => {
                    const newRoute = window.location.pathname + window.location.search;
                    console.log('📱 [SPA] PushState cambió:', newRoute);
                    window.notifyRouteChange(newRoute);
                }, 100);
            };
            
            history.replaceState = function() {
                originalReplaceState.apply(history, arguments);
                setTimeout(() => {
                    const newRoute = window.location.pathname + window.location.search;
                    console.log('📱 [SPA] ReplaceState cambió:', newRoute);
                    window.notifyRouteChange(newRoute);
                }, 100);
            };
            
            // Monitorear botón atrás/adelante
            window.addEventListener('popstate', function(event) {
                setTimeout(() => {
                    const newRoute = window.location.pathname + window.location.search + window.location.hash;
                    console.log('📱 [SPA] PopState cambió:', newRoute);
                    window.notifyRouteChange(newRoute);
                }, 100);
            });
            
            window.SpotMeMobile.isConfigured = true;
            console.log('✅ [SPA] Monitoreo configurado exitosamente');
        };
        
        // Función para decodificar JWT token y extraer datos del usuario
        window.decodeJWT = function(token) {
            try {
                // Un JWT tiene 3 partes separadas por puntos: header.payload.signature
                const parts = token.split('.');
                if (parts.length !== 3) {
                    console.log('❌ [JWT] Token inválido - no tiene 3 partes');
                    return null;
                }
                
                // Decodificar la segunda parte (payload)
                const payload = parts[1];
                
                // Agregar padding si es necesario
                const paddedPayload = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
                
                // Decodificar base64
                const decodedPayload = atob(paddedPayload);
                
                // Parsear JSON
                const userInfo = JSON.parse(decodedPayload);
                console.log('🔓 [JWT] Token decodificado:', userInfo);
                
                return userInfo;
            } catch (error) {
                console.log('❌ [JWT] Error decodificando token:', error);
                return null;
            }
        };
        
        // Función para detectar login exitoso automáticamente
        window.detectSuccessfulLogin = function() {
            console.log('🔍 [AUTH] Iniciando detección de login exitoso...');
            
            // DESHABILITADO TEMPORALMENTE: No ejecutar detección automática durante inicio de app
            // Para evitar alerts automáticos no deseados
            console.log('⚠️ [AUTH] Detección automática DESHABILITADA para evitar alerts no deseados');
            return;
            
            // Esperar 30 segundos antes de comenzar la detección automática para evitar falsos positivos
            setTimeout(() => {
                console.log('🔍 [AUTH] Iniciando detección automática después del período de gracia extendido...');
                
                // Método 1: Verificar token en localStorage cada 5 segundos (menos frecuente)
                const checkAuthInterval = setInterval(() => {
                    const token = localStorage.getItem('token') || 
                                 localStorage.getItem('auth_token') || 
                                 localStorage.getItem('access_token');
                    const user = localStorage.getItem('user') || 
                                localStorage.getItem('userData');
                    
                    if (token && token !== 'null') {
                        console.log('✅ [AUTH] Login exitoso detectado automáticamente!');
                        clearInterval(checkAuthInterval);
                        
                        try {
                            // Primero intentar decodificar el JWT para obtener información del usuario
                            let userData = {};
                            let userRole = '';
                        let userId = '';
                        
                        // Decodificar JWT token
                        const jwtData = window.decodeJWT(token);
                        if (jwtData) {
                            console.log('🔓 [AUTH] JWT decodificado exitosamente');
                            
                            // Extraer datos del JWT
                            userId = jwtData.sub || jwtData.user_id || jwtData.id || '';
                            userRole = jwtData.role || jwtData.tipo || jwtData.user_role || jwtData.scope || '';
                            
                            // Si el JWT contiene el rol, úsalo
                            if (userRole) {
                                console.log('✅ [AUTH] Rol encontrado en JWT:', userRole);
                            }
                        }
                        
                        // Intentar parsear datos de usuario del localStorage
                        if (user && user !== 'null') {
                            try {
                                const localUserData = JSON.parse(user);
                                userData = localUserData;
                                
                                // Si no tenemos rol del JWT, intentar obtenerlo del localStorage
                                if (!userRole) {
                                    userRole = userData.role || userData.tipo || userData.user_role || '';
                                }
                            } catch (e) {
                                console.log('❌ [AUTH] Error parseando user data del localStorage:', e);
                            }
                        }
                        
                        // Si no encontramos el role en ningún lado, buscar en otras ubicaciones del localStorage
                        if (!userRole) {
                            userRole = localStorage.getItem('role') || 
                                      localStorage.getItem('user_role') || 
                                      localStorage.getItem('tipo_usuario') || '';
                        }
                        
                        // Construir datos completos del usuario
                        const completeUserData = {
                            id: userId || userData.id || userData.user_id || 'unknown',
                            name: userData.name || userData.nombre || 'Usuario',
                            email: userData.email || 'unknown',
                            role: userRole || 'conductor' // Fallback a conductor si no se encuentra
                        };
                        
                        console.log('👤 [AUTH] Datos finales del usuario:', completeUserData);
                        console.log('📱 [AUTH] Enviando AUTH_SUCCESS a iOS');
                        
                        window.webkit.messageHandlers.mobileAuthHandler.postMessage({
                            type: 'AUTH_SUCCESS',
                            token: token,
                            user: completeUserData,
                            source: 'auto_detection_jwt',
                            timestamp: Date.now(),
                            route: window.location.hash || window.location.pathname
                        });
                        
                        // Mostrar el modal de éxito
                        if (window.showMobileSuccessModal) {
                            window.showMobileSuccessModal();
                        }
                        
                        // Si aún no tenemos role, hacer una petición para obtener datos del usuario
                        if (!userRole && token) {
                            console.log('� [AUTH] Intentando obtener role del usuario con token...');
                            
                            // Hacer petición para obtener datos del usuario
                            fetch('/user-api/user', {
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'Content-Type': 'application/json'
                                }
                            })
                            .then(response => response.json())
                            .then(userResponse => {
                                console.log('👤 [AUTH] Respuesta del usuario:', userResponse);
                                
                                const finalUserData = {
                                    id: userResponse.id || userResponse.user_id || userData.id,
                                    name: userResponse.name || userResponse.nombre || userData.name || 'Usuario',
                                    email: userResponse.email || userData.email,
                                    role: userResponse.role || userResponse.tipo || userResponse.user_role || 'conductor'
                                };
                                
                                console.log('�📱 [AUTH] Enviando AUTH_SUCCESS con datos completos a iOS');
                                
                                window.webkit.messageHandlers.mobileAuthHandler.postMessage({
                                    type: 'AUTH_SUCCESS',
                                    token: token,
                                    user: finalUserData,
                                    source: 'auto_detection_with_api',
                                    timestamp: Date.now(),
                                    route: window.location.hash || window.location.pathname
                                });
                            })
                            .catch(error => {
                                console.log('❌ [AUTH] Error obteniendo datos del usuario, usando datos básicos:', error);
                                
                                // Enviar con datos básicos y role por defecto
                                const basicUserData = {
                                    id: userData.id || userData.user_id || 'unknown',
                                    name: userData.name || userData.nombre || 'Usuario',
                                    email: userData.email || 'unknown',
                                    role: 'conductor' // Role por defecto
                                };
                                
                                console.log('📱 [AUTH] Enviando AUTH_SUCCESS con datos básicos a iOS');
                                
                                window.webkit.messageHandlers.mobileAuthHandler.postMessage({
                                    type: 'AUTH_SUCCESS',
                                    token: token,
                                    user: basicUserData,
                                    source: 'auto_detection_basic',
                                    timestamp: Date.now(),
                                    route: window.location.hash || window.location.pathname
                                });
                            });
                        } else {
                            // Tenemos role, enviar directamente
                            const completeUserData = {
                                id: userData.id || userData.user_id || 'unknown',
                                name: userData.name || userData.nombre || 'Usuario',
                                email: userData.email || 'unknown',
                                role: userRole
                            };
                            
                            console.log('📱 [AUTH] Enviando AUTH_SUCCESS directo a iOS');
                            
                            window.webkit.messageHandlers.mobileAuthHandler.postMessage({
                                type: 'AUTH_SUCCESS',
                                token: token,
                                user: completeUserData,
                                source: 'auto_detection_direct',
                                timestamp: Date.now(),
                                route: window.location.hash || window.location.pathname
                            });
                        }
                        
                        // Mostrar el modal de éxito
                        if (window.showMobileSuccessModal) {
                            window.showMobileSuccessModal();
                        }
                        
                    } catch (e) {
                        console.log('❌ [AUTH] Error general procesando datos de usuario:', e);
                    }
                }
                }, 5000); // Verificar cada 5 segundos (menos frecuente)
                
                // Limpiar el interval después de 30 segundos para evitar checks infinitos
                setTimeout(() => {
                    clearInterval(checkAuthInterval);
                    console.log('🕒 [AUTH] Timeout de detección alcanzado');
                }, 30000);
                
            }, 30000); // Esperar 30 segundos antes de iniciar detección automática
        };        // Función para mostrar modal de éxito (para reemplazar el modal web)
        window.showMobileSuccessModal = function() {
            console.log('📱 [AUTH] Mostrando modal de login exitoso...');
            
            // Crear overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: flex;
                justify-content: center;
                align-items: center;
            `;
            
            // Crear modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                background: #1a1a2e;
                border-radius: 15px;
                padding: 30px;
                text-align: center;
                color: white;
                max-width: 300px;
                width: 90%;
                box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            `;
            
            modal.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 15px;">¡Login exitoso!</div>
                <div style="font-size: 16px; margin-bottom: 25px; opacity: 0.8;">Regresando a la app...</div>
                <button id="acceptBtn" style="
                    background: #00d4aa;
                    color: white;
                    border: none;
                    padding: 12px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    width: 100%;
                ">Aceptar</button>
            `;
            
            overlay.appendChild(modal);
            document.body.appendChild(overlay);
            
            // Manejar click del botón
            document.getElementById('acceptBtn').onclick = function() {
                document.body.removeChild(overlay);
                console.log('📱 [AUTH] Usuario presionó Aceptar en modal web');
            };
        };
        
        // Configurar cuando el DOM esté listo
        function initializeSpotMeMobile() {
            console.log('📱 [SPA] Inicializando SpotMe Mobile...');
            
            // Configurar monitoreo
            window.setupSPAMonitoring();
            
            // DESHABILITADO: No iniciar detección automática de login 
            // para evitar alerts automáticos no deseados
            console.log('⚠️ [AUTH] Detección automática de login DESHABILITADA en inicialización');
            
            // Configurar detección de cambio de contraseña si estamos en password-manager
            if (window.location.pathname.includes('/password-manager') || 
                window.location.href.includes('/password-manager')) {
                console.log('🔐 [PWD] Página de password-manager detectada, configurando detección...');
                window.detectPasswordChangeSuccess();
            }
            
            // Reportar estado inicial
            setTimeout(() => {
                window.reportSPAState();
            }, 1000);
            
            // Notificar que la app móvil está lista
            window.sendToiOS('MOBILE_APP_READY', {
                userAgent: navigator.userAgent,
                initialRoute: window.location.href
            });
            
            console.log('✅ [SPA] SpotMe Mobile inicializado');
        }
        
        // Ejecutar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeSpotMeMobile);
        } else {
            initializeSpotMeMobile();
        }
        
        // También ejecutar después de un delay para asegurar que React esté cargado
        setTimeout(initializeSpotMeMobile, 2000);
        
        console.log('📱 [SPA] SpotMe iOS WebView handlers configurados para SPA');
        """
    }
    
    // MARK: - WebView Configuration
    static func configureWebView(_ webView: WKWebView, delegate: SpotMeWebCommunicationDelegate) -> SpotMeWebCommunicationManager {
        let manager = SpotMeWebCommunicationManager()
        manager.delegate = delegate
        
        let contentController = WKUserContentController()
        contentController.add(manager, name: "mobileAuthHandler")
        
        let userScript = WKUserScript(
            source: getJavaScriptCode(),
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        contentController.addUserScript(userScript)
        
        // Crear nueva configuración para asegurar que se aplique
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.preferences.javaScriptEnabled = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        
        // Si el WebView ya tiene una configuración, necesitamos recrearlo
        // o actualizar su configuración actual
        if let existingController = webView.configuration.userContentController as? WKUserContentController {
            // Limpiar scripts existentes
            existingController.removeAllUserScripts()
            
            // Remover handlers existentes para evitar duplicados
            existingController.removeScriptMessageHandler(forName: "mobileAuthHandler")
            
            // Agregar el nuevo handler y script
            existingController.add(manager, name: "mobileAuthHandler")
            existingController.addUserScript(userScript)
        } else {
            // print("⚠️ [WEBVIEW] No se pudo actualizar configuración existente")
        }
        
        return manager
    }
}

// MARK: - WKScriptMessageHandler Implementation
extension SpotMeWebCommunicationManager: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        // Agregar logging más detallado para debug
        Foundation.NSLog("📨 [WEB] Mensaje recibido: \(message.name)")
        Foundation.NSLog("📦 [WEB] Contenido: \(message.body)")
        
        guard message.name == "mobileAuthHandler",
              let messageBody = message.body as? [String: Any] else {
            Foundation.NSLog("❌ [WEB] Mensaje inválido o nombre incorrecto")
            return
        }
        
        // Verificar si es un mensaje de login exitoso sin type (probablemente desde el web app)
        if let accessToken = messageBody["access_token"] as? String, messageBody["type"] == nil {
            Foundation.NSLog("🔍 [AUTH] Detectado mensaje de login exitoso sin type con token válido")
            
            // Extraer información básica del mensaje
            var userData: [String: Any] = [:]
            if let email = messageBody["email"] as? String {
                userData["email"] = email
            }
            if let userId = messageBody["user_id"] {
                userData["id"] = userId
            }
            
            // Hacer llamada a la API para obtener información completa del usuario
            fetchUserDataWithToken(accessToken) { [weak self] fetchedUserData in
                DispatchQueue.main.async {
                    var finalUserData = userData
                    
                        // Combinar datos del mensaje con datos de la API
                            if let fetchedData = fetchedUserData {
                                Foundation.NSLog("✅ [AUTH] Datos del usuario obtenidos de la API: \(fetchedData)")                            // Copiar todos los datos de la API
                            for (key, value) in fetchedData {
                                finalUserData[key] = value
                            }
                        } else {
                            Foundation.NSLog("❌ [AUTH] No se pudieron obtener datos del usuario de la API")
                            // NO asignar rol por defecto - dejar que la validación posterior maneje esto
                        }
                    
                    let authData: [String: Any] = [
                        "token": accessToken,
                        "user": finalUserData
                    ]
                    
                    Foundation.NSLog("📦 [AUTH] Datos finales construidos desde mensaje sin type: \(authData)")
                    
                    self?.delegate?.didReceiveAuthSuccess(authData: authData)
                    Foundation.NSLog("✅ [AUTH] Delegado notificado con datos completos desde mensaje sin type")
                }
            }
            return
        }
        
        let messageType = messageBody["type"] as? String ?? "unknown"
        _ = messageBody["route"] as? String ?? "unknown"
        Foundation.NSLog("🗺️ [WEB] Tipo de mensaje: \(messageType)")
        
        // Solo mostrar logs para mensajes importantes
        switch messageType {
        case "AUTH_SUCCESS":
            Foundation.NSLog("✅ [AUTH] Autenticación exitosa recibida")
            _ = messageBody["source"] as? String ?? "unknown"
            Foundation.NSLog("📍 [AUTH] Fuente: \(messageBody["source"] ?? "unknown")")
            Foundation.NSLog("🔍 [AUTH] MessageBody completo: \(messageBody)")
            
            // FILTRO CRÍTICO: Verificar que tengamos datos válidos antes de procesar
            var hasValidToken = false
            var hasValidUser = false
            
            // Verificar token
            if let token = messageBody["token"] as? String, !token.isEmpty && token != "null" {
                hasValidToken = true
            } else if let accessToken = messageBody["access_token"] as? String, !accessToken.isEmpty && accessToken != "null" {
                hasValidToken = true
            }
            
            // Verificar datos de usuario
            if let user = messageBody["user"] as? [String: Any], !user.isEmpty {
                hasValidUser = true
            } else if let data = messageBody["data"] as? [String: Any], !data.isEmpty {
                hasValidUser = true
            }
            
            // RECHAZAR mensajes AUTH_SUCCESS sin datos válidos
            if !hasValidToken && !hasValidUser {
                Foundation.NSLog("🚫 [AUTH] Rechazando AUTH_SUCCESS sin token ni datos de usuario válidos")
                Foundation.NSLog("🔍 [AUTH] Token presente: \(messageBody["token"] != nil), AccessToken presente: \(messageBody["access_token"] != nil)")
                Foundation.NSLog("🔍 [AUTH] User presente: \(messageBody["user"] != nil), Data presente: \(messageBody["data"] != nil)")
                return
            }
            
            // Extraer datos de auth directamente del mensaje o del data object
            var authData: [String: Any] = [:]
            
            if let data = messageBody["data"] as? [String: Any] {
                authData = data
                // print("📦 [AUTH] Datos extraídos de 'data': \(data)")
            } else if let token = messageBody["token"] as? String {
                // Si tenemos token pero NO datos de usuario, hacer petición a la API
                if let user = messageBody["user"] as? [String: Any] {
                    authData = ["token": token, "user": user]
                    // print("👤 [AUTH] Token con datos de usuario incluidos")
                } else {
                    // Solo tenemos token, necesitamos obtener datos del usuario de la API
                    Foundation.NSLog("🔍 [AUTH] Token sin datos de usuario, obteniendo desde API...")
                    
                    fetchUserDataWithToken(token) { [weak self] fetchedUserData in
                        DispatchQueue.main.async {
                            var finalUserData: [String: Any] = [:]
                            
                            if let fetchedData = fetchedUserData {
                                Foundation.NSLog("✅ [AUTH] Datos del usuario obtenidos de la API: \(fetchedData)")
                                finalUserData = fetchedData
                            } else {
                                Foundation.NSLog("❌ [AUTH] No se pudieron obtener datos del usuario de la API")
                                // NO asignar rol por defecto - dejar que la validación posterior maneje esto
                            }
                            
                            let authData: [String: Any] = [
                                "token": token,
                                "user": finalUserData
                            ]
                            
                            Foundation.NSLog("📦 [AUTH] Datos finales construidos desde token: \(authData)")
                            
                            self?.delegate?.didReceiveAuthSuccess(authData: authData)
                            Foundation.NSLog("✅ [AUTH] Delegado notificado con datos completos desde token")
                        }
                    }
                    return // Importante: salir aquí para no continuar con el procesamiento
                }
            } else if let accessToken = messageBody["access_token"] as? String {
                // Manejar cuando el token viene como access_token - usar API para obtener datos completos
                // print("🔍 [AUTH] access_token encontrado en AUTH_SUCCESS, obteniendo datos de API...")
                
                // Extraer información básica del mensaje
                var userData: [String: Any] = [:]
                if let email = messageBody["email"] as? String {
                    userData["email"] = email
                }
                if let userId = messageBody["user_id"] {
                    userData["id"] = userId
                }
                
                // Hacer llamada a la API para obtener información completa del usuario
                fetchUserDataWithToken(accessToken) { [weak self] fetchedUserData in
                    DispatchQueue.main.async {
                        var finalUserData = userData
                        
                            // Combinar datos del mensaje con datos de la API
                            if let fetchedData = fetchedUserData {
                                // print("✅ [AUTH] Datos del usuario obtenidos de la API en AUTH_SUCCESS: \(fetchedData)")
                                
                                // Copiar todos los datos de la API
                                for (key, value) in fetchedData {
                                    finalUserData[key] = value
                                }
                            } else {
                                // print("❌ [AUTH] No se pudieron obtener datos del usuario de la API en AUTH_SUCCESS")
                                // NO asignar rol por defecto - dejar que la validación posterior maneje esto
                            }
                        
                        let authData: [String: Any] = [
                            "token": accessToken,
                            "user": finalUserData
                        ]
                        
                        // print("� [AUTH] Datos finales construidos en AUTH_SUCCESS: \(authData)")
                        
                        self?.delegate?.didReceiveAuthSuccess(authData: authData)
                        // print("✅ [AUTH] Delegado notificado con datos completos desde AUTH_SUCCESS")
                    }
                }
                return // Importante: salir aquí para no continuar con el procesamiento
            }
            
            // print("🔄 [AUTH] Datos finales a enviar: \(authData)")
            
            if !authData.isEmpty {
                delegate?.didReceiveAuthSuccess(authData: authData)
                // print("✅ [AUTH] Delegado notificado con éxito")
            } else {
                // print("❌ [AUTH] AUTH_SUCCESS sin datos válidos - messageBody completo: \(messageBody)")
            }
            
        case "LOGOUT_REQUEST":
            // print("🚪 [AUTH] Solicitud de logout")
            delegate?.didReceiveLogoutRequest()
            
        case "PASSWORD_CHANGE_COMPLETE":
            // print("🔒 [AUTH] Cambio de contraseña completado")
            delegate?.didReceivePasswordChangeComplete()
            
        case "LOGOUT_CLEANUP_COMPLETE":
            Foundation.NSLog("🧹 [AUTH] Limpieza de logout completada desde JavaScript")
            // No necesitamos hacer nada especial, solo confirmar que la limpieza se completó
            
        case "ROUTE_CHANGE":
            if let routeData = messageBody["data"] as? [String: Any],
               let newRoute = routeData["route"] as? String {
                // Solo mostrar cambios de ruta importantes
                if newRoute.contains("/dashboard") || newRoute.contains("/home") || 
                   newRoute.contains("/login") && !newRoute.contains("recaptcha") {
                    // print("🗺️ [ROUTE] \(newRoute)")
                }
                delegate?.didReceiveRouteChange(route: newRoute)
            }
            
        case "AUTH_CHECK_FAILED":
            // print("⚠️ [AUTH] Verificación de autenticación falló")
            if messageBody["reason"] is String {
                // print("📄 [AUTH] Razón: \(reason)")
            }
            
        default:
            // Silenciar todos los demás mensajes (TEST_MESSAGE, SPA_STATE_UPDATE, etc.)
            break
        }
    }
    
    // MARK: - API Helper Methods
    
    private func fetchUserDataWithToken(_ token: String, completion: @escaping ([String: Any]?) -> Void) {
        Foundation.NSLog("🌐 [API] Iniciando petición para obtener datos del usuario...")
        
        // Crear URL directamente
        guard let url = URL(string: "https://spotme.jafetguzman.me/users/api/user") else {
            Foundation.NSLog("❌ [API] URL inválida")
            completion(nil)
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        Foundation.NSLog("🔄 [API] URL final: \(url.absoluteString)")
        Foundation.NSLog("🔑 [API] Token enviado: \(String(token.prefix(20)))...")
        
        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                Foundation.NSLog("❌ [API] Error en la petición: \(error.localizedDescription)")
                completion(nil)
                return
            }
            
            guard let httpResponse = response as? HTTPURLResponse else {
                Foundation.NSLog("❌ [API] Respuesta HTTP inválida")
                completion(nil)
                return
            }
            
            Foundation.NSLog("📡 [API] Código de respuesta: \(httpResponse.statusCode)")
            
            guard httpResponse.statusCode == 200 else {
                Foundation.NSLog("❌ [API] Error HTTP \(httpResponse.statusCode)")
                if let data = data, let responseString = String(data: data, encoding: .utf8) {
                    Foundation.NSLog("📄 [API] Respuesta de error: \(responseString)")
                }
                completion(nil)
                return
            }
            
            guard let data = data else {
                Foundation.NSLog("❌ [API] No se recibieron datos")
                completion(nil)
                return
            }
            
            // Primero mostrar los datos raw para debug
            if let responseString = String(data: data, encoding: .utf8) {
                Foundation.NSLog("🔍 [API] Respuesta raw: \(responseString)")
            }
            
            do {
                let jsonResponse = try JSONSerialization.jsonObject(with: data) as? [String: Any]
                Foundation.NSLog("✅ [API] Respuesta JSON parseada: \(jsonResponse ?? [:])")
                
                // Mapear los campos de la respuesta a nuestro formato
                var userData: [String: Any] = [:]
                
                if let responseData = jsonResponse {
                    // Mapear los datos básicos
                    userData["id"] = responseData["id"] ?? responseData["user_id"]
                    userData["name"] = responseData["name"] ?? responseData["nombre"]
                    userData["email"] = responseData["email"]
                    
                    // Mapear el rol y convertir ID a texto para facilitar el manejo
                    let roleId = responseData["role"] ?? responseData["tipo"] ?? responseData["user_role"] ?? responseData["role_id"]
                    
                    Foundation.NSLog("🎭 [API] Rol raw de la respuesta: \(roleId ?? "nil")")
                    
                    // Convertir role ID a string descriptivo para logs, pero mantener el ID original
                    var roleText = "conductor" // Default
                    if let roleNumber = roleId as? Int {
                        switch roleNumber {
                        case 1:
                            roleText = "conductor"
                        case 2:
                            roleText = "administrador"
                        default:
                            roleText = "conductor"
                        }
                        userData["role"] = roleNumber // Mantener el ID numérico
                        userData["role_text"] = roleText // Agregar texto descriptivo
                        Foundation.NSLog("🎭 [API] Rol procesado como número: \(roleNumber) -> \(roleText)")
                    } else if let roleString = roleId as? String {
                        // Si viene como string, intentar convertir a número
                        if let roleNumber = Int(roleString) {
                            switch roleNumber {
                            case 1:
                                roleText = "conductor"
                            case 2:
                                roleText = "administrador"
                            default:
                                roleText = "conductor"
                            }
                            userData["role"] = roleNumber
                            userData["role_text"] = roleText
                            Foundation.NSLog("🎭 [API] Rol procesado como string convertido: \(roleString) -> \(roleNumber) -> \(roleText)")
                        } else {
                            // Si no se puede convertir, usar el string tal como viene
                            userData["role"] = roleString
                            userData["role_text"] = roleString
                            Foundation.NSLog("🎭 [API] Rol procesado como string: \(roleString)")
                        }
                    } else {
                        // Fallback si no hay rol - NO asignar rol por defecto
                        Foundation.NSLog("⚠️ [API] No se encontró información de rol en la respuesta")
                        // La validación posterior en ViewController se encargará de manejar roles no autorizados
                    }
                    
                    Foundation.NSLog("👤 [API] Datos de usuario mapeados: \(userData)")
                    Foundation.NSLog("🎭 [API] Rol ID: \(userData["role"] ?? "unknown"), Texto: \(userData["role_text"] ?? "unknown")")
                }
                
                completion(userData)
                
            } catch {
                Foundation.NSLog("❌ [API] Error parseando JSON: \(error.localizedDescription)")
                Foundation.NSLog("❌ [API] Datos raw que causaron el error: \(String(data: data, encoding: .utf8) ?? "No se pudo convertir a string")")
                completion(nil)
            }
        }
        
        task.resume()
    }
}
