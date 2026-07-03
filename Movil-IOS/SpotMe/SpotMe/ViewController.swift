//
//  ViewController.swift
//  SpotMe
//
//  Created by Carolina Rodríguez on 28/07/25.
//

import UIKit
import WebKit

class ViewController: UIViewController {

    @IBOutlet weak var webView: WKWebView!
    
    // MARK: - Properties
    private var webCommunicationManager: SpotMeWebCommunicationManager?
    private var isShowingUnauthorizedAlert = false
    private var lastUnauthorizedAlertTime: Date = Date.distantPast
    private var appStartTime: Date = Date()
    private var lastLogoutTime: Date = Date.distantPast
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        NSLog("🚀 ViewController viewDidLoad started")
        
        // Limpiar datos corruptos al iniciar
        cleanupCorruptedAuthData()
        
        setupWebView()
        loadAuthURL()
        setupNotificationObservers()
        setupTestButton()
        NSLog("🚀 ViewController viewDidLoad completed")
    }
    
    private func cleanupCorruptedAuthData() {
        // Verificar si hay datos de autenticación corruptos
        if let userDataJSON = UserDefaults.standard.data(forKey: "spotme_user_data") {
            if let userData = try? JSONSerialization.jsonObject(with: userDataJSON) as? [String: Any] {
                let roleId = userData["role"] as? Int ?? 0
                let roleText = userData["role_text"] as? String ?? ""
                
                // Si el rol es 0 o "sin_rol", limpiar datos corruptos
                if roleId == 0 || roleText == "sin_rol" || roleText.isEmpty {
                    NSLog("⚠️ [CLEANUP] Detectados datos de autenticación corruptos, limpiando...")
                    UserDefaults.standard.removeObject(forKey: "spotme_access_token")
                    UserDefaults.standard.removeObject(forKey: "spotme_user_data")
                    UserDefaults.standard.synchronize()
                    NSLog("✅ [CLEANUP] Datos corruptos eliminados")
                }
            }
        }
    }
    
    private func setupTestButton() {
        // Add test button for debugging navigation
        let testButton = UIButton(type: .system)
        testButton.setTitle("🧪 TEST", for: .normal)
        testButton.backgroundColor = .systemRed
        testButton.setTitleColor(.white, for: .normal)
        testButton.layer.cornerRadius = 8
        testButton.layer.borderWidth = 2
        testButton.layer.borderColor = UIColor.white.cgColor
        testButton.titleLabel?.font = UIFont.boldSystemFont(ofSize: 16)
        testButton.translatesAutoresizingMaskIntoConstraints = false
        testButton.addTarget(self, action: #selector(testButtonTapped), for: .touchUpInside)
        
        // Hide test button for production
        testButton.isHidden = true
        
        // Make sure it's on top of everything
        view.addSubview(testButton)
        view.bringSubviewToFront(testButton)
        
        NSLog("🧪 Setting up test button with red background")
        
        NSLayoutConstraint.activate([
            testButton.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 50),
            testButton.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            testButton.widthAnchor.constraint(equalToConstant: 120),
            testButton.heightAnchor.constraint(equalToConstant: 50)
        ])
    }
    
                @objc private func testButtonTapped() {
        // print("🔥 [TEST] Botón de test presionado")
        
        // Mostrar opciones de test para diferentes roles
        let testAlert = UIAlertController(
            title: "Test de Roles",
            message: "Selecciona el tipo de usuario para probar:",
            preferredStyle: .actionSheet
        )
        
        // Test Conductor (ID 1)
        testAlert.addAction(UIAlertAction(title: "Conductor (ID: 1)", style: .default) { _ in
            let testAuthData: [String: Any] = [
                "token": "test_token_conductor",
                "user": [
                    "id": "123",
                    "name": "Test Conductor",
                    "email": "conductor@test.com",
                    "role": 1,
                    "role_text": "conductor"
                ]
            ]
            self.didReceiveAuthSuccess(authData: testAuthData)
        })
        
        // Test Administrador (ID 2)
        testAlert.addAction(UIAlertAction(title: "Administrador (ID: 2)", style: .default) { _ in
            let testAuthData: [String: Any] = [
                "token": "test_token_admin",
                "user": [
                    "id": "456",
                    "name": "Test Admin",
                    "email": "admin@test.com",
                    "role": 2,
                    "role_text": "administrador"
                ]
            ]
            self.didReceiveAuthSuccess(authData: testAuthData)
        })
        
        // Test Monitorista (ID 3) - No autorizado
        testAlert.addAction(UIAlertAction(title: "Monitorista (ID: 3)", style: .destructive) { _ in
            let testAuthData: [String: Any] = [
                "token": "test_token_monitor",
                "user": [
                    "id": "789",
                    "name": "Test Monitorista",
                    "email": "monitor@test.com",
                    "role": 3,
                    "role_text": "monitorista"
                ]
            ]
            self.didReceiveAuthSuccess(authData: testAuthData)
        })
        
        // Test sin rol
        testAlert.addAction(UIAlertAction(title: "Usuario sin rol", style: .destructive) { _ in
            let testAuthData: [String: Any] = [
                "token": "test_token_no_role",
                "user": [
                    "id": "999",
                    "name": "Test Sin Rol",
                    "email": "sinrol@test.com"
                ]
            ]
            self.didReceiveAuthSuccess(authData: testAuthData)
        })
        
        testAlert.addAction(UIAlertAction(title: "Cancelar", style: .cancel))
        
        // Para iPad
        if let popover = testAlert.popoverPresentationController {
            popover.sourceView = view
            popover.sourceRect = CGRect(x: view.bounds.midX, y: view.bounds.midY, width: 0, height: 0)
            popover.permittedArrowDirections = []
        }
        
        present(testAlert, animated: true)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    // MARK: - Notification Observers
    private func setupNotificationObservers() {
        // Removido LoadPasswordChange observer porque ahora el modal se abre directamente desde MenuViewController
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handlePerformLogout),
            name: NSNotification.Name("PerformLogout"),
            object: nil
        )
    }
    
    @objc private func handlePerformLogout() {
        performLogout()
    }
    
    // MARK: - WebView Setup
    private func setupWebView() {
        // print("🌐 [WEBVIEW] Configurando WebView...")
        
        webView.navigationDelegate = self
        
        // Setup communication manager
        webCommunicationManager = SpotMeWebCommunicationManager.configureWebView(webView, delegate: self)
        
        // print("✅ [WEBVIEW] WebView configurado exitosamente")
    }
    
    private func loadAuthURL() {
        let authURL = "https://spotme.jafetguzman.me/login"
        
        if let url = URL(string: authURL) {
            // print("🌐 [WEBVIEW] Cargando login desde: \(authURL)")
            let request = URLRequest(url: url)
            webView.load(request)
        } else {
            // print("❌ [WEBVIEW] URL inválida: \(authURL)")
        }
    }
    
    private func loadPasswordChangeURL() {
        let passwordChangeURL = "https://spotme.jafetguzman.me/password-manager"
        
        if let url = URL(string: passwordChangeURL) {
            // print("🔐 [WEBVIEW] Cargando password manager desde: \(passwordChangeURL)")
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
    
    private func openPasswordManagerModal() {
        NSLog("🔐 [MODAL] Abriendo password manager modal...")
        
        // Verificar que no haya otro modal presente
        if presentedViewController != nil {
            NSLog("⚠️ [MODAL] Ya hay un modal presente, cerrando primero...")
            dismiss(animated: false) {
                self.openPasswordManagerModal()
            }
            return
        }
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                NSLog("❌ Self is nil durante apertura de modal")
                return
            }
            
            guard let storyboard = self.storyboard else {
                NSLog("❌ Storyboard is nil para password manager")
                return
            }
            
            let passwordManagerVC = storyboard.instantiateViewController(withIdentifier: "PasswordManagerViewController")
            NSLog("✅ PasswordManagerViewController instantiated: \(passwordManagerVC)")
            
            // Configure the presentation as modal
            passwordManagerVC.modalPresentationStyle = .fullScreen
            passwordManagerVC.modalTransitionStyle = .coverVertical
            
            // Importante: asegurarse de que el modal no sea dismissible por swipe
            passwordManagerVC.isModalInPresentation = true
            
            NSLog("🔐 About to present PasswordManagerViewController")
            self.present(passwordManagerVC, animated: true) {
                NSLog("✅ PasswordManagerViewController presented successfully!")
                NSLog("✅ Current presented view controller: \(String(describing: self.presentedViewController))")
            }
        }
    }
    
    private func performLogout() {
        NSLog("🚪 [AUTH] Iniciando proceso de logout completo...")
        
        // Registrar tiempo del logout para evitar autenticación automática inmediata
        lastLogoutTime = Date()
        
        // Clear auth data from iOS
        UserDefaults.standard.removeObject(forKey: "spotme_access_token")
        UserDefaults.standard.removeObject(forKey: "spotme_user_data")
        UserDefaults.standard.synchronize()
        NSLog("✅ [AUTH] Datos de iOS limpiados")
        
        // Reset alert flags
        isShowingUnauthorizedAlert = false
        lastUnauthorizedAlertTime = Date.distantPast
        
        // CRITICAL: Clear WebView session data BEFORE reloading
        clearWebViewSession()
        
        // Reload login page after clearing session
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.loadAuthURL()
            NSLog("✅ [AUTH] Logout completo - redirigiendo a login")
        }
    }
    
    private func clearWebViewSession() {
        NSLog("🧹 [AUTH] Limpiando sesión completa del WebView...")
        
        // 1. Clear localStorage and sessionStorage via JavaScript
        let clearStorageJS = """
        console.log('🧹 [LOGOUT] Limpiando storage del navegador...');
        
        // Clear localStorage
        if (typeof(Storage) !== "undefined" && localStorage) {
            console.log('🧹 [LOGOUT] Limpiando localStorage...');
            localStorage.clear();
            
            // Also remove specific SpotMe keys just in case
            localStorage.removeItem('token');
            localStorage.removeItem('access_token');
            localStorage.removeItem('authToken');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('userData');
            localStorage.removeItem('role');
            localStorage.removeItem('user_role');
            localStorage.removeItem('tipo_usuario');
            
            console.log('✅ [LOGOUT] localStorage limpiado');
        }
        
        // Clear sessionStorage
        if (typeof(Storage) !== "undefined" && sessionStorage) {
            console.log('🧹 [LOGOUT] Limpiando sessionStorage...');
            sessionStorage.clear();
            
            // Also remove specific SpotMe keys just in case
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('access_token');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('auth_token');
            
            console.log('✅ [LOGOUT] sessionStorage limpiado');
        }
        
        // Reset SpotMe Mobile state
        if (window.SpotMeMobile) {
            console.log('🧹 [LOGOUT] Reseteando estado de SpotMe Mobile...');
            window.SpotMeMobile.authState = null;
            window.SpotMeMobile.currentRoute = '';
            console.log('✅ [LOGOUT] SpotMe Mobile state reseteado');
        }
        
        console.log('✅ [LOGOUT] Storage del navegador limpiado completamente');
        
        // Notify iOS that cleanup is complete
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.mobileAuthHandler) {
            window.webkit.messageHandlers.mobileAuthHandler.postMessage({
                type: 'LOGOUT_CLEANUP_COMPLETE',
                timestamp: Date.now()
            });
        }
        """
        
        webView.evaluateJavaScript(clearStorageJS) { result, error in
            if let error = error {
                NSLog("❌ [AUTH] Error ejecutando JavaScript de limpieza: \(error.localizedDescription)")
            } else {
                NSLog("✅ [AUTH] JavaScript de limpieza ejecutado exitosamente")
            }
        }
        
        // 2. Clear WebView cookies and website data
        let websiteDataTypes = WKWebsiteDataStore.allWebsiteDataTypes()
        WKWebsiteDataStore.default().removeData(ofTypes: websiteDataTypes, modifiedSince: Date.distantPast) {
            NSLog("✅ [AUTH] Cookies y datos del sitio web limpiados")
        }
        
        // 3. Clear WKWebView's browsing data
        if #available(iOS 14.0, *) {
            webView.configuration.websiteDataStore.removeData(ofTypes: [
                WKWebsiteDataTypeDiskCache,
                WKWebsiteDataTypeMemoryCache,
                WKWebsiteDataTypeLocalStorage,
                WKWebsiteDataTypeSessionStorage,
                WKWebsiteDataTypeCookies,
                WKWebsiteDataTypeIndexedDBDatabases
            ], modifiedSince: Date.distantPast) {
                NSLog("✅ [AUTH] Datos de navegación del WebView limpiados")
            }
        }
        
        NSLog("🧹 [AUTH] Limpieza completa de sesión iniciada")
    }
    
    private func startLoginDetection() {
        // print("🔍 [LOGIN] Iniciando detección de login")
        let javascript = """
        console.log('🔍 [JS] Script de detección iniciado');
        setInterval(function() {
            const token = localStorage.getItem('token') || localStorage.getItem('authToken');
            console.log('🔍 [JS] Verificando token:', token ? 'EXISTE' : 'NO EXISTE');
            if (token && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.mobileAuthHandler) {
                console.log('🔍 [JS] Enviando mensaje AUTH_SUCCESS');
                window.webkit.messageHandlers.mobileAuthHandler.postMessage({
                    type: 'AUTH_SUCCESS',
                    token: token
                });
            }
        }, 1000);
        """
        
        webView.evaluateJavaScript(javascript, completionHandler: { result, error in
            if error != nil {
                // print("❌ [LOGIN] Error ejecutando JavaScript: \(error)")
            } else {
                // print("✅ [LOGIN] JavaScript ejecutado correctamente")
            }
        })
    }
}

