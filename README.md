# Milk-Production-And-Prediction-System

📦 Prerequisites

Before using this repo, make sure you have:

AWS Account (or AWS Lab)

Terraform ≥ 1.3 installed

AWS CLI installed & configured

An existing AWS Key Pair OR your own SSH public key (.pub)

Check tools:

terraform -v
aws --version

⚙️ Setup Instructions
1. Clone the repository
2. Create terraform.tfvars
    add this value in it
    db_username = "username" 
    db_password = "StrongPassword123!"
3. run:
        terraform init
        terraform plan
        terraform apply
    
