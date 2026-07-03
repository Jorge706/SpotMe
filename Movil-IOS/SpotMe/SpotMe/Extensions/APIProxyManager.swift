//
//  APIProxyManager.swift
//  SpotMe
//
//  Created by System on 07/08/25.
//

import Foundation

// MARK: - API Proxy Manager (Similar to Vite proxy)
class APIProxyManager {
    
    // MARK: - Proxy Configuration (Similar to vite.config.js)
    private static let proxyRules: [String: ProxyRule] = [
        "/user-api": ProxyRule(
            target: "https://spotme.jafetguzman.me/",
            rewrite: { path in
                return path.replacingOccurrences(of: "^/user-api", with: "users/api/", options: .regularExpression)
            }
        ),
        "/tracking-api": ProxyRule(
            target: "https://spotme.jafetguzman.me/",
            rewrite: { path in
                return path.replacingOccurrences(of: "^/tracking-api", with: "tracking/api/", options: .regularExpression)
            }
        )
    ]
    
    // MARK: - Proxy Rule Structure
    private struct ProxyRule {
        let target: String
        let rewrite: (String) -> String
    }
    
    // MARK: - Main Proxy Resolution Method
    static func resolveURL(for path: String) -> String? {
        print("🔄 [PROXY] Resolviendo URL para path: \(path)")
        
        // Buscar la regla de proxy que coincida
        for (proxyPath, rule) in proxyRules {
            if path.hasPrefix(proxyPath) {
                let rewrittenPath = rule.rewrite(path)
                
                // Asegurar que no hay dobles barras
                var cleanTarget = rule.target
                if cleanTarget.hasSuffix("/") {
                    cleanTarget = String(cleanTarget.dropLast())
                }
                
                var cleanPath = rewrittenPath
                if !cleanPath.hasPrefix("/") {
                    cleanPath = "/" + cleanPath
                }
                
                let finalURL = cleanTarget + cleanPath
                
                print("✅ [PROXY] \(path) -> \(finalURL)")
                return finalURL
            }
        }
        
        // Si no hay regla de proxy, devolver la URL original
        print("⚠️ [PROXY] No se encontró regla para: \(path)")
        return path
    }
    
    // MARK: - Convenience Methods for Common APIs
    static func getUserAPIURL() -> String {
        return resolveURL(for: "/user-api/") ?? "https://spotme.jafetguzman.me/users/api/"
    }
    
    static func getTrackingAPIURL() -> String {
        return resolveURL(for: "/tracking-api/") ?? "https://spotme.jafetguzman.me/tracking/api/"
    }
    
    // MARK: - Method to test proxy resolution
    static func testProxyResolution() {
        print("🧪 [PROXY] Probando resolución de URLs:")
        print("  /user-api/ -> \(resolveURL(for: "/user-api/") ?? "nil")")
        print("  /user-api/user -> \(resolveURL(for: "/user-api/user") ?? "nil")")
        print("  /user-api/vehicles -> \(resolveURL(for: "/user-api/vehicles") ?? "nil")")
        print("  /tracking-api/ -> \(resolveURL(for: "/tracking-api/") ?? "nil")")
    }
    
    // MARK: - Method to add new proxy rules dynamically
    static func addProxyRule(path: String, target: String, rewritePattern: String, replacement: String) {
        // Esta función permitiría agregar reglas dinámicamente si fuera necesario
        print("📝 [PROXY] Agregando regla: \(path) -> \(target)")
    }
    
    // MARK: - Debug Method
    static func printAllRules() {
        print("📋 [PROXY] Reglas de proxy configuradas:")
        for (path, rule) in proxyRules {
            print("  \(path) -> \(rule.target)")
        }
    }
}

// MARK: - URL Request Extension with Proxy Support
extension URLRequest {
    
    // Inicializador que usa el proxy automáticamente
    init(proxyPath: String, httpMethod: String = "GET") {
        let resolvedURL = APIProxyManager.resolveURL(for: proxyPath) ?? proxyPath
        self.init(url: URL(string: resolvedURL)!)
        self.httpMethod = httpMethod
        self.setValue("application/json", forHTTPHeaderField: "Content-Type")
        self.setValue("application/json", forHTTPHeaderField: "Accept")
    }
    
    // Método para agregar Bearer token
    mutating func setBearerToken(_ token: String) {
        self.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    }
}
