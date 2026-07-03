# SpotMe Production Deployment Script
### Para ejecutar este deployment, usa los siguientes comandos en orden:

## PASO PREVIO: Crear infraestructura Azure y subir imágenes Docker
### Este paso es necesario ANTES de ejecutar el deployment principal

## 1. Crear grupo de recursos y cluster AKS
```bash
# Crear el grupo de recursos si no existe
az group create --name kubernetes-group-spotme --location mexicocentral

# Crear el cluster AKS con 2 nodos
az aks create --resource-group kubernetes-group-spotme --name kubernetes-spotme-cluster --node-count 1 --node-vm-size Standard_B2s --location mexicocentral --enable-managed-identity --generate-ssh-keys --kubernetes-version 1.32.5

# Configurar kubectl para conectarse al cluster
az aks get-credentials --resource-group kubernetes-group-spotme --name kubernetes-spotme-cluster
```

## 2. Verificar el estado del cluster
```bash
# Verificar que los nodos estén funcionando
kubectl get nodes

# Verificar los servicios desplegados
kubectl get services

# Verificar todos los pods
kubectl get pods

# Verificar pods en todos los namespaces
kubectl get pods -A
```

## 3. Crear Azure Container Registry (ACR)
```bash
# Crear el ACR
az acr create --resource-group kubernetes-group-spotme --name spotmeacr --sku Basic

# Hacer login al ACR
az acr login --name spotmeacr
```

## 4. Construir y subir imagen del Frontend
```bash
# Navegar al directorio del frontend
cd SpotMe-WEB-React

# Construir la imagen Docker
docker build -t spotme-k8s-frontend:latest .

# Etiquetar la imagen para el ACR
docker tag spotme-k8s-frontend:latest spotmeacr.azurecr.io/spotme-k8s-frontend:latest

# Subir la imagen al ACR
docker push spotmeacr.azurecr.io/spotme-k8s-frontend:latest
```

## 5. Construir y subir imagen de la API de Usuarios
```bash
# Navegar al directorio de la API de usuarios
cd ../SpotMe-API-Users-Laravel

# Construir la imagen Docker
docker build -t spotme-k8s-users-api:latest .

# Etiquetar la imagen para el ACR
docker tag spotme-k8s-users-api:latest spotmeacr.azurecr.io/spotme-k8s-users-api:latest

# Subir la imagen al ACR
docker push spotmeacr.azurecr.io/spotme-k8s-users-api:latest

kubectl rollout status deployment/users-api -n spotme
```

## 6. Construir y subir imagen de la API de Tracking
```bash
# Navegar al directorio de la API de tracking
cd ../SpotMe-API-Tracking-Laravel

# Construir la imagen Docker
docker build -t spotme-k8s-tracking-api:latest .

# Etiquetar la imagen para el ACR
docker tag spotme-k8s-tracking-api:latest spotmeacr.azurecr.io/spotme-k8s-tracking-api:latest

# Subir la imagen al ACR
docker push spotmeacr.azurecr.io/spotme-k8s-tracking-api:latest
```

## 7. Conectar ACR con el cluster de AKS
```bash
# Conectar ACR al cluster de AKS para que pueda hacer pull de las imágenes
az aks update -n kubernetes-spotme-cluster -g kubernetes-group-spotme --attach-acr spotmeacr
```

## 8. Verificar imágenes en ACR
```bash
# Listar las imágenes en el ACR
az acr repository list --name spotmeacr --output table

# Ver tags de una imagen específica
az acr repository show-tags --name spotmeacr --repository spotme-k8s-frontend --output table
```

**NOTA:** Una vez completado este proceso, las imágenes estarán disponibles en:
- `spotmeacr.azurecr.io/spotme-k8s-frontend:latest`
- `spotmeacr.azurecr.io/spotme-k8s-users-api:latest`
- `spotmeacr.azurecr.io/spotme-k8s-tracking-api:latest`

---

