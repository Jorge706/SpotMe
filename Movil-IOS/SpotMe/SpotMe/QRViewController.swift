//
//  QRViewController.swift
//  SpotMe
//
//  Created by Carolina Rodríguez on 29/07/25.
//

import UIKit
import AVFoundation

class QRViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {

    @IBOutlet weak var GlassView: UIView!
    @IBOutlet var QRCodeView: UIView!
    @IBOutlet weak var CameraView: UIView!
    
    @IBOutlet weak var btnGoBack: UIButton!
    @IBOutlet weak var btnConfirmar: UIButton!
    
    private let gradientLayer = CAGradientLayer()

    // MARK: - Camera Session Properties
    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    
    var userData: [String: Any]?
    var accessToken: String?
    
    var scannedVehicleName: String?

    override func viewDidLoad() {
        super.viewDidLoad()

        // Gradient Background Setup
        GlassView.backgroundColor = .clear
        gradientLayer.colors = [
            UIColor(red: 0/255, green: 178/255, blue: 202/255, alpha: 0.8).cgColor,
            UIColor(red: 0/255, green: 88/255, blue: 122/255, alpha: 0.7).cgColor
        ]
        gradientLayer.startPoint = CGPoint(x: 0.5, y: 0.0)
        gradientLayer.endPoint = CGPoint(x: 0.5, y: 1.0)
        GlassView.layer.insertSublayer(gradientLayer, at: 0)
        
        applyShadow(to: btnConfirmar)
        applyShadow(to: btnGoBack)
        view.bringSubviewToFront(CameraView)

        // Start camera session
        setupCamera()
        
        
        print("Datos recibidos: \(String(describing: userData))")
        print("Token recibido: \(String(describing: accessToken))")
    }
    
    private func applyShadow(to button: UIButton) {
        button.layer.shadowColor = UIColor.black.cgColor
        button.layer.shadowOpacity = 0.25
        button.layer.shadowOffset = CGSize(width: 0, height: 4)
        button.layer.shadowRadius = 6
        button.layer.masksToBounds = false
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()

        gradientLayer.frame = GlassView.bounds
        previewLayer?.frame = QRCodeView.bounds

        // Only add if not already added
        if let preview = previewLayer, preview.superlayer == nil {
            QRCodeView.layer.addSublayer(preview)
        }
    }


    private func setupCamera() {
        captureSession = AVCaptureSession()

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            guard let self = self else { return }

            guard let videoDevice = AVCaptureDevice.default(for: .video),
                  let videoInput = try? AVCaptureDeviceInput(device: videoDevice),
                  self.captureSession?.canAddInput(videoInput) == true else {
                DispatchQueue.main.async {
                    self.showError(message: "No se pudo acceder a la cámara.")
                }
                return
            }

            self.captureSession?.addInput(videoInput)

            let metadataOutput = AVCaptureMetadataOutput()
            guard self.captureSession?.canAddOutput(metadataOutput) == true else {
                DispatchQueue.main.async {
                    self.showError(message: "No se pudo agregar el escáner de QR.")
                }
                return
            }

            self.captureSession?.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]

            let previewLayer = AVCaptureVideoPreviewLayer(session: self.captureSession!)
            previewLayer.videoGravity = .resizeAspectFill
            self.previewLayer = previewLayer

            DispatchQueue.main.async {
                // Wait until the next run loop cycle when layout is complete
                self.QRCodeView.layoutIfNeeded()
                previewLayer.frame = self.QRCodeView.bounds

                if previewLayer.superlayer == nil {
                    self.QRCodeView.layer.addSublayer(previewLayer)
                }
            }

            self.captureSession?.startRunning()
        }
    }


    
    @IBAction func goBack(_ sender: Any) {
        self.dismiss(animated: true, completion: nil)
    }
    

    func metadataOutput(_ output: AVCaptureMetadataOutput,
                        didOutput metadataObjects: [AVMetadataObject],
                        from connection: AVCaptureConnection) {
        captureSession?.stopRunning()

        if let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
           let qrValue = metadataObject.stringValue {

            // Intentar parsear el QR como JSON
            if let data = qrValue.data(using: .utf8) {
                do {
                    if let qrDict = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                       let vehicleName = qrDict["vehicle_name"] as? String {

                        // ✅ Enviar al MenuViewController por notificación
                        NotificationCenter.default.post(
                            name: Notification.Name("VehicleNameScanned"),
                            object: nil,
                            userInfo: ["vehicleName": vehicleName]
                        )
                        print("📡 Notificación enviada con vehicle_name: \(vehicleName)")

                        // Cerrar la vista del QR
                        self.dismiss(animated: true, completion: nil)

                    } else {
                        showError(message: "QR no contiene 'vehicle_name'.")
                    }
                } catch {
                    showError(message: "Error al leer el QR como JSON.")
                }
            }
        }
    }

    


    
    // MARK: - Indicador de carga
    var loadingIndicator: UIActivityIndicatorView?

    private func showLoading() {
        loadingIndicator = UIActivityIndicatorView(style: .large)
        loadingIndicator?.center = self.view.center
        loadingIndicator?.color = .gray
        loadingIndicator?.startAnimating()
        self.view.addSubview(loadingIndicator!)
    }

    private func hideLoading() {
        loadingIndicator?.stopAnimating()
        loadingIndicator?.removeFromSuperview()
        loadingIndicator = nil
    }

    private func sendDriverChange(vehicleName: String) {
        guard let token = accessToken,
              let userId = userData?["id"] as? Int else {
            showError(message: "Faltan datos de autenticación.")
            return
        }
        
        // Mostrar spinner
        showLoading()

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        let dateTime = formatter.string(from: Date())

        let body: [String: Any] = [
            "user_id": userId,
            "vehicle_name": vehicleName,
            "date_time": dateTime
        ]

        guard let url = URL(string: "https://spotme.jafetguzman.me/tracking/api/driver-changes/insert") else {
            hideLoading()
            showError(message: "URL inválida.")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body, options: [])
        } catch {
            hideLoading()
            showError(message: "Error al preparar datos.")
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                // Ocultar spinner
                self.hideLoading()
                
                if let error = error {
                    self.showError(message: "Error de red: \(error.localizedDescription)")
                    return
                }

                guard let httpResponse = response as? HTTPURLResponse else {
                    self.showError(message: "Respuesta inválida del servidor.")
                    return
                }

                if httpResponse.statusCode == 200 {
                    self.showSuccess(message: "Conductor registrado correctamente.")
                } else {
                    var serverMessage = "Error desconocido"
                    if let data = data {
                        if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                           let code = json["code"] as? Int,
                           let message = json["message"] as? String {
                            
                            print("Error \(code): \(message)")
                            serverMessage = "Error \(code): \(message)"
                        }
                    }
                    self.showError(message: serverMessage)
                }
            }
        }
        task.resume()
    }

    
    private func showSuccess(message: String) {
        let alert = UIAlertController(title: "Éxito", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default, handler: { _ in
            self.dismiss(animated: true)
        }))
        present(alert, animated: true)
    }




    private func showResult(_ value: String) {
        let alert = UIAlertController(title: "QR Escaneado", message: value, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cerrar", style: .default, handler: { _ in
            self.captureSession?.startRunning() // Restart if needed
        }))
        present(alert, animated: true)
    }

    private func showError(message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cerrar", style: .default))
        present(alert, animated: true)
    }

    // Stop session when leaving
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession?.stopRunning()
    }
}

