#!/bin/bash

set -e

echo "==============================="
echo " DairyFlow Setup Script"
echo "==============================="

# ---------------- SYSTEM SETUP ----------------
echo "Updating system..."
sudo apt-get update -y
sudo apt-get upgrade -y



# ---------------- USER CHOICE ----------------
echo ""
echo "Choose setup option:"
echo "1) Docker (Local Development)"
echo "2) Kubernetes (Helm + Kind)"
echo "3) Full Setup (Docker + K8s + Helm)"
read -p "Enter choice [1-3]: " choice


# ---------------- DOCKER INSTALL ----------------
install_docker() {
    echo "Installing Docker..."

    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg

    echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    sudo systemctl enable docker
    sudo systemctl start docker

    sudo usermod -aG docker $USER

    echo "Docker installed."
}


# ---------------- KUBECTL ----------------
install_kubectl() {
    echo "Installing kubectl..."

    KUBECTL_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt)

    curl -LO "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
    chmod +x kubectl
    sudo mv kubectl /usr/local/bin/

    echo "kubectl installed."
}


# ---------------- KIND ----------------
install_kind() {
    echo "Installing kind..."

    KIND_VERSION="v0.22.0"

    curl -Lo ./kind https://kind.sigs.k8s.io/dl/${KIND_VERSION}/kind-linux-amd64
    chmod +x kind
    sudo mv kind /usr/local/bin/

    echo "kind installed."
}


# ---------------- HELM ----------------
install_helm() {
    echo "Installing Helm..."

    curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

    echo "Helm installed."
}


# ---------------- CREATE CLUSTER ----------------
create_cluster() {
    echo "Creating Kubernetes cluster..."
    kind create cluster --name dev-cluster

    echo "Checking nodes..."
    kubectl get nodes
}


# ---------------- EXECUTION ----------------
case $choice in
    1)
        echo "Selected: Docker setup"
        install_docker

        echo ""
        echo "Run your app using:"
        echo "docker compose up --build"
        ;;

    2)
        echo "Selected: Kubernetes setup"
        install_docker
        install_kubectl
        install_kind
        install_helm
        create_cluster
        ;;

    3)
        echo "Selected: Full setup"
        install_docker
        install_kubectl
        install_kind
        install_helm
        create_cluster
        ;;

    *)
        echo "Invalid choice. Exiting."
        exit 1
        ;;
esac


echo ""
echo "==============================="
echo " Setup Complete"
echo "==============================="
echo "IMPORTANT:"
echo "- Run 'newgrp docker' OR logout/login"
echo "- Then verify with: docker ps"
