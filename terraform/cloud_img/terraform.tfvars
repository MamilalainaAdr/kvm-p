vm_cloud = {
  name            = "ubuntu"
  volume_name     = "ubuntu.qcow2"
  vcpu            = 1
  memory          = 512
  init_iso        = "ubuntuinit.iso"
  image_path      = "./images/noble-server-cloudimg-amd64.img"
  init_path       = "./modules/init/cloud_init.cfg.tpl"
  network_name    = "terraform"

  final_disk_name = "final-debian12.qcow2"
  username        = "user"
  disk_size       = 20
}