output "ec2_public_ip" {
  description = "The public IP address of the main application server."
  value       = aws_instance.app_server.public_ip
}

output "rds_endpoint" {
  description = "The connection endpoint for the RDS database."
  value       = module.db.db_instance_address
}

output "rds_port" {
  description = "The port for the RDS database."
  value       = module.db.db_instance_port
}

output "vpc_id" {
  description = "The ID of the generated VPC."
  value       = module.vpc.vpc_id
}
