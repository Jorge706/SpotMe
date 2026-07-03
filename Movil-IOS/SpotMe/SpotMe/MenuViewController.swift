//
//  MenuViewController.swift
//  SpotMe
//
//  Created by Carolina Rodríguez on 28/07/25.
//

import UIKit
import WebKit
import CoreLocation

// Custom UIView that blocks touches except inside the modalView frame,
// allowing modal buttons to receive touches normally
class PassThroughView: UIView {
    weak var passthroughView: UIView?

    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
        if let passthroughView = passthroughView {
            let pointInPassthrough = convert(point, to: passthroughView)
            if passthroughView.bounds.contains(pointInPassthrough) {
                // Inside modal view — don't block touches, let modalView handle them
                return nil
            }
        }
        // Outside modal — block touches here (dimmed background)
        return super.hitTest(point, with: event)
    }
}

class MenuViewController: UIViewController, CLLocationManagerDelegate {
    
    let locationManager = CLLocationManager()
    var currentLocation: CLLocation?
    
    var scannedVehicleName: String?

    @objc func vehicleNameReceived(_ notification: Notification) {
        if let vehicleName = notification.userInfo?["vehicleName"] as? String {
            self.scannedVehicleName = vehicleName
            print("✅ Vehicle name recibido en MenuViewController: \(vehicleName)")

            // 📢 Mostrar modal automáticamente
            lblModalText.text = "Se ha registrado la información de tu viaje"
            imgModal.image = UIImage(named: "protection")

            // Ajustar estilo del botón (opcional, para que se vea neutral)
            var config = btnModal.configuration ?? UIButton.Configuration.filled()
            config.baseBackgroundColor = UIColor.systemBlue
            config.baseForegroundColor = .white
            btnModal.configuration = config
            btnModal.isHidden = true  // Si no quieres que se muestre un botón de acción
            btnCloseModal.setTitle("Cerrar", for: .normal)

            // Mostrar el modal
            showModal()
        }
    }
    

    @IBOutlet weak var btnChangePswd: UIButton!
    @IBOutlet weak var btnQRCode: UIButton!
    @IBOutlet weak var btnLogout: UIButton!
    @IBOutlet weak var GlassView: UIView!

    @IBOutlet weak var modalView: UIView!
    @IBOutlet weak var lblModalText: UILabel!
    @IBOutlet weak var imgModal: UIImageView!
    @IBOutlet weak var btnModal: UIButton!
    @IBOutlet weak var btnCloseModal: UIButton!
    
    @IBOutlet weak var panicButton: UIImageView!
    
    // MARK: - Auth Properties
    private var accessToken: String?
    private var userData: [String: Any]?
    
    private var modalGradient: CAGradientLayer?
    private let gradientLayer = CAGradientLayer()

    private var blurView: UIVisualEffectView!
    private var dimmedBackground: PassThroughView!

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Cargar datos de autenticación
        loadAuthData()
        
        // Transparent glass background
        GlassView.backgroundColor = .clear

