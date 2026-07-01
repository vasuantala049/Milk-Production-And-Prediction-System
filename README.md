# Milk-Production-And-Prediction-System

Milk-Production-And-Prediction-System is a full-stack dairy management platform with a React frontend, Spring Boot backend, MySQL database, Redis cache, Dockerized local development, Terraform-based AWS infrastructure, Kubernetes Helm charts, Jenkins CI/CD, and ArgoCD GitOps deployment.

## What This Project Includes

- React + Vite frontend
- Spring Boot backend
- MySQL and Redis support
- Docker Compose for local development
- Terraform for AWS networking, EC2, and RDS
- Helm chart for Kubernetes deployment
- Jenkins pipeline for CI/CD
- ArgoCD application and image updater manifests

## Repository Layout

- `frontend/` - React UI and static web assets
- `backend/backend/` - Spring Boot API service
- `docker-compose.yml` - local multi-service setup
- `terraform/` - AWS infrastructure code
- `helm/dairy-flow/` - Kubernetes Helm chart
- `argocd/` - ArgoCD application and image updater manifests

## Prerequisites

Before you start, install and configure:

- Git
- Docker and Docker Compose
- AWS CLI configured with an IAM user or role
- Terraform 1.3 or later
- kubectl
- Helm 3
- Jenkins server if you want to run the CI/CD pipeline
- ArgoCD installed on your Kubernetes cluster

Check the most important tools:

```bash
git --version
docker --version
docker compose version
aws --version
terraform -v
kubectl version --client
helm version
```

## 1. Clone The Repository

```bash
git clone https://github.com/vasuantala049/Milk-Production-And-Prediction-System.git
cd Milk-Production-And-Prediction-System
```

## 2. Run Locally With Docker Compose

Use Docker Compose when you want the full stack locally without creating cloud resources.

```bash
docker compose up --build
```

Services exposed by the compose file:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- MySQL: `localhost:3306`
- Redis: `localhost:6379`

## 3. AWS Infrastructure With Terraform

The `terraform/` folder provisions the AWS foundation used by the application. It creates:

- a VPC with public, private, and database subnets
- security groups for application access and MySQL access
- an EC2 instance for the application server
- an RDS MySQL database

### Configure Terraform Variables

Create `terraform/terraform.tfvars` with at least the database credentials:

```hcl
db_username = "username"
db_password = "StrongPassword123!"
```

You can also override values like region, instance size, or subnet CIDRs if required.

### Apply Terraform

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

After apply, Terraform outputs the EC2 public IP, RDS endpoint, RDS port, and VPC ID.

## 4. Create EKS With AWS CLI

If you want to deploy the Kubernetes version of the app, first create an EKS cluster. The AWS CLI requires you to provide an existing VPC, subnets, and IAM roles.

### Create the EKS cluster

```bash
aws eks create-cluster \
    --name milk-flow-eks \
    --region us-east-1 \
    --kubernetes-version 1.30 \
    --role-arn arn:aws:iam::<ACCOUNT_ID>:role/EKSClusterRole \
    --resources-vpc-config subnetIds=subnet-aaaaaaaa,subnet-bbbbbbbb,securityGroupIds=sg-xxxxxxxx
```

### Create a managed node group

```bash
aws eks create-nodegroup \
    --cluster-name milk-flow-eks \
    --nodegroup-name milk-flow-ng \
    --region us-east-1 \
    --subnets subnet-aaaaaaaa subnet-bbbbbbbb \
    --node-role arn:aws:iam::<ACCOUNT_ID>:role/EKSNodeRole \
    --scaling-config minSize=2,maxSize=4,desiredSize=2 \
    --instance-types t3.medium
```

### Update kubeconfig

```bash
aws eks update-kubeconfig --region us-east-1 --name milk-flow-eks
kubectl get nodes
```

If your cluster uses the AWS Load Balancer Controller, NGINX Ingress, or cert-manager, install those before applying the app chart.

## 5. Deploy The Application With Helm

