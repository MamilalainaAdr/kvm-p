output "private_key" {
  value     = local_file.private_key.content
}

output "public_key" {
  value = tls_private_key.ssh.public_key_openssh
}