// MARK: - WKNavigationDelegate
extension ViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        if webView.url != nil {
            // print("🔍 [WEBVIEW] Navegando a: \(url.absoluteString)")
        }
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        if webView.url != nil {
            // print("🌐 [WEBVIEW] Cargó: \(url.absoluteString)")
        }
    }
}

// MARK: - SpotMeWebCommunicationDelegate
extension ViewController: SpotMeWebCommunicationDelegate {
    func didReceiveAuthSuccess(authData: [String: Any]) {
        // Período de gracia de 3 segundos al inicio de la app para evitar autenticación automática espuria
        let timeSinceAppStart = Date().timeIntervalSince(appStartTime)
        if timeSinceAppStart < 3.0 {
            // Verificar si es una autenticación con datos inválidos durante el período de gracia
            if let userData = authData["user"] as? [String: Any] {
                let roleId = userData["role"] as? Int ?? 0
                let roleText = userData["role_text"] as? String ?? ""
                
                if roleId == 0 && (roleText == "sin_rol" || roleText.isEmpty) {
                    NSLog("⚠️ [AUTH] Autenticación automática con datos inválidos durante período de gracia, ignorando")
                    return
                }
            }
        }
        
        // PROTECCIÓN POST-LOGOUT: Período de gracia de 5 segundos después del logout
        let timeSinceLastLogout = Date().timeIntervalSince(lastLogoutTime)
        if timeSinceLastLogout < 5.0 {
            NSLog("🚫 [AUTH] Autenticación automática bloqueada - muy reciente al logout (hace \(String(format: "%.1f", timeSinceLastLogout))s)")
            return
        }
        
        // Verificar si hay un modal presente específico (como el password manager) pero NO alerts
        if let presentedVC = presentedViewController,
           !(presentedVC is UIAlertController) {
            
            if presentedVC is MenuViewController {
                NSLog("🔐 [AUTH] MenuViewController ya presente, ignorando auth success duplicado")
                return
            } else {
                NSLog("🔐 [AUTH] Modal (\(type(of: presentedVC))) presente, ignorando auth success para evitar navegación automática")
                return
            }
        }
        
        // print("🔥 [AUTH] didReceiveAuthSuccess llamado con datos: \(authData)")
        
        // Verificar que los datos de autenticación sean válidos antes de procesar
        if authData.isEmpty {
            NSLog("⚠️ [AUTH] Datos de autenticación vacíos, ignorando")
            return
        }
        
        // Verificar si es una autenticación automática con datos inválidos
        if let userData = authData["user"] as? [String: Any] {
            let roleId = userData["role"] as? Int ?? 0
            let roleText = userData["role_text"] as? String ?? ""
            
            if roleId == 0 && (roleText == "sin_rol" || roleText.isEmpty) {
                NSLog("⚠️ [AUTH] Detectada autenticación automática con datos inválidos, ignorando")
                return
            }
        }
        
        // Intentar extraer token de diferentes ubicaciones posibles
        var token: String?
        
        if let directToken = authData["token"] as? String {
            token = directToken
            // print("✅ [AUTH] Token encontrado directamente: \(token!)")
        } else if let accessToken = authData["access_token"] as? String {
            token = accessToken
            // print("✅ [AUTH] Token encontrado como access_token: \(token!)")
        } else if let userData = authData["user"] as? [String: Any],
                  let userToken = userData["token"] as? String {
            token = userToken
            // print("✅ [AUTH] Token encontrado en user data: \(token!)")
        }
        
        guard let validToken = token else {
            // print("❌ [AUTH] No se encontró token válido en los datos recibidos")
            return
        }
        
        // Store auth data
        if let userData = authData["user"] as? [String: Any] {
            // Save token
            UserDefaults.standard.set(validToken, forKey: "spotme_access_token")
            
            // Save user data
            if let userDataJSON = try? JSONSerialization.data(withJSONObject: userData) {
                UserDefaults.standard.set(userDataJSON, forKey: "spotme_user_data")
            }
            
            UserDefaults.standard.synchronize()
            // print("✅ [AUTH] Datos de usuario guardados")
        } else {
            // print("⚠️ [AUTH] No se encontraron datos de usuario, guardando solo token")
            UserDefaults.standard.set(validToken, forKey: "spotme_access_token")
            UserDefaults.standard.synchronize()
        }
        
        // Check role and navigate
        var userData: [String: Any]? = nil
        if let userDataJSON = UserDefaults.standard.data(forKey: "spotme_user_data") {
            userData = try? JSONSerialization.jsonObject(with: userDataJSON) as? [String: Any]
        }
        
        // Extraer el rol, que puede venir como ID numérico o texto
        var userRole: String = ""
        var roleId: Int = 0
        
        if let roleNumber = userData?["role"] as? Int {
            roleId = roleNumber
            // Convertir ID a texto descriptivo
            switch roleNumber {
            case 1:
                userRole = "conductor"
            case 2:
                userRole = "administrador"
            default:
                userRole = "no_autorizado" // En lugar de "desconocido"
            }
        } else if let roleString = userData?["role"] as? String {
            userRole = roleString.lowercased()
            // Intentar convertir texto a ID si es posible
            switch userRole {
            case "conductor":
                roleId = 1
            case "administrador":
                roleId = 2
            default:
                roleId = 0 // Mantener 0 para roles no autorizados
            }
        } else if let roleText = userData?["role_text"] as? String {
            userRole = roleText.lowercased()
        } else {
            // No se encontró rol en ningún formato
            userRole = "sin_rol"
            roleId = 0
        }
        
        // print("👤 [AUTH] Rol de usuario - ID: \(roleId), Texto: '\(userRole)'")
        
        DispatchQueue.main.async {
            NSLog("👤 [AUTH] Verificando rol - ID: \(roleId), Texto: '\(userRole)'")
            
            // Verificar si el rol es 1 (Conductor) o 2 (Administrador)
            let allowedRoleIds = [1, 2]
            let allowedRoleTexts = ["conductor", "administrador"]
            
            let hasValidRoleId = allowedRoleIds.contains(roleId)
            let hasValidRoleText = allowedRoleTexts.contains(userRole)
            
            if hasValidRoleId || hasValidRoleText {
                let roleDescription = roleId == 2 ? "Administrador" : "Conductor"
                NSLog("✅ [AUTH] Usuario tiene rol permitido (\(roleDescription) - ID: \(roleId)), iniciando navegación...")
                NSLog("🔍 [AUTH] Estado actual del view controller: presentedViewController = \(String(describing: self.presentedViewController))")
                self.navigateToMainMenu()
            } else {
                NSLog("❌ [AUTH] Usuario no tiene rol permitido (ID: \(roleId), texto: '\(userRole)'), roles permitidos: \(allowedRoleIds)")
                
                // Evitar mostrar múltiples alerts de acceso denegado con cooldown de 10 segundos
                let now = Date()
                let timeSinceLastAlert = now.timeIntervalSince(self.lastUnauthorizedAlertTime)
                
                if !self.isShowingUnauthorizedAlert && timeSinceLastAlert > 10.0 {
                    self.isShowingUnauthorizedAlert = true
                    self.lastUnauthorizedAlertTime = now
                    
                    // Mostrar alert específico para usuarios no autorizados
                    let unauthorizedAlert = UIAlertController(
                        title: "Acceso Denegado",
                        message: "Monitorista no puede acceder a esta aplicación.",
                        preferredStyle: .alert
                    )
                    
                    unauthorizedAlert.addAction(UIAlertAction(title: "Entendido", style: .default) { _ in
                        NSLog("📱 [AUTH] Usuario confirmó mensaje de acceso denegado")
                        self.isShowingUnauthorizedAlert = false
                        // Mantener en la página de login para que pueda intentar con otra cuenta
                    })
                    
                    self.present(unauthorizedAlert, animated: true) {
                        NSLog("📱 [AUTH] Alert de acceso denegado presentado")
                    }
                } else {
                    NSLog("⚠️ [AUTH] Alert de acceso denegado suprimido (cooldown: \(String(format: "%.1f", timeSinceLastAlert))s)")
                }
            }
        }
    }
    
