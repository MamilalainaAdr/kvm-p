vm_cloud = {
  name            = "debian12"
  volume_name     = "debian12.qcow2"
  vcpu            = 1
  memory          = 512
  init_iso        = "debianinit.iso"
  image_path      = "./images/debian/12.qcow2"
  init_path       = "./modules/init/cloud_init.cfg.tpl"
  network_name    = "terraform"

  final_disk_name = "final-debian12.qcow2"
  username        = "test"
  disk_size       = 10
}