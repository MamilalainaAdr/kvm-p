output "vm_ip" {
  value = libvirt_domain.domain.network_interface.0.addresses.0
}
