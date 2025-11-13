terraform {
  required_providers {
    libvirt = {
      source = "dmacvicar/libvirt"
      version = "= 0.8.3"
    }
  }
}

provider "libvirt" {
  uri = "qemu:///system"
}

# Provisioning KVM with cloud images
module "vm_cloud_ssh_keygen" {
  source  = "./modules/ssh_keygen"
  vm_name = var.vm_cloud.name
}

module "vm_cloud_volume" {
  source          = "./modules/volume"
  volume_name     = var.vm_cloud.volume_name
  image_path      = var.vm_cloud.image_path
  disk_size       = var.vm_cloud.disk_size
  final_disk_name = var.vm_cloud.final_disk_name
}

module "vm_cloud_init" {
  source        = "./modules/init"
  init_iso      = var.vm_cloud.init_iso
  template_path = var.vm_cloud.init_path
  vm_name       = var.vm_cloud.name
  public_key    = module.vm_cloud_ssh_keygen.public_key
  user          = var.vm_cloud.username
}

module "vm_cloud_domain" {
  source       = "./modules/domain"
  vm_name      = var.vm_cloud.name
  vcpu         = var.vm_cloud.vcpu
  memory       = var.vm_cloud.memory
  volume_id    = module.vm_cloud_volume.volume_id
  cloudinit_id = module.vm_cloud_init.cloudinit_id
  network_name = var.vm_cloud.network_name
}