        // Gradient on GlassView
        gradientLayer.colors = [
            UIColor(red: 0/255, green: 178/255, blue: 202/255, alpha: 0.8).cgColor,
            UIColor(red: 0/255, green: 88/255, blue: 122/255, alpha: 0.7).cgColor
        ]
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0.0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1.0)
        GlassView.layer.insertSublayer(gradientLayer, at: 0)

        // Apply shadows to buttons
        applyShadow(to: btnChangePswd)
        applyShadow(to: btnQRCode)
        applyShadow(to: btnLogout)
        applyShadow(to: btnModal)
        applyShadow(to: btnCloseModal)

        // Setup panic button tap gesture
        panicButton.isUserInteractionEnabled = true
        let tapGesture = UITapGestureRecognizer(target: self, action: #selector(handlePanicTap))
        panicButton.addGestureRecognizer(tapGesture)

        // Setup glass-style modal
        setupModalGlassEffect()
        
        // Setup para obtener ubicación
         locationManager.delegate = self
         locationManager.desiredAccuracy = kCLLocationAccuracyBest
         locationManager.requestWhenInUseAuthorization()
         locationManager.startUpdatingLocation()
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(vehicleNameReceived(_:)),
            name: Notification.Name("VehicleNameScanned"),
            object: nil
        )
    }
    
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        currentLocation = locations.last
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Error al obtener ubicación: \(error.localizedDescription)")
    }
    
    // MARK: - Auth Data Management
    private func loadAuthData() {
        // Verificar que tenemos datos de autenticación
        guard UserDefaults.standard.string(forKey: "spotme_access_token") != nil else {
            print("⚠️ No se encontró token de acceso, regresando al login")
            DispatchQueue.main.async {
                self.returnToLogin()
            }
            return
        }
        
        accessToken = UserDefaults.standard.string(forKey: "spotme_access_token")
        
        // Load user data
        if let userDataJSON = UserDefaults.standard.data(forKey: "spotme_user_data") {
            userData = try? JSONSerialization.jsonObject(with: userDataJSON) as? [String: Any]
        }
        
        print(userData!)
        print("✅ Datos de auth cargados - Usuario: \(userData?["name"] ?? "N/A")")
    }
    
    private func clearAuthData() {
        UserDefaults.standard.removeObject(forKey: "spotme_access_token")
        UserDefaults.standard.removeObject(forKey: "spotme_user_data")
        UserDefaults.standard.synchronize()
        accessToken = nil
        userData = nil
    }
    
    private func returnToLogin() {
        // Regresar al ViewController principal (WebView de login)
        if let loginVC = storyboard?.instantiateViewController(withIdentifier: "ViewController") {
            loginVC.modalPresentationStyle = .fullScreen
            present(loginVC, animated: true)
        } else {
            // Fallback: dismiss modal
            dismiss(animated: true)
        }
    }

        override func viewDidLayoutSubviews() {
            super.viewDidLayoutSubviews()
            gradientLayer.frame = GlassView.bounds
            modalGradient?.frame = modalView.bounds

            if !dimmedBackground.isHidden {
                updateDimmedBackgroundMask()
            }
        }

        private func applyShadow(to button: UIButton) {
            button.layer.shadowColor = UIColor.black.cgColor
            button.layer.shadowOpacity = 0.25
            button.layer.shadowOffset = CGSize(width: 0, height: 4)
            button.layer.shadowRadius = 6
            button.layer.masksToBounds = false
        }

        // MARK: - Modal Setup

        private func setupModalGlassEffect() {
            // Dimmed background blocker that lets touches pass inside modalView frame
            dimmedBackground = PassThroughView(frame: view.bounds)
            dimmedBackground.passthroughView = modalView
            dimmedBackground.backgroundColor = UIColor.black.withAlphaComponent(0.4)
            dimmedBackground.alpha = 0
            dimmedBackground.isUserInteractionEnabled = true
            dimmedBackground.isHidden = true

            // Tap outside modal dismisses modal
            let tap = UITapGestureRecognizer(target: self, action: #selector(dismissModalFromBackground(_:)))
            dimmedBackground.addGestureRecognizer(tap)

            // Insert below modal view
            view.insertSubview(dimmedBackground, belowSubview: modalView)

            // Blur background for modal
            let blurEffect = UIBlurEffect(style: .systemUltraThinMaterialLight)
            blurView = UIVisualEffectView(effect: blurEffect)
            blurView.frame = modalView.bounds
            blurView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            blurView.layer.cornerRadius = 12
            blurView.clipsToBounds = true
            blurView.alpha = 0.4
            modalView.insertSubview(blurView, at: 0)

            // Add gradient to modal
            let modalGradient = CAGradientLayer()
            modalGradient.colors = [
                UIColor(red: 0/255, green: 178/255, blue: 202/255, alpha: 0.8).cgColor,
                UIColor(red: 0/255, green: 88/255, blue: 122/255, alpha: 0.7).cgColor
            ]
            modalGradient.startPoint = CGPoint(x: 0.5, y: 0.0)
            modalGradient.endPoint = CGPoint(x: 0.5, y: 1.0)
            modalGradient.cornerRadius = 12
            modalView.layer.insertSublayer(modalGradient, at: 0)
            self.modalGradient = modalGradient // Save reference for resizing

            // Modal appearance styling
            modalView.layer.cornerRadius = 12
            modalView.layer.borderWidth = 1
            modalView.layer.borderColor = UIColor.white.withAlphaComponent(0.6).cgColor
            modalView.layer.masksToBounds = true

            // Hide initially
            modalView.isHidden = true
            modalView.alpha = 0
        }

    // MARK: - Modal Actions
    private func updateDimmedBackgroundMask() {
        let path = UIBezierPath(rect: view.bounds)
        let modalFrameInView = modalView.convert(modalView.bounds, to: view)
        let modalPath = UIBezierPath(roundedRect: modalFrameInView, cornerRadius: modalView.layer.cornerRadius)
        path.append(modalPath)
        path.usesEvenOddFillRule = true

        let maskLayer = CAShapeLayer()
        maskLayer.path = path.cgPath
        maskLayer.fillRule = .evenOdd

        dimmedBackground.layer.mask = maskLayer
    }

    @objc func handlePanicTap() {
        lblModalText.text = "¿Estás seguro de que quieres enviar una alerta de pánico?"
        imgModal.image = UIImage(named: "warning")
        // Update button configuration
        var config = btnModal.configuration
        if config == nil {
            config = UIButton.Configuration.filled()
        }
        config?.baseBackgroundColor = UIColor(hex: "#FF2147")
        config?.baseForegroundColor = .white
        btnModal.isHidden = false
        btnModal.configuration = config
        btnCloseModal.setTitle("Cerrar", for: .normal)
        showModal()
    }

    @objc func dismissModalFromBackground(_ sender: UITapGestureRecognizer) {
        let location = sender.location(in: view)
        let modalFrame = modalView.frame

        if !modalFrame.contains(location) {
            dismissModal(self)
        }
        // else tap inside modal: ignore so modal buttons work
    }
    
    // This action just opens the confirmar modal
    @IBAction func btnModalConfirmar(_ sender: Any) {
        // Enviar alerta de pánico real
        sendPanicAlert()
    }
    
    func showModal() {
        modalView.isHidden = false
        dimmedBackground.isHidden = false

        // Update mask so the dim excludes modal frame
        updateDimmedBackgroundMask()

        view.bringSubviewToFront(dimmedBackground)
        view.bringSubviewToFront(modalView)

        UIView.animate(withDuration: 0.3) {
            self.modalView.alpha = 1
            self.dimmedBackground.alpha = 1
        }
    }

    @IBAction func dismissModal(_ sender: Any) {
        UIView.animate(withDuration: 0.3, animations: {
            self.modalView.alpha = 0
            self.dimmedBackground.alpha = 0
        }) { _ in
            self.modalView.isHidden = true
            self.dimmedBackground.isHidden = true
        }
    }
    
    // MARK: - Button Actions
    @IBAction func changePasswordTapped(_ sender: Any) {
        // Abrir modal de password manager directamente
        openPasswordManagerModal()
    }
    
    @IBAction func logoutTapped(_ sender: Any) {
        // Mostrar confirmación de logout
        showLogoutConfirmation()
    }
    
    // MARK: - Additional Actions
    private func openPasswordManagerModal() {
        NSLog("🔐 [MODAL] Abriendo password manager modal desde MenuViewController...")
        
        DispatchQueue.main.async { [weak self] in
            guard let self = self else {
                NSLog("❌ Self is nil durante apertura de modal desde menu")
                return
            }
            
            guard let storyboard = self.storyboard else {
                NSLog("❌ Storyboard is nil para password manager desde menu")
                return
            }
            
            let passwordManagerVC = storyboard.instantiateViewController(withIdentifier: "PasswordManagerViewController")
            NSLog("✅ PasswordManagerViewController instantiated desde menu: \(passwordManagerVC)")
            
            // Configure the presentation as modal
            passwordManagerVC.modalPresentationStyle = .fullScreen
            passwordManagerVC.modalTransitionStyle = .coverVertical
            passwordManagerVC.isModalInPresentation = true
            
            NSLog("🔐 About to present PasswordManagerViewController desde menu")
            self.present(passwordManagerVC, animated: true) {
                NSLog("✅ PasswordManagerViewController presented successfully desde menu!")
            }
        }
    }
    
    @objc private func closePasswordChange() {
        dismiss(animated: true)
    }
    
    private func showLogoutConfirmation() {
        lblModalText.text = "¿Estás seguro de que quieres cerrar sesión?"
        imgModal.image = UIImage(named: "logout")
        
        // Configurar botón de confirmación
        var config = btnModal.configuration
        if config == nil {
            config = UIButton.Configuration.filled()
        }
        config?.baseBackgroundColor = UIColor(hex: "#FF2147")
        config?.baseForegroundColor = .white
        btnModal.isHidden = false
        btnModal.configuration = config
        btnModal.setTitle("Cerrar Sesión", for: .normal)
        
        // Cambiar acción del botón modal
        btnModal.removeTarget(nil, action: nil, for: .allEvents)
        btnModal.addTarget(self, action: #selector(confirmLogout), for: .touchUpInside)
        
        btnCloseModal.setTitle("Cancelar", for: .normal)
        showModal()
    }
    
    @objc private func confirmLogout() {
        // Realizar logout
        performLogout()
    }
    
    private func performLogout() {
        // Limpiar datos de autenticación
        clearAuthData()
        
        // Cerrar modal
        dismissModal(self)
        
        // Enviar notificación para hacer logout
        NotificationCenter.default.post(name: NSNotification.Name("PerformLogout"), object: nil)
        // Cerrar el menú actual
        dismiss(animated: true)
    }
    
    // MARK: - Panic Button Actions
    private func sendPanicAlert() {
        guard let token = accessToken else {
            print("❌ No hay token para enviar alerta de pánico")
            showErrorAlert(message: "Error de autenticación. Por favor inicia sesión nuevamente.")
            return
        }
        
        guard let userId = userData?["id"] as? Int else {
            showErrorAlert(message: "No se encontró el ID de usuario.")
            return
        }
        
        guard let vehicleName = scannedVehicleName else {
            showErrorAlert(message: "No se ha registrado el vehículo. Escanea el QR primero.")
            return
        }
        
        guard let location = currentLocation else {
            showErrorAlert(message: "No se pudo obtener la ubicación actual. Por favor permite el acceso a la ubicación.")
            return
        }
        
        // Formatear fecha
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let dateTime = formatter.string(from: Date())
        
        // Crear body JSON
        let body: [String: Any] = [
            "user_id": userId,
            "vehicle_name": vehicleName,
            "alarm_name": "Boton de panico",
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "date_time": dateTime
        ]
        
        guard let url = URL(string: "https://spotme.jafetguzman.me/tracking/api/exceptions/insert/virtual-button") else {
            showErrorAlert(message: "Error de configuración")
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            showErrorAlert(message: "Error preparando la alerta")
            return
        }
        
        // Enviar request
        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            DispatchQueue.main.async {
                if let error = error {
                    print("❌ Error enviando alerta: \(error.localizedDescription)")
                    self?.showErrorAlert(message: "Error enviando alerta. Verifica tu conexión.")
                    return
                }
                
                if let httpResponse = response as? HTTPURLResponse {
                    if httpResponse.statusCode == 200 || httpResponse.statusCode == 201 {
                        if let data = data,
                           let responseString = String(data: data, encoding: .utf8) {
                            print("✅ Alerta de pánico enviada exitosamente, respuesta del servidor: \(responseString)")
                        } else {
                            print("✅ Alerta de pánico enviada exitosamente, sin contenido en la respuesta.")
                        }
                        self?.showPanicSuccess()
                    } else {
                        print("❌ Error del servidor: \(httpResponse.statusCode)")
                        var errorMsg = "Error del servidor al enviar alerta."
                        
                        if let data = data,
                           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                           let message = json["message"] as? String {
                            errorMsg = message
                        }
                        self?.showErrorAlert(message: errorMsg)
                    }
                }
            }
        }.resume()
    }

    
    private func showPanicSuccess() {
        lblModalText.text = "Tu alarma de pánico ha sido registrada y enviada exitosamente"
        imgModal.image = UIImage(named: "customer-care")
        btnModal.isHidden = true
        btnCloseModal.setTitle("Confirmar", for: .normal)
    }
    
    private func showErrorAlert(message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
    
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        if segue.identifier == "QRViewController" {
            if let qrVC = segue.destination as? QRViewController {
                // Pasar los datos de usuario al QRViewController
                qrVC.userData = self.userData
                qrVC.accessToken = self.accessToken
            }
        }
    }
}

extension UIColor {
    convenience init(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")

        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)

        let r = CGFloat((rgb & 0xFF0000) >> 16) / 255
        let g = CGFloat((rgb & 0x00FF00) >> 8) / 255
        let b = CGFloat(rgb & 0x0000FF) / 255

        self.init(red: r, green: g, blue: b, alpha: 1)
    }
}
