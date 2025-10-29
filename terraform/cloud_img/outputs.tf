# vm_cloud
output "vm_cloud_IP" {
  value = module.vm_cloud_domain.vm_ip
}
output "vm_cloud_ssh_private_key" {
  value     = module.vm_cloud_ssh_keygen.private_key
  sensitive = true
}