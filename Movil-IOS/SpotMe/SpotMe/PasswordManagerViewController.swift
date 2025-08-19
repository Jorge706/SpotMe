//
//  PasswordManagerViewController.swift
//  SpotMe
//
//  Created by System on 07/08/25.
//

import UIKit
import WebKit

class PasswordManagerViewController: UIViewController {
    
    @IBOutlet weak var webView: WKWebView!
    
    // MARK: - Properties
    private var webCommunicationManager: SpotMeWebCommunicationManager?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        NSLog("🔐 PasswordManagerViewController viewDidLoad started")
        
        // Verificar que tenemos token antes de continuar
        if let token = UserDefaults.standard.string(forKey: "spotme_access_token") {
            NSLog("✅ [AUTH] Token disponible para password manager: \(String(token.prefix(20)))...")
        } else {
            NSLog("❌ [AUTH] No hay token disponible para password manager!")
        }
        
        setupWebView()
        loadPasswordManagerURL()
        setupCloseButton()
        NSLog("🔐 PasswordManagerViewController viewDidLoad completed")
    }
    
    private func setupCloseButton() {
        // Agregar botón de cerrar en la esquina superior izquierda
        let closeButton = UIButton(type: .system)
        closeButton.setTitle("✕", for: .normal)
        closeButton.setTitleColor(.white, for: .normal)
        closeButton.backgroundColor = UIColor.black.withAlphaComponent(0.6)
        closeButton.layer.cornerRadius = 20
        closeButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 18)
        closeButton.translatesAutoresizingMaskIntoConstraints = false
        closeButton.addTarget(self, action: #selector(closeModal), for: .touchUpInside)
        
        view.addSubview(closeButton)
        view.bringSubviewToFront(closeButton)
        
        NSLayoutConstraint.activate([
            closeButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 10),
            closeButton.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            closeButton.widthAnchor.constraint(equalToConstant: 40),
            closeButton.heightAnchor.constraint(equalToConstant: 40)
        ])
    }
    
    @objc private func closeModal() {
        NSLog("🔐 Usuario cerró modal de password manager manualmente")
        dismiss(animated: true)
    }
    
    // MARK: - WebView Setup
    private func setupWebView() {
        NSLog("🌐 [WEBVIEW] Configurando WebView para password manager...")
        
        webView.navigationDelegate = self
        
        // Configurar WebView SIN la detección automática para evitar mensajes AUTH_SUCCESS constantes
        setupPasswordManagerWebView()
        
        NSLog("✅ [WEBVIEW] WebView para password manager configurado exitosamente")
    }
    
    private func setupPasswordManagerWebView() {
        let manager = SpotMeWebCommunicationManager()
        manager.delegate = self
        webCommunicationManager = manager
        
        let contentController = WKUserContentController()
        contentController.add(manager, name: "mobileAuthHandler")
        
        // JavaScript específico para password manager SIN detección automática
        let passwordManagerJavaScript = """
        // JavaScript específico para Password Manager - SIN detección automática
        window.webkit = window.webkit || {};
        window.webkit.messageHandlers = window.webkit.messageHandlers || {};
        
        console.log('🔐 [PWD-MANAGER] Configurando JavaScript para password manager...');
        
        // Función para enviar mensajes a iOS de manera segura
        window.sendToiOS = function(type, data = {}) {
            try {
                if (window.webkit.messageHandlers && window.webkit.messageHandlers.mobileAuthHandler) {
                    console.log('🔐➡️ [PWD-MANAGER] Enviando a iOS:', type, data);
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
        
        // Función para notificar cambio de contraseña completado
        window.notifyPasswordChangeComplete = function() {
            console.log('🔐 [PWD-MANAGER] Notificando cambio de contraseña completado');
            window.sendToiOS('PASSWORD_CHANGE_COMPLETE');
        };
        
        // Función para detectar cambio de contraseña exitoso
        window.detectPasswordChangeSuccess = function() {
            console.log('🔐 [PWD-MANAGER] Configurando detección de cambio de contraseña...');
            
            // Monitorear cambios en la página que indiquen éxito
            const checkForSuccess = setInterval(() => {
                // Buscar indicadores de éxito en la página
                const successMessages = [
                    'contraseña actualizada',
                    'password updated',
                    'contraseña cambiada',
                    'password changed',
                    'éxito',
                    'success'
                ];
                
                const bodyText = document.body.innerText.toLowerCase();
                const hasSuccessMessage = successMessages.some(msg => bodyText.includes(msg));
                
                if (hasSuccessMessage) {
                    console.log('✅ [PWD-MANAGER] Cambio de contraseña exitoso detectado');
                    clearInterval(checkForSuccess);
                    window.notifyPasswordChangeComplete();
                }
            }, 2000);
            
            // Limpiar después de 5 minutos
            setTimeout(() => {
                clearInterval(checkForSuccess);
                console.log('🕒 [PWD-MANAGER] Timeout de detección de cambio de contraseña');
            }, 300000);
        };
        
        // Configurar detección cuando el DOM esté listo
        function initializePasswordManager() {
            console.log('🔐 [PWD-MANAGER] Inicializando password manager...');
            
            // Configurar detección de cambio de contraseña
            setTimeout(() => {
                window.detectPasswordChangeSuccess();
            }, 2000);
            
            // Notificar que está listo
            window.sendToiOS('PASSWORD_MANAGER_READY', {
                userAgent: navigator.userAgent,
                initialRoute: window.location.href
            });
            
            console.log('✅ [PWD-MANAGER] Password manager inicializado');
        }
        
        // Ejecutar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializePasswordManager);
        } else {
            initializePasswordManager();
        }
        
        console.log('🔐 [PWD-MANAGER] JavaScript para password manager configurado');
        """
        
        let userScript = WKUserScript(
            source: passwordManagerJavaScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        contentController.addUserScript(userScript)
        
        // Crear nueva configuración
        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.preferences.javaScriptEnabled = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        
        // Actualizar configuración existente del WebView
        if let existingController = webView.configuration.userContentController as? WKUserContentController {
            existingController.removeAllUserScripts()
            existingController.removeScriptMessageHandler(forName: "mobileAuthHandler")
            existingController.add(manager, name: "mobileAuthHandler")
            existingController.addUserScript(userScript)
        }
        
        NSLog("✅ [PWD-MANAGER] WebView configurado con JavaScript específico (SIN detección automática)")
    }
    
    private func loadPasswordManagerURL() {
        let passwordManagerURL = "https://spotme.jafetguzman.me/change-password"
        
        if let url = URL(string: passwordManagerURL) {
            NSLog("🔐 [WEBVIEW] Cargando password manager desde: \(passwordManagerURL)")
            let request = URLRequest(url: url)
            webView.load(request)
        } else {
            NSLog("❌ [WEBVIEW] URL inválida: \(passwordManagerURL)")
        }
    }
    
    private func injectAuthToken() {
        // Obtener el token del UserDefaults
        guard let token = UserDefaults.standard.string(forKey: "spotme_access_token") else {
            NSLog("❌ [AUTH] No se encontró token para inyectar en password manager")
            return
        }
        
        NSLog("🔐 [AUTH] Inyectando token en password manager WebView")
        
        // JavaScript para inyectar el token en localStorage
        let javascript = """
        console.log('🔐 [PWD-MANAGER] Inyectando token de autenticación...');
        
        // Inyectar token en localStorage con diferentes keys para compatibilidad
        localStorage.setItem('token', '\(token)');
        localStorage.setItem('access_token', '\(token)');
        localStorage.setItem('authToken', '\(token)');
        localStorage.setItem('auth_token', '\(token)');
        
        // También intentar inyectar en sessionStorage
        sessionStorage.setItem('token', '\(token)');
        sessionStorage.setItem('access_token', '\(token)');
        
        console.log('✅ [PWD-MANAGER] Token inyectado exitosamente');
        console.log('🔍 [PWD-MANAGER] Token localStorage:', localStorage.getItem('token'));
        console.log('🔍 [PWD-MANAGER] Token sessionStorage:', sessionStorage.getItem('token'));
        
        // Si hay un evento personalizado para notificar que el token está listo
        if (typeof window.onTokenReady === 'function') {
            window.onTokenReady('\(token)');
        }
        
        // Dispatch evento personalizado para que la aplicación web sepa que el token está disponible
        window.dispatchEvent(new CustomEvent('mobileTokenInjected', { 
            detail: { 
                token: '\(token)',
                source: 'mobile_app'
            } 
        }));
        """
        
        webView.evaluateJavaScript(javascript) { result, error in
            if let error = error {
                NSLog("❌ [AUTH] Error inyectando token: \(error.localizedDescription)")
            } else {
                NSLog("✅ [AUTH] Token inyectado exitosamente en password manager")
            }
        }
    }
    
    deinit {
        NSLog("🔐 PasswordManagerViewController deinit")
    }
}

