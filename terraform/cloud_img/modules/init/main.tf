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

data "template_file" "user_data" {
  template = file("${path.module}/cloud_init.cfg.tpl")
  vars = {
    public_key = var.public_key
    user = var.user
  }
}

resource "libvirt_cloudinit_disk" "cloudinit" {
  name      = var.init_iso
  user_data = data.template_file.user_data.rendered
  depends_on = [ var.public_key ]
}
