import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const BASE_DIR = process.env.TERRAFORM_BASE_DIR;
const TEMPLATE = process.env.TERRAFORM_TEMPLATE_DIR;
const RETRY = parseInt(process.env.TERRAFORM_RETRY_ATTEMPTS) || 3;

export const generateConfig = async (userName, vmSpec) => {
  const userDir = path.join(BASE_DIR, userName);
  await fs.ensureDir(userDir);
  
  // NOM UNIQUE et VALIDE : user-vmname-timestamp
  const safeName = `${userName}-${vmSpec.name.replace(/[^a-z0-9-]/gi, '-')}-${Date.now()}`;
  const vmDir = path.join(userDir, safeName);
  await fs.copy(TEMPLATE, vmDir);
  
  const varsPath = path.join(vmDir, 'terraform.tfvars');
  let content = await fs.readFile(varsPath, 'utf-8');
  
  // Remplacement avec NOM UNIQUE
  content = content
    .replace(/name\s*=\s*".*"/, `name = "${safeName}"`)
    .replace(/volume_name\s*=\s*".*"/, `volume_name = "${safeName}.qcow2"`)
    .replace(/vcpu\s*=\s*\d+/, `vcpu = ${vmSpec.vcpu}`)
    .replace(/memory\s*=\s*\d+/, `memory = ${vmSpec.memory}`)
    .replace(/init_iso\s*=\s*".*"/, `init_iso = "${safeName}.iso"`)
    .replace(/image_path\s*=\s*".*"/, `image_path = "./images/${vmSpec.os_type}/${vmSpec.version}.${vmSpec.ext}"`)
    .replace(/final_disk_name\s*=\s*".*"/, `final_disk_name = "final-${safeName}.qcow2"`)
    .replace(/disk_size\s*=\s*\d+/, `disk_size = ${vmSpec.disk_size}`)
    .replace(/username\s*=\s*".*"/, `username = "${userName}"`);
  
  await fs.writeFile(varsPath, content);
  return { vmDir, safeName };
};

// ✅ NOUVELLE FONCTION: Mise à jour de la configuration
export const updateConfig = async (vmDir, vmSpec, currentFinalDiskName) => {
  const varsPath = path.join(vmDir, 'terraform.tfvars');
  let content = await fs.readFile(varsPath, 'utf-8');

  // Mise à jour des ressources
  content = content
    .replace(/vcpu\s*=\s*\d+/, `vcpu = ${vmSpec.vcpu}`)
    .replace(/memory\s*=\s*\d+/, `memory = ${vmSpec.memory}`)
    .replace(/disk_size\s*=\s*\d+/, `disk_size = ${vmSpec.disk_size}`);

  // ✅ LOGIQUE CRITIQUE : Utiliser le disque final existant comme volume source pour éviter la perte de données
  if (currentFinalDiskName) {
    // On remplace le volume_name original par le disque final actuel
    content = content.replace(/volume_name\s*=\s*".*"/, `volume_name = "${currentFinalDiskName}"`);
  }

  await fs.writeFile(varsPath, content);
  console.log(`[Terraform] Config updated in ${vmDir}`);
};

export const applyConfig = async (vmDir) => {
  const cmd = `cd ${vmDir} && terraform init -input=false && terraform apply -auto-approve`;
  
  console.log(`[Terraform] Running: ${cmd}`);
  const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
  
  if (stderr && !stderr.includes('Warning')) {
    console.error(`[Terraform] Error: ${stderr}`);
    throw new Error(stderr);
  }
  
  console.log(`[Terraform] Success: ${stdout}`);
  return stdout;
};

export const destroyConfig = async (vmDir) => {
  const cmd = `cd ${vmDir} && terraform destroy -auto-approve`;
  await execAsync(cmd);
  await fs.remove(vmDir).catch(() => {});
};

export const getOutputs = async (vmDir) => {
  const cmd = `cd ${vmDir} && terraform output -json`;
  const { stdout } = await execAsync(cmd);
  const outputs = JSON.parse(stdout);
  
  console.log('[Terraform] Outputs:', {
    ip: outputs.vm_cloud_IP?.value,
    hasSshKey: !!outputs.vm_cloud_ssh_private_key?.value
  });
  
  return {
    ip: outputs.vm_cloud_IP?.value || null,
    sshKey: outputs.vm_cloud_ssh_private_key?.value || null  // ✅ Extrait la clé
  };
};

export const applyWithRetry = async (vmDir, retries = RETRY) => {
  for (let i = 0; i < retries; i++) {
    try { return await applyConfig(vmDir); } 
    catch (e) { if (i === retries - 1) throw e; await new Promise(r => setTimeout(r, 5000)); }
  }
};