The Helm chart is stored in `helm/dairy-flow/`. It deploys the frontend, backend, ingress, and supporting resources into the `milk` namespace.

### Create the namespace

```bash
kubectl create namespace milk
```

### Install the chart

```bash
helm upgrade --install milk-app ./helm/dairy-flow \
    --namespace milk \
    --create-namespace
```

### Useful Helm commands

```bash
helm list -n milk
helm get values milk-app -n milk
kubectl get pods -n milk
kubectl get svc -n milk
kubectl get ingress -n milk
```

## 6. ArgoCD GitOps Deployment

ArgoCD is used to keep the cluster in sync with the Helm chart stored in Git. The manifest in `argocd/milk-img-updater.yml` defines the application, and `argocd/img-updater-cr.yml` configures image automation.

### Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Install ArgoCD Image Updater

```bash
kubectl apply -f argocd/img-updater-cr.yml
```

### Apply the ArgoCD application

```bash
kubectl apply -f argocd/milk-img-updater.yml
```

### Sync the application

```bash
argocd app sync milk-app
argocd app get milk-app
```

ArgoCD will deploy the Helm chart from the `main` branch and keep it synced using the automated sync policy. The image updater is configured to write Helm image tag changes back to Git when new semver tags are pushed.

## 7. Jenkins CI/CD Setup

The `Jenkinsfile` in the repository defines the CI/CD flow. It expects a shared library named `sharedlib` and a Docker Hub credential with the ID `dockerhubcred`.

### What The Jenkins Pipeline Does

- Runs Trivy vulnerability scanning
- Runs OWASP Dependency Check
- Builds Docker images for frontend and backend
- Tags images as `v1.0.${BUILD_NUMBER}`
- Pushes images to Docker Hub
- Leaves ArgoCD Image Updater to detect the new semver tag and update Helm values

### Jenkins Prerequisites

Install these Jenkins plugins or equivalents:

- Pipeline
- Git
- Docker Pipeline
- Credentials Binding
- OWASP Dependency-Check plugin or shared library support
- Trivy support if your shared library provides it

### Jenkins Configuration Steps

1. Create a new Pipeline job in Jenkins.
2. Point it to this repository.
3. Ensure the shared library `sharedlib` is available in Jenkins.
4. Add Docker Hub credentials with the ID `dockerhubcred`.
5. Verify the Jenkins agent has access to Docker.
6. Run the pipeline from the `main` branch.

### Pipeline Flow

```text
Trivy Scan -> OWASP Dependency Check -> Build Docker Images -> Push Images -> ArgoCD Image Updater Sync
```

## 8. Kubernetes Deployment Flow

The recommended production flow is:

1. Push code to GitHub.
2. Jenkins runs scans, builds images, and pushes versioned Docker images.
3. ArgoCD Image Updater detects the new tags.
4. ArgoCD updates the Helm values and syncs the cluster.
5. Kubernetes rolls out the new frontend and backend pods.

## 9. Configuration Notes

- Update `helm/dairy-flow/values.yaml` before production use.
- Replace demo credentials and secrets with secure values stored in AWS Secrets Manager, Kubernetes Secrets, or a sealed-secret workflow.
- The backend chart currently points to an external MySQL endpoint, so update `externalDatabase.host` for your environment.
- The ingress host and TLS secret in the Helm values should match your cluster DNS and certificate setup.

## 10. Verification Commands

```bash
kubectl get all -n milk
kubectl describe ingress -n milk
kubectl logs deployment/backend -n milk
kubectl logs deployment/frontend -n milk
```

## 11. Clean Up

```bash
helm uninstall milk-app -n milk
kubectl delete namespace milk
kubectl delete namespace argocd
cd terraform
terraform destroy
```

## Notes

- The repository includes both Terraform-based AWS infrastructure and Kubernetes-based deployment artifacts.
- If you deploy on EKS, make sure your VPC, subnets, security groups, and IAM roles are ready before creating the cluster.
- For ArgoCD-based deployments, Git becomes the source of truth for release changes.
    
