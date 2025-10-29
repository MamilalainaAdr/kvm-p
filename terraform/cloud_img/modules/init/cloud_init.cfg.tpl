#cloud-config
# ssh_pwauth: True        # Autorise login SSH par mot de passe
disable_root: false     # Active le compte root

chpasswd:
  list: |
     root:root
    #  test:test
  expire: False

users:
  - name: root
    ssh_authorized_keys:
      - ${public_key}

  - name: ${user}
    gecos: sudoeruser
    homedir: /home/${user}
    shell: /bin/bash
    sudo: ["ALL=(ALL) NOPASSWD:ALL"]
    # lock_passwd: false
    ssh_authorized_keys:
      - ${public_key}