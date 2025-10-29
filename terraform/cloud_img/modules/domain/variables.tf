variable "vm_name" {
  type = string
}
variable "memory" {
  type    = number
  default = 512
}
variable "vcpu" {
  type    = number
  default = 1
}
variable "volume_id" {
  type = string
}
variable "cloudinit_id" {
  type = string
}
variable "network_name" {
  type = string
}
