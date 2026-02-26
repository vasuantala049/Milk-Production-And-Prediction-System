terraform {
  required_version = ">= 1.5.0"

  # For a true production environment, you should use a remote backend:
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "dairy-flow/production/terraform.tfstate"
  #   region         = "us-east-1"
  #   dynamodb_table = "terraform-state-locks"
  #   encrypt        = true
  # }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "DairyFlow"
      ManagedBy   = "Terraform"
    }
  }
}