    private func navigateToMainMenu() {
        NSLog("🚀 Starting navigation to main menu")
        
        // Ensure we're on the main thread
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                NSLog("❌ Self is nil during navigation")
                return
            }
            
            NSLog("🚀 Executing navigation on main thread")
            
            guard let storyboard = self.storyboard else {
                NSLog("❌ Storyboard is nil")
                return
            }
            NSLog("✅ Storyboard found: \(storyboard)")
            
            let menuViewController = storyboard.instantiateViewController(withIdentifier: "MenuViewController")
            NSLog("✅ MenuViewController instantiated: \(menuViewController)")
            
            // Configure the presentation
            menuViewController.modalPresentationStyle = .fullScreen
            menuViewController.modalTransitionStyle = .crossDissolve
            
            NSLog("🚀 About to present MenuViewController")
            self.present(menuViewController, animated: true) {
                NSLog("✅ MenuViewController presented successfully!")
                NSLog("✅ Current presented view controller: \(String(describing: self.presentedViewController))")
            }
        }
    }
    
    func didReceiveRouteChange(route: String) {
        if route.contains("/login") || route.contains("/verificacion") {
            startLoginDetection()
        }
    }
    
    func didReceiveLogoutRequest() {
        // print("🚪 [AUTH] Procesando solicitud de logout")
        DispatchQueue.main.async {
            self.performLogout()
        }
    }
    
    func didReceivePasswordChangeComplete() {
        // Ya no necesitamos hacer nada aquí porque el modal se encarga de todo
        NSLog("🔐 [AUTH] Cambio de contraseña completado - sin acciones adicionales")
    }
    
    func didReceiveSPAStateUpdate(state: [String: Any]) {
        // Verificar si hay un modal presente específico (como el password manager) pero NO alerts
        if let presentedVC = presentedViewController,
           !(presentedVC is UIAlertController) {
            
            if presentedVC is MenuViewController {
                NSLog("🔐 [SPA] MenuViewController ya presente, ignorando SPA state update duplicado")
                return
            } else {
                NSLog("🔐 [SPA] Modal (\(type(of: presentedVC))) presente, ignorando SPA state update para evitar navegación automática")
                return
            }
        }
        
        // Simplified - just handle basic auth state sync
        if let isAuthenticated = state["isAuthenticated"] as? Bool, isAuthenticated,
           let authData = state["authData"] as? [String: Any],
           let token = authData["access_token"] as? String,
           let userData = authData["user"] as? [String: Any] {
            
            // Check if we already have auth data to avoid redundant processing
            let currentToken = UserDefaults.standard.string(forKey: "spotme_access_token")
            if currentToken == nil {
                // Save auth data using UserDefaults directly
                UserDefaults.standard.set(token, forKey: "spotme_access_token")
                
                if let userDataJSON = try? JSONSerialization.data(withJSONObject: userData) {
                    UserDefaults.standard.set(userDataJSON, forKey: "spotme_user_data")
                }
                
                UserDefaults.standard.synchronize()
                
                let userRole = userData["role"] as? String ?? ""
                if userRole.lowercased() == "conductor" {
                    DispatchQueue.main.async {
                        self.navigateToMainMenu()
                    }
                }
            }
        }
    }
}
