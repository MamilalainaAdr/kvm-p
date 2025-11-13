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

resource "libvirt_volume" "volume" {
  name   = var.volume_name
  pool   = "default"
  source = var.image_path
  format = "qcow2"
}

resource "libvirt_volume" "disk" {
  name = var.final_disk_name
  pool = "default"
  base_volume_id = libvirt_volume.volume.id
  size = var.disk_size * 1024 * 1024 * 1024 # en bytes
}
