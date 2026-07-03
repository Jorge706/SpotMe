#!/bin/bash

# SpotMe Kubernetes Deployment Script
# This script deploys the entire SpotMe infrastructure to Kubernetes you have to run it with bash can be git bash as :./script/deploy.sh

set -e

echo "🚀 Starting SpotMe Kubernetes deployment..."

# Configuration
NAMESPACE="spotme"
KUBECTL_CMD="kubectl"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if kubectl is installed
if ! command -v $KUBECTL_CMD &> /dev/null; then
    print_error "kubectl is not installed. Please install kubectl first."
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    print_error "docker is not installed. Please install Docker first."
    exit 1
fi

# Check if cluster is accessible
if ! $KUBECTL_CMD cluster-info &> /dev/null; then
    print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
    exit 1
fi

print_status "Kubernetes cluster is accessible"

# Install Metrics Server using dedicated script
print_status "Installing Metrics Server..."
if [ -f "install-metrics-server.sh" ]; then
    chmod +x install-metrics-server.sh
    ./install-metrics-server.sh --quiet
    print_status "Metrics Server installation completed"
else
    print_warning "install-metrics-server.sh not found, skipping Metrics Server installation"
fi

# Build Docker images
print_status "Building Docker images..."

# Build frontend image
print_status "Building frontend image..."
cd "../SpotMe-WEB-React"
if [ -f "Dockerfile" ]; then
    docker build -t spotme/frontend:latest .
    print_status "Frontend image built successfully"
else
    print_error "Frontend Dockerfile not found"
    exit 1
fi

# Build users API image
print_status "Building users API image..."
cd "../SpotMe-API-Users-Laravel"
if [ -f "Dockerfile" ]; then
    docker build -t spotme/users-api:latest .
    print_status "Users API image built successfully"
else
    print_error "Users API Dockerfile not found"
    exit 1
fi

# Build tracking API image
print_status "Building tracking API image..."
cd "../SpotMe-API-Tracking-Laravel"
if [ -f "Dockerfile" ]; then
    docker build -t spotme/tracking-api:latest .
    print_status "Tracking API image built successfully"
else
    print_error "Tracking API Dockerfile not found"
    exit 1
fi

# Return to infrastructure directory
cd "../SpotMe-Infra-K8s"
print_status "All Docker images built successfully!"

# Change to scripts directory for deployment
cd "scripts"

# Deploy resources in order
DEPLOYMENT_FILES=(
    "../kubernetes/01-namespace.yaml"
    "../kubernetes/02-configmap.yaml"
    "../kubernetes/03-secrets.yaml"
    "../kubernetes/04-mysql-master.yaml"
    "../kubernetes/05-mysql-replica.yaml"
    "../kubernetes/06-users-api.yaml"
    "../kubernetes/07-tracking-api.yaml"
    "../kubernetes/08-frontend.yaml"
    "../kubernetes/09-ingress-loadbalancer.yaml"
    "../kubernetes/10-network-policies.yaml"
    "../kubernetes/11-monitoring.yaml"
)

print_status "Deploying SpotMe infrastructure..."

for file in "${DEPLOYMENT_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_status "Applying $file..."
        $KUBECTL_CMD apply -f "$file"
        sleep 2
    else
        print_warning "File $file not found, skipping..."
    fi
done

print_status "Waiting for pods to be ready..."

# Wait for database to be ready
print_status "Waiting for MySQL master to be ready..."
$KUBECTL_CMD wait --for=condition=ready pod -l app=mysql-master -n $NAMESPACE --timeout=300s

print_status "Waiting for MySQL replica to be ready..."
$KUBECTL_CMD wait --for=condition=ready pod -l app=mysql-replica -n $NAMESPACE --timeout=300s

# Wait for APIs to be ready
print_status "Waiting for Users API to be ready..."
$KUBECTL_CMD wait --for=condition=ready pod -l app=users-api -n $NAMESPACE --timeout=300s

print_status "Waiting for Tracking API to be ready..."
$KUBECTL_CMD wait --for=condition=ready pod -l app=tracking-api -n $NAMESPACE --timeout=300s

# Wait for frontend to be ready
print_status "Waiting for Frontend to be ready..."
$KUBECTL_CMD wait --for=condition=ready pod -l app=frontend -n $NAMESPACE --timeout=300s

print_status "Deployment completed successfully!"

# Show deployment status
echo ""
echo "=== Deployment Status ==="
$KUBECTL_CMD get pods -n $NAMESPACE
echo ""
$KUBECTL_CMD get services -n $NAMESPACE
echo ""
$KUBECTL_CMD get ingress -n $NAMESPACE

# Show load balancer information
echo ""
echo "=== Load Balancer Information ==="
LB_IP=$($KUBECTL_CMD get service spotme-loadbalancer -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "Pending...")
if [ "$LB_IP" != "Pending..." ]; then
    print_status "Load Balancer IP: $LB_IP"
    echo ""
    echo "Access URLs:"
    echo "  Frontend: https://$LB_IP (or https://spotme.com)"
    echo "  Users API: https://$LB_IP (or https://api.spotme.com)"
    echo "  Tracking API: https://$LB_IP (or https://tracking.spotme.com)"
else
    print_warning "Load Balancer IP is still pending. Please check later with:"
    echo "  kubectl get service spotme-loadbalancer -n $NAMESPACE"
fi

echo ""
print_status "SpotMe deployment completed! 🎉"

# Show resource usage
echo ""
echo "=== Resource Usage ==="
if $KUBECTL_CMD top nodes &> /dev/null; then
    print_status "Node resource usage:"
    $KUBECTL_CMD top nodes
    echo ""
    print_status "Pod resource usage:"
    $KUBECTL_CMD top pods -n $NAMESPACE
else
    print_warning "Resource metrics not available yet. Try running:"
    echo "  kubectl top pods -n $NAMESPACE"
fi

echo ""
print_status "Deployment verification commands:"
echo "  kubectl get pods -n $NAMESPACE"
echo "  kubectl get services -n $NAMESPACE"
echo "  kubectl top pods -n $NAMESPACE"
echo "  kubectl logs -f deployment/frontend -n $NAMESPACE"
