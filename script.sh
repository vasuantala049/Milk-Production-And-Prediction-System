#!/bin/bash

set -e

echo "Updating system..."
sudo apt-get update -y
sudo apt-get upgrade -y

echo "Installing required packages..."
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common



# ---------------- DOCKER ----------------
echo "Installing Docker..."

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg

echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

sudo systemctl enable docker
sudo systemctl start docker

# Allow ubuntu user to run docker without sudo
sudo usermod -aG docker $USER
newgrp docker

echo "Docker installed."



# ---------------- KUBECTL ----------------
echo "Installing kubectl..."

KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)

curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

echo "kubectl installed."



# ---------------- KIND ----------------
echo "Installing kind..."

curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.22.0/kind-linux-amd64
chmod +x kind
sudo mv kind /usr/local/bin/

echo "kind installed."

curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
chmod 700 get_helm.sh
./get_helm.sh


# ---------------- CREATE CLUSTER ----------------
echo "Creating Kubernetes cluster with kind..."

kind create cluster --name dev-cluster

echo "Cluster created."

echo "Checking cluster nodes..."
kubectl get nodes

echo "DONE."
echo "IMPORTANT: Logout and login again OR run 'newgrp docker' before using docker without sudo."
