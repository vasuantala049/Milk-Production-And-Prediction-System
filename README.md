# 🥛 Milk Production & Prediction System (DairyFlow)

A full-stack application for managing dairy farms — track cattle, record milk production, manage workers, handle orders/subscriptions, and process payments via Razorpay.

**Tech Stack:** React (Vite) · Spring Boot · MySQL · Redis · Nginx · Docker · Kubernetes (Helm) · Terraform (AWS) · Jenkins · ArgoCD

---

## 📦 Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| Docker & Docker Compose | ≥ 24.x | `docker --version` |
| Helm | ≥ 3.x | `helm version` |
| kubectl | ≥ 1.28 | `kubectl version` |
| Terraform | ≥ 1.5 | `terraform -v` |
| AWS CLI | ≥ 2.x | `aws --version` |
| Node.js | ≥ 20.x | `node -v` |
| Java / Maven | JDK 24 | `java -version` |

---

## 🚀 Option 1: Run with Docker Compose (Local Development)

### Step 1: Create your `.env` file


Edit `.env` and fill in your real values:

```env
# MySQL
MYSQL_ROOT_PASSWORD=YourRootPassword
MYSQL_DATABASE=mpps
MYSQL_USER=milkuser
MYSQL_PASSWORD=YourMySQLPassword

# JWT
JWT_SECRET=YourLongRandomJwtSecretKey
JWT_EXPIRATION=86400000

# Razorpay
RAZORPAY_KEY=rzp_test_XXXXXXXXXX
RAZORPAY_SECRET=YourRazorpaySecret

# Mail (Gmail SMTP)
SPRING_MAIL_USERNAME=your_email@gmail.com
SPRING_MAIL_PASSWORD=your_gmail_app_password
APP_MAIL_FROM=your_email@gmail.com
```

