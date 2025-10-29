variable "vm_cloud" {
  description = "Configuration de la VM cloud"
  type = object({
    name            = string
    volume_name     = string
    image_path      = string
    final_disk_name = string
    init_path       = string
    network_name    = string
    vcpu            = number
    memory          = number
    disk_size       = number
    init_iso        = string
    username        = string
  })

  default = {
    name            = "u2404"
    volume_name     = "u2404"
    image_path      = "https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-arm64.img"
    init_path       = "./modules/init/cloud_init.cfg.tpl"
    network_name    = "terraform"
    vcpu            = 1
    memory          = 512
    disk_size       = 20
    init_iso        = "commoninit.iso"
    final_disk_name = "u2404-final"
    username        = "user"
  }

}
