# SpotMe - Scripts de Despliegue Automático

Este conjunto de scripts automatiza completamente el despliegue de la infraestructura de SpotMe en Azure Kubernetes Service (AKS).

## 📋 Scripts Disponibles

### 1. `spotme-setup.sh` - Configuración inicial
Configura el entorno y verifica prerrequisitos.

### 2. `spotme-full-deploy.sh` - Despliegue completo
Despliega toda la infraestructura de SpotMe automáticamente.

### 3. `spotme-cleanup.sh` - Limpieza de recursos
Elimina todos los recursos de SpotMe en Azure.

### 4. `aks-quick-setup-no-monitor.sh` - Solo AKS
Crea únicamente el clúster AKS (sin aplicaciones).

## 🚀 Uso Rápido

### Opción 1: Despliegue Básico (Recomendado)
```bash
# 1. Configurar entorno
./spotme-setup.sh

# 2. Desplegar SpotMe
./spotme-full-deploy.sh
```

### Opción 2: Despliegue Completo con ACR
```bash
# 1. Configurar entorno
./spotme-setup.sh

# 2. Desplegar con Container Registry
./spotme-full-deploy.sh --with-acr --build-images
```

### Opción 3: Usar Cluster Existente
```bash
# Desplegar solo aplicaciones (sin crear cluster)
./spotme-full-deploy.sh --skip-cluster
```

## 📖 Opciones del Script Principal

### `spotme-full-deploy.sh`

```bash
Uso: ./spotme-full-deploy.sh [OPCIONES]

Opciones:
  -p, --project-name      Nombre del proyecto (default: spotme)
  -l, --location          Ubicación de Azure (default: East US)
  --with-acr              Crear Azure Container Registry
  --skip-cluster          Saltar creación de cluster AKS
  --build-images          Construir y subir imágenes Docker
  -h, --help              Mostrar ayuda

Ejemplos:
  ./spotme-full-deploy.sh
  ./spotme-full-deploy.sh -p miproyecto -l "West Europe" --with-acr
  ./spotme-full-deploy.sh --with-acr --build-images
```

## 🛠️ Prerrequisitos

1. **Azure CLI**: `winget install Microsoft.AzureCLI`
2. **Docker Desktop** (solo para --build-images)
3. **Git Bash** (en Windows)

## 📂 Estructura del Proyecto

```
SpotMe-Infra-K8s/
├── scripts/
│   ├── spotme-setup.sh           # Configuración inicial
│   ├── spotme-full-deploy.sh     # Despliegue completo
│   ├── spotme-cleanup.sh         # Limpieza
│   └── aks-quick-setup-no-monitor.sh
├── kubernetes/
│   ├── 01-namespace.yaml         # Namespace
│   ├── 02-configmap.yaml         # Configuración
│   ├── 03-secrets.yaml           # Secretos
│   ├── 04-mysql-master.yaml      # Base de datos
│   ├── 05-mysql-replica.yaml     # Réplica BD
│   ├── 06-users-api.yaml         # API Usuarios
│   ├── 07-tracking-api.yaml      # API Tracking
│   ├── 08-frontend.yaml          # Frontend
│   └── 09-ingress-loadbalancer.yaml  # Load Balancer
```

## 🔧 Proceso Automático

El script `spotme-full-deploy.sh` ejecuta estos pasos:

1. ✅ **Validación de prerrequisitos**
2. ✅ **Registro de proveedores de Azure**
3. ✅ **Creación de grupo de recursos**
4. ✅ **Creación de Azure Container Registry** (opcional)
5. ✅ **Creación de clúster AKS**
6. ✅ **Configuración de kubectl**
7. ✅ **Construcción de imágenes Docker** (opcional)
8. ✅ **Despliegue de manifiestos de Kubernetes**
9. ✅ **Verificación del despliegue**
10. ✅ **Obtención de IP externa**

## 🌐 Acceso a la Aplicación

Después del despliegue exitoso:

1. **URL de la aplicación**: `http://[EXTERNAL-IP]`
2. **Dashboard de Kubernetes**: `az aks browse --resource-group [RG] --name [CLUSTER]`

## 📊 Monitoreo

```bash
# Ver pods
kubectl get pods -n spotme

# Ver servicios
kubectl get services -n spotme

# Ver logs
kubectl logs -f deployment/spotme-frontend -n spotme

# Ver estado del cluster
kubectl get nodes
```

## 🧹 Limpieza

Para eliminar todos los recursos:

```bash
./spotme-cleanup.sh
```

## 🚨 Solución de Problemas

### Error de Cuota de vCPU
Si obtienes error de cuota, el script usa configuración mínima:
- 2 nodos
- Standard_B2s (2 vCPU cada uno)
- Total: 4 vCPU

### Error de Proveedores
El script registra automáticamente todos los proveedores necesarios.

### Timeout de Despliegue
Los deployments tienen un timeout de 5 minutos. Si falla, revisa:
```bash
kubectl describe pod [POD-NAME] -n spotme
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs del script
2. Verifica la cuota de Azure
3. Asegúrate de estar autenticado: `az account show`

## 🔄 Actualizaciones

Para actualizar la aplicación:
1. Modifica el código
2. Ejecuta: `./spotme-full-deploy.sh --skip-cluster --build-images`