// MARK: - WKNavigationDelegate
extension PasswordManagerViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        if let url = webView.url {
            NSLog("🔍 [WEBVIEW] Password Manager navegando a: \(url.absoluteString)")
        }
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if let url = webView.url {
            NSLog("🌐 [WEBVIEW] Password Manager cargó: \(url.absoluteString)")
            
            // Inyectar token después de que la página haya cargado
            if url.absoluteString.contains("/password-manager") {
                NSLog("🔐 [AUTH] Página de password-manager cargada, inyectando token...")
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    self.injectAuthToken()
                }
            }
        }
    }
}

// MARK: - SpotMeWebCommunicationDelegate
extension PasswordManagerViewController: SpotMeWebCommunicationDelegate {
    func didReceiveAuthSuccess(authData: [String: Any]) {
        // IMPORTANTE: No procesar auth success en el password manager para evitar navegación automática
        NSLog("🔐 [AUTH] Auth success recibido en password manager (IGNORADO para evitar navegación)")
    }
    
    func didReceiveRouteChange(route: String) {
        NSLog("🔐 [ROUTE] Cambio de ruta en password manager: \(route)")
        // No hacer nada especial con los cambios de ruta
    }
    
    func didReceiveLogoutRequest() {
        NSLog("🔐 [AUTH] Logout request recibido en password manager - solo cerrando modal")
        DispatchQueue.main.async {
            // Solo cerrar el modal, sin hacer logout
            self.dismiss(animated: true) {
                NSLog("✅ [MODAL] Modal de password manager cerrado por logout request")
            }
        }
    }
    
    func didReceivePasswordChangeComplete() {
        NSLog("🔐 [AUTH] Cambio de contraseña completado en modal - solo cerrando modal")
        DispatchQueue.main.async {
            // Solo cerrar el modal, sin hacer logout ni otras acciones
            self.dismiss(animated: true) {
                NSLog("✅ [MODAL] Modal de password manager cerrado exitosamente")
            }
        }
    }
    
    func didReceiveSPAStateUpdate(state: [String: Any]) {
        // IMPORTANTE: No procesar SPA state updates para evitar navegación automática
        NSLog("🔐 [SPA] SPA state update recibido en password manager (IGNORADO)")
    }
}
