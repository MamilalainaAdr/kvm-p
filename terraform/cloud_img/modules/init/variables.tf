variable "template_path" {
  type = string
}

variable "vm_name" {
  description = "Nom de la VM (utilisé pour les fichiers de clé et cloud-init)"
  type        = string
}

variable "public_key" {
  type = string
}
variable "init_iso" {
  type = string
}
variable "user" {
 type = string
}