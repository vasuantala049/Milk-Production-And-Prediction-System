# ==============================================================================
# VPC AND NETWORKING
# ==============================================================================

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.5"

  name = "dairy-flow-vpc-${var.environment}"
  cidr = var.vpc_cidr

  azs              = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets  = var.private_subnets
  public_subnets   = var.public_subnets
  database_subnets = var.database_subnets

  create_database_subnet_group = true

  enable_nat_gateway   = true
  single_nat_gateway   = true
  enable_dns_hostnames = true
  enable_dns_support   = true
}

# ==============================================================================
# SECURITY GROUPS
# ==============================================================================

module "ec2_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.1"

  name        = "ec2-sg-${var.environment}"
  description = "Security group for application EC2 instance"
  vpc_id      = module.vpc.vpc_id

  ingress_with_cidr_blocks = [
    {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      description = "SSH Access"
      cidr_blocks = var.allowed_ssh_cidr
    },
    {
      from_port   = 80
      to_port     = 80
      protocol    = "tcp"
      description = "HTTP Access"
      cidr_blocks = "0.0.0.0/0"
    },
    {
      from_port   = 443
      to_port     = 443
      protocol    = "tcp"
      description = "HTTPS Access"
      cidr_blocks = "0.0.0.0/0"
    }
  ]
  egress_rules = ["all-all"]
}

module "rds_sg" {
  source  = "terraform-aws-modules/security-group/aws"
  version = "~> 5.1"

  name        = "rds-sg-${var.environment}"
  description = "Security group for RDS database"
  vpc_id      = module.vpc.vpc_id

  ingress_with_source_security_group_id = [
    {
      from_port                = 3306
      to_port                  = 3306
      protocol                 = "tcp"
      description              = "MySQL access from application EC2"
      source_security_group_id = module.ec2_sg.security_group_id
    }
  ]
}

# ==============================================================================
# Key for ec2
# ==============================================================================


resource "aws_key_pair" "dairy" {
  key_name   = "dairy"
  public_key = file("${path.module}/dairy.pub")
}




# ==============================================================================
# EC2 INSTANCE (COMPUTE)
# ==============================================================================


data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "app_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  key_name = aws_key_pair.dairy.key_name
  subnet_id                   = module.vpc.public_subnets[0]
  vpc_security_group_ids      = [module.ec2_sg.security_group_id]

  #important to auto assign some public ip
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 15
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  # Connection block execution using provisioner is generally an anti-pattern for
  # production (better to use Packer/AMI building or full User Data scripts). 
  # However, keeping user_data to bootstrap if script.sh exists.
  user_data = fileexists("${path.module}/../script.sh") ? file("${path.module}/../script.sh") : null

  tags = {
    Name = "Dairy-Flow-App-${var.environment}"
  }
}

# ==============================================================================
# RDS DATABASE
# ==============================================================================

module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.5"

  identifier = "dairy-flow-db-${var.environment}"

  engine               = "mysql"
  engine_version       = "8.0"
  family               = "mysql8.0"
  major_engine_version = "8.0"
  instance_class       = var.db_instance_class
  allocated_storage    = 20

  #only for aws snadbox 
  create_db_option_group = false
  
  # Encryption is recommended for production databases!
  storage_encrypted    = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  manage_master_user_password = false

  port = 3306

  vpc_security_group_ids = [module.rds_sg.security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  subnet_ids             = module.vpc.database_subnets

  deletion_protection = var.environment == "prod" ? true : false
  skip_final_snapshot = var.environment == "prod" ? false : true

  iam_database_authentication_enabled = true
}
