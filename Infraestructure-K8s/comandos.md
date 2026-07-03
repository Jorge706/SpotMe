# Comandos para crear y configurar el cluster de Kubernetes en Azure

## Crear el cluster AKS
```bash
# Crear el grupo de recursos
az group create --name kubernetes-test-rg --location mexicocentral

# Crear el cluster AKS con 2 nodos
az aks create --resource-group kubernetes-test-rg --name kubernetes-test-cluster --node-count 2 --node-vm-size Standard_B2s --location mexicocentral --enable-managed-identity --generate-ssh-keys --kubernetes-version 1.30

# Configurar kubectl para conectarse al cluster
az aks get-credentials --resource-group kubernetes-test-rg --name kubernetes-test-cluster
```

## Verificar el estado del cluster
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

## Construir las imágenes Docker
```bash
# Construir imagen del frontend React
cd SpotMe-WEB-React
docker build -t spotme-k8s-frontend:latest .

# Construir imagen de la API de usuarios
cd SpotMe-API-Users-Laravel
docker build -t spotme-k8s-users-api:latest .

# Construir imagen de la API de tracking
cd SpotMe-API-Tracking-Laravel
docker build -t spotme-k8s-tracking-api:latest .
```

## Desplegar aplicación React
```bash
# Aplicar el deployment de prueba
kubectl apply -f frontend-test-deploy.yaml

# Verificar el estado del deployment
kubectl get deployment frontend-test

# Verificar el estado del servicio
kubectl get svc frontend-test-service

# Describir el servicio para ver eventos
kubectl describe svc frontend-test-service
```

## Construir y copiar la aplicación React
```bash
# Construir la aplicación React
cd SpotMe-WEB-React
npm run build

# Copiar archivos al pod (desde directorio dist)
cd dist
kubectl cp index.html frontend-test-74c8d4c957-75phm:/usr/share/nginx/html/index.html
kubectl cp assets frontend-test-74c8d4c957-75phm:/usr/share/nginx/html/assets
```

## Gestión de IPs públicas
```bash
# Listar IPs públicas utilizadas
az network public-ip list --query "[].{Name:name, IP:ipAddress, ResourceGroup:resourceGroup}" --output table

# Eliminar servicios que consumen IPs públicas
kubectl delete svc frontend-loadbalancer -n spotme
kubectl delete svc spotme-simple-lb -n spotme

# Asignar IP específica a un servicio
kubectl patch svc frontend-test-service --patch-file patch-ip.yaml
```

## Crear port-forward para acceso local
```bash
# Crear port-forward para acceso local en puerto 8080
kubectl port-forward service/frontend-test-service 8080:80
```

## Gestión de registry local (opcional)
```bash
# Crear registry local
docker run -d -p 5000:5000 --name registry registry:2

# Tagear imagen para registry local
docker tag spotme-k8s-frontend:latest localhost:5000/spotme-frontend:latest

# Push imagen al registry local
docker push localhost:5000/spotme-frontend:latest
```

## Resultado final
- **Aplicación desplegada**: SpotMe Frontend React
- **IP pública**: 158.23.230.68
- **Puerto**: 80 (HTTP)
- **Acceso local**: http://localhost:8080 (port-forward)
- **Cluster**: kubernetes-test-cluster en Mexico Central

az group create --name rg-spotme-prod --location westus2
azd env set AZURE_LOCATION eastus

azd up