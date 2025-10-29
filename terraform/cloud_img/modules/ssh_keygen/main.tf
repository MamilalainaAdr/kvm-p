resource "tls_private_key" "ssh" {
  algorithm = "ED25519"
}

# Sauvegarde privée
resource "local_file" "private_key" {
  content         = tls_private_key.ssh.private_key_openssh
  filename        = "${path.root}/keys/${var.vm_name}"
  file_permission = "0600"
}

# Sauvegarde publique
resource "local_file" "public_key" {
  content         = tls_private_key.ssh.public_key_openssh
  filename        = "${path.root}/keys/${var.vm_name}.pub"
  file_permission = "0644"
}
