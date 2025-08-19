#!/bin/bash

# install-metrics-server.sh
# Script para instalar el Metrics Server en Kubernetes

set -e

# Check if running in quiet mode or fast mode
QUIET_MODE=false
FAST_MODE=false
if [ "$1" = "--quiet" ]; then
    QUIET_MODE=true
    FAST_MODE=true
elif [ "$1" = "--fast" ]; then
    FAST_MODE=true
fi

# Function to print messages (only if not in quiet mode)
print_message() {
    if [ "$QUIET_MODE" = false ]; then
        echo "$1"
    fi
}

print_message "=== Instalando Metrics Server ==="

# Verificar que kubectl esté disponible
if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl no está instalado o no está en el PATH"
    exit 1
fi

# Verificar conexión al cluster
if ! kubectl cluster-info &> /dev/null; then
    echo "ERROR: No se puede conectar al cluster de Kubernetes"
    exit 1
fi

print_message "1. Verificando si el Metrics Server ya está instalado..."
if kubectl get deployment metrics-server -n kube-system &> /dev/null; then
    print_message "   ✓ Metrics Server ya está instalado"
    
    # Verificar si está funcionando
    if kubectl top nodes &> /dev/null; then
        print_message "   ✓ Metrics Server está funcionando correctamente"
        print_message "=== Instalación completada ==="
        exit 0
    else
        print_message "   ⚠ Metrics Server está instalado pero no funciona correctamente"
        print_message "   Procediendo a reconfigurar..."
        # Limpiar pods problemáticos
        kubectl delete pods -l k8s-app=metrics-server -n kube-system --field-selector=status.phase=Failed 2>/dev/null || true
    fi
else
    print_message "   ℹ Metrics Server no está instalado"
fi

print_message "2. Instalando Metrics Server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

print_message "3. Configurando Metrics Server para Docker Desktop..."
# Agregar el flag --kubelet-insecure-tls para Docker Desktop
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'

print_message "4. Esperando a que el Metrics Server esté listo..."
# En modo fast/quiet, omitir las verificaciones lentas
if [ "$FAST_MODE" = true ]; then
    print_message "   ✓ Configuración aplicada (omitiendo verificación para acelerar)"
else
    # Reducir timeout y manejar posibles errores
    if kubectl wait --for=condition=ready pod -l k8s-app=metrics-server -n kube-system --timeout=60s 2>/dev/null; then
        print_message "   ✓ Metrics Server está listo"
    else
        print_message "   ⚠ Timeout esperando el Metrics Server, pero puede estar funcionando"
        # Intentar limpiar pods antiguos
        kubectl delete pods -l k8s-app=metrics-server -n kube-system --field-selector=status.phase=Failed 2>/dev/null || true
    fi
fi

print_message "5. Verificando que las métricas funcionen..."
# En modo silencioso/fast, no hacer verificaciones adicionales para acelerar el proceso
if [ "$QUIET_MODE" = false ] && [ "$FAST_MODE" = false ]; then
    # Esperar un poco más para que las métricas estén disponibles
    sleep 10
    
    if kubectl top nodes &> /dev/null; then
        print_message "   ✓ Métricas de nodos funcionando"
    else
        print_message "   ⚠ Las métricas de nodos aún no están disponibles"
        print_message "   Esto puede ser normal, espera unos minutos más"
    fi
fi

print_message "=== Metrics Server instalado exitosamente ==="

# Always show success message, even in quiet mode
if [ "$QUIET_MODE" = true ]; then
    echo "✓ Metrics Server configurado correctamente"
fi

if [ "$QUIET_MODE" = false ]; then
    echo ""
    echo "Comandos útiles:"
    echo "  kubectl top nodes          # Ver métricas de nodos"
    echo "  kubectl top pods           # Ver métricas de todos los pods"
    echo "  kubectl top pods -n spotme # Ver métricas de pods de SpotMe"
    echo ""
    echo "Nota: Las métricas pueden tardar 1-2 minutos en estar disponibles"
fi

# Terminar exitosamente
exit 0