> **Note:** For Gmail, use an [App Password](https://myaccount.google.com/apppasswords), not your regular password.

### Step 2: Start the application

```bash
docker compose up --build
```

This starts **4 services**:

| Service        | Port   | Description                |
|----------------|--------|----------------------------|
| `milk-frontend`| `3000` | React app served via Nginx |
| `milk-backend` | `8080` | Spring Boot REST API       |
| `milk-mysql`   | `3306` | MySQL 8.0 database         |
| `milk-redis`   | `6379` | Redis cache                |

### Step 3: Access the app

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8080/api

### Useful commands

```bash
docker compose logs -f backend    # View backend logs
docker compose down               # Stop all services
docker compose down -v            # Stop + delete data (fresh start)
docker compose up -d --build      # Rebuild after code changes
```

---

## ☸️ Option 2: Deploy with Helm (Kubernetes)

### Step 1: Create a secrets values file

Create `helm/secrets-values.yaml` 

```yaml
externalDatabase:
  host: your-rds-endpoint.xxxxx.rds.amazonaws.com   # from terraform output
  port: 3306
  database: mpps
  username: admin
  password: YourDbPassword

jwt:
  secret: YourLongRandomJwtSecretKey

razorpay:
  key: rzp_test_XXXXXXXXXX
  secret: YourRazorpaySecret

mail:
  username: your_email@gmail.com
  password: your_gmail_app_password
  from: your_email@gmail.com
```

### Step 2: Deploy

```bash
# Create namespace
kubectl create namespace milk

# Install the chart with your secrets
helm install milk-app helm/dairy-flow \
  -n milk \
  -f helm/secrets-values.yaml
```

### Step 3: Verify

```bash
kubectl get pods -n milk                  # Check all pods are running
kubectl get svc -n milk                   # Check services
kubectl logs -f deployment/backend -n milk  # View backend logs
```

### Upgrade after changes

```bash
helm upgrade milk-app helm/dairy-flow \
  -n milk \
  -f helm/secrets-values.yaml
```

### What gets deployed

| Resource | Replicas | Description |
|----------|----------|-------------|
| `frontend` Deployment | 2 | React app + Nginx |
| `backend` Deployment | 4 | Spring Boot API |
| `redis` Deployment | 1 | Redis cache |
| `backend-secrets` Secret | — | All sensitive credentials |
| `Ingress` | — | Routes traffic to frontend/backend |
| HPA (Horizontal Pod Autoscaler) | — | Auto-scales frontend & backend |

> **Note:** MySQL is **not** deployed in K8s — the Helm chart connects to an external RDS database (see Terraform section below).

---

## 🏗️ Option 3: Full Infrastructure with Terraform (AWS)

Terraform provisions the complete AWS infrastructure needed to run the application in production.

### What Terraform creates

```
┌────────────────────────────────────────────────────┐
│                    AWS Cloud                       │
│                                                    │
│  ┌─────────────── VPC (10.0.0.0/16) ─────────────┐ │
│  │                                               │ │
│  │  Public Subnets          Private Subnets      │ │
│  │  ┌──────────────┐        ┌───────────────┐    │ │
│  │  │ EC2 Instance │        │  (Reserved)   │    │ │
│  │  │ t2.medium    │        └───────────────┘    │ │
│  │  │ Ubuntu 22.04 │                             │ │
│  │  │              │        Database Subnets     │ │
│  │  │ - Docker     │        ┌───────────────┐    │ │
│  │  │ - kubectl    │        │  RDS MySQL    │    │ │
│  │  │ - kind       │◄──────►│  db.t3.medium │    │ │
│  │  │ - Helm       │        │  Encrypted    │    │ │
│  │  └──────────────┘        └───────────────┘    │ │
│  │        ▲                                      │ │
│  │   NAT Gateway                                 │ │
│  └───────────────────────────────────────────────┘ │
│        ▲                                           │
│   Internet Gateway                                 │
└────────────────────────────────────────────────────┘
```

| Resource | Details |
|----------|---------|
| **VPC** | Custom VPC with public, private, and database subnets across 2 AZs |
| **EC2** | `t2.medium` Ubuntu 22.04, bootstrapped with Docker + kubectl + kind + Helm |
| **RDS** | MySQL 8.0 (`db.t3.medium`), encrypted, in private database subnets |
| **Security Groups** | EC2: SSH (restricted) + HTTP/HTTPS. RDS: MySQL (3306) from EC2 only |
| **NAT Gateway** | For private subnet internet access |
| **Key Pair** | SSH access using your public key (`dairy.pub`) |

### Step 1: Configure AWS CLI

```bash
aws configure
# Enter your AWS Access Key, Secret Key, region (us-east-1), and output format
```

### Step 2: Add your SSH public key

Place your SSH public key at `terraform/dairy.pub`:

```bash
# Generate a new key pair (if you don't have one)
ssh-keygen -t ed25519 -f terraform/dairy -C "dairy-flow"

# This creates:
#   terraform/dairy      → private key (gitignored)
#   terraform/dairy.pub  → public key (used by Terraform)
```

### Step 3: Create `terraform.tfvars`

Create `terraform/terraform.tfvars` (**gitignored automatically**):

```hcl
aws_region     = "us-east-1"
environment    = "prod"
instance_type  = "t2.medium"

# Database credentials
db_username = "admin"
db_password = "YourStrongDBPassword!"

# Optional overrides
# vpc_cidr          = "10.0.0.0/16"
# db_instance_class = "db.t3.medium"
# allowed_ssh_cidr  = "YOUR_IP/32"   # Restrict SSH access to your IP
```

### Step 4: Deploy infrastructure

```bash
cd terraform

terraform init      # Download providers & modules
terraform plan      # Preview what will be created
terraform apply     # Create everything (type 'yes' to confirm)
```

### Step 5: Get outputs

After `apply` completes, Terraform outputs:

```
ec2_public_ip = "3.110.76.117"      # SSH into this
rds_endpoint  = "dairy-flow-db-prod.xxxxx.ap-south-1.rds.amazonaws.com"
rds_port      = 3306
vpc_id        = "vpc-0abc123def456"
```

### Step 6: SSH into EC2 and deploy the app

```bash
ssh -i terraform/dairy ubuntu@<ec2_public_ip>

# On the EC2 instance, the bootstrap script (script.sh) already installed:
# Docker, kubectl, kind, and Helm

# Create a kind cluster (if not already created by bootstrap)
kind create cluster --name dev-cluster

# Deploy with Helm
helm install milk-app helm/dairy-flow \
  -n milk --create-namespace \
  -f helm/secrets-values.yaml
```

### Tear down infrastructure

```bash
cd terraform
terraform destroy   # Removes ALL AWS resources (type 'yes' to confirm)
```

> ⚠️ **Warning:** This deletes everything including the RDS database. Make sure to backup data first.

---

## 🔐 Secrets Summary

| Secret | Docker Compose | Helm / K8s | Terraform |
|--------|---------------|------------|-----------|
| MySQL password | `.env` → `MYSQL_PASSWORD` | `secrets-values.yaml` → `externalDatabase.password` | `terraform.tfvars` → `db_password` |
| JWT secret | `.env` → `JWT_SECRET` | `secrets-values.yaml` → `jwt.secret` | N/A (app-level) |
| Razorpay key/secret | `.env` → `RAZORPAY_KEY/SECRET` | `secrets-values.yaml` → `razorpay.key/secret` | N/A (app-level) |
| Mail password | `.env` → `SPRING_MAIL_PASSWORD` | `secrets-values.yaml` → `mail.password` | N/A (app-level) |
| DB credentials | `.env` | `secrets-values.yaml` or `kubectl create secret` | `terraform.tfvars` |

**Files that must NEVER be committed:**
- `.env` — Docker Compose secrets
- `helm/secrets-values.yaml` — Helm secrets
- `terraform/terraform.tfvars` — Terraform secrets
- `terraform/dairy` — SSH private key

---

## 🔄 CI/CD Pipeline

The project uses **Jenkins + ArgoCD** for automated deployments:

1. **Push code** → Jenkins builds Docker images and pushes to Docker Hub
2. **ArgoCD Image Updater** detects new tags and updates Helm values
3. **ArgoCD** syncs the Helm chart to Kubernetes automatically

---

## 📁 Project Structure

```
├── frontend/               # React (Vite) frontend
│   ├── src/                # Source code
│   ├── Dockerfile          # Multi-stage build (Node → Nginx)
│   └── nginx.conf          # Nginx config for SPA routing
├── backend/backend/        # Spring Boot backend
│   ├── src/                # Java source code
│   ├── .env                # Local dev env template
│   └── Dockerfile          # Multi-stage build (Maven → JRE)
├── helm/dairy-flow/        # Helm chart
│   ├── templates/          # K8s resource templates
│   └── values.yaml         # Default values (no secrets)
├── terraform/              # AWS infrastructure
│   ├── main.tf             # VPC, EC2, RDS resources
│   ├── variables.tf        # Input variables
│   └── outputs.tf          # Output values
├── argocd/                 # ArgoCD application & image updater config
├── .github/workflows/      # GitHub Actions CI
├── Jenkinsfile             # Jenkins pipeline
├── docker-compose.yml      # Local development stack
├── .env.example            # Environment variable template
└── script.sh               # EC2 bootstrap script
```
