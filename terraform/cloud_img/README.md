# terraform-kvm cloud_img
Provisionning KVM with Terraform using the <a href="https://registry.terraform.io/providers/dmacvicar/libvirt/latest/docs">libvirt</a> provider
#
**cloud_img** → for **cloud-ready images** (such as Ubuntu cloud images). <br>
They are designed to work directly with **cloud-init**, which makes it easy to inject configuration (user, password, SSH keys, etc.) through a special ISO disk (cloud-init disk).
#
## How to run
Ensure you have installed <a href="https://gitlab.relia-consulting.com/mamilalainaadr/terraform-kvm/-/blob/develop/README.md">Terraform and KVM </a> then follow the instructions bellow

```bash
# Clone the repository
git clone git@github.com:MamilalainaAdr/terraform-kvm.git
# Move to the cloud_img directory
cd terraform-kvm/cloud_img
# Create the following directories
mkdir keys # for storing ssh_keys
mkdir images # for storing images locally
# Download the image locally (here we used ubuntu server 24.04 LTS)
wget -P ./images https://cloud-images.ubuntu.com/noble/current/noble-server-cloudimg-amd64.img
# Init the terraform project
terraform init
# Validate your configuration
terraform validate
# Apply
terraform apply
```
The IP of the created VM will be output in the terminal or you can check it in the **terraform.tfstate** file (Here you'll find the SSH private key too, or check the **keys** directory)
```bash
# Access the VM via SSH using the root or test user
ssh -i keys/u2404 <USER>@<IP>
```
#
## Configuration overview: terraform.tfvars
<!-- Description des modules, fichiers, des variables et des outputs -->
```bash
vm_cloud = {
  name            # VM's name
  volume_name     # Base volume 's name(non-resizable), .qcow2
  vcpu            # the VM's VCPU
  memory          # the VM's memory
  image_path      # Path or URL to the image
  init_path       # Path to the template used for cloud_init
  network_name    # Network assigned to the VM (default / custom)
  init_iso        # Name of the init iso created

  final_disk_name # Name of the final disk (currently used - with the custom size)
  username        # Name of the user to be created
  disk_size       # Size of the VM's disk
}
```