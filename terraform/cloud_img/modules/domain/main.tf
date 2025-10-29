terraform {
  required_providers {
    libvirt = {
      source = "dmacvicar/libvirt"
    }
  }
}

provider "libvirt" {
  uri = "qemu:///system"
}

resource "libvirt_domain" "domain" {
  name      = var.vm_name
  memory    = var.memory
  vcpu      = var.vcpu
  cloudinit = var.cloudinit_id

  network_interface {
    network_name = var.network_name
    wait_for_lease = true
  }

  disk {
    volume_id = var.volume_id
  }

  console {
    type        = "pty"
    target_type = "serial"
    target_port = "0"
  }

  graphics {
    type        = "vnc"
    listen_type = "address"
    autoport    = true
  }
}