# DEPLOYMENT PRINCIPAL
**Ejecutar después de completar todos los pasos previos**
## 1. Crear namespace, configmap y secrets
```bash
kubectl apply -f .\kubernetes\01-namespace.yaml
kubectl apply -f .\kubernetes\config\

# Aplicar los certificados SSL de Cloudflare a Kubernetes
kubectl create secret tls cloudflare-ssl --cert=.\kubernetes\config\09-loadbalancer\origin.pem --key=.\kubernetes\config\09-loadbalancer\origin.key -n spotme
# Para config rapida y asi ya no tener que crear los deploys manualmente
kubectl apply -f .\kubernetes\
```

## 2. Deployar las bases de datos (Master primero, luego Replica)
```bash
kubectl apply -f 04-mysql-master-updated.yaml

kubectl apply -f 05-mysql-replica-updated.yaml
```

## 3. Deployar las APIs
```bash

kubectl apply -f 06-users-api-updated.yaml
kubectl apply -f 07-tracking-api-updated.yaml
# Esperar a que las APIs estén listas
kubectl wait --for=condition=ready pod -l app=users-api -n spotme --timeout=300s
kubectl wait --for=condition=ready pod -l app=tracking-api -n spotme --timeout=300s
```

## 4. Deployar el Frontend
```bash
kubectl apply -f 08-frontend-updated.yaml
# Esperar a que el Frontend esté listo
kubectl wait --for=condition=ready pod -l app=frontend -n spotme --timeout=300s
```

## 5. Deployar el Load Balancer
```bash
# Instalar Ingress Controller (si no está instalado)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.13.0/deploy/static/provider/cloud/deploy.yaml

kubectl apply -f 09-loadbalancer-production.yaml
# Esperar a que el Load Balancer esté listo
kubectl wait --for=condition=ready pod -l app=spotme-nginx-gateway -n spotme --timeout=300s
```

## 6. Aplicar Network Policies
```bash
kubectl apply -f 10-network-policies-updated.yaml
```

---

# VERIFICACIÓN Y DIAGNÓSTICO

## 7. Verificar el deployment
```bash
kubectl get all -n spotme
kubectl get ingress -n spotme
kubectl get secrets -n spotme
kubectl get configmap -n spotme
```

## 8. Verificar conectividad
```bash
echo "Verificando conectividad entre servicios..."
kubectl exec -it -n spotme $(kubectl get pods -n spotme -l app=users-api -o jsonpath="{.items[0].metadata.name}") -- nc -zv mysql-master-service.spotme.svc.cluster.local 50450
kubectl exec -it -n spotme $(kubectl get pods -n spotme -l app=tracking-api -o jsonpath="{.items[0].metadata.name}") -- nc -zv mysql-replica-service.spotme.svc.cluster.local 50460
```

## 9. Obtener la IP pública del Load Balancer
```bash
kubectl get service spotme-loadbalancer -n spotme -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

## 10. Ver logs si hay problemas
```bash
# Logs de diferentes servicios
kubectl logs -n spotme -l app=mysql-master
kubectl logs -n spotme -l app=mysql-replica
kubectl logs -n spotme -l app=users-api
kubectl logs -n spotme -l app=tracking-api
kubectl logs -n spotme -l app=frontend
kubectl logs -n spotme -l app=spotme-nginx-gateway
```

---

# CONFIGURACIÓN DE PUERTOS

**Puertos y servicios configurados:**
- **Load Balancer**: 443 (HTTPS público), 80 (HTTP -> redirige a HTTPS)
- **Users API**: 50350 (HTTPS interno)
- **Tracking API**: 50351 (HTTPS interno)
- **Frontend**: 50500 (HTTPS interno)
- **MySQL Master**: 50450 (TLS interno)
- **MySQL Replica**: 50460 (TLS interno)

---

# NOTAS IMPORTANTES

**IMPORTANTE: Antes de hacer el deployment, asegúrate de:**
1. Reemplazar los certificados SSL en `03-secrets-updated.yaml` con certificados reales
2. Configurar las imágenes Docker correctas en cada deployment
3. Verificar que el cluster de Kubernetes está configurado correctamente
4. Tener suficientes recursos en el cluster (CPU, memoria, almacenamiento)

**NOTAS ADICIONALES:**
- ServiceMonitor ha sido removido de los archivos porque requiere Prometheus Operator
- Si necesitas monitoreo, instala Prometheus Operator primero:
  ```bash
  kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
  ```
- Los health checks están configurados en `/health` endpoint de cada servicio
