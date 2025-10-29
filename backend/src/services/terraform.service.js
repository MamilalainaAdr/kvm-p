import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { sendEmail } from './email.service.js';
import dotenv from 'dotenv';
dotenv.config();

const execPromise = util.promisify(exec);
const BASE_DIR = path.resolve(process.env.TERRAFORM_BASE_DIR || './terraform');
const TEMPLATE_DIR = path.resolve(process.env.TERRAFORM_TEMPLATE_DIR || path.join(BASE_DIR, 'cloud_img'));

export async function createWorkspace(user) {
  const userDir = path.join(BASE_DIR, user);
  await fs.ensureDir(userDir);
  return userDir;
}

export async function generateConfig(user, vmSpec) {
  const userDir = await createWorkspace(user);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const vmDir = path.join(userDir, `${user}_${timestamp}`);
  await fs.copy(TEMPLATE_DIR, vmDir);
  const varsPath = path.join(vmDir, 'terraform.tfvars');
  let content = await fs.readFile(varsPath, 'utf-8');

  content = content
    .replace(/name\s*=\s*".*"/, `name = "${vmSpec.name}-${user}"`)
    .replace(/volume_name\s*=\s*".*"/, `volume_name = "${vmSpec.name}.qcow2"`)
    .replace(/image_path\s*=\s*".*"/, `image_path = "./images/${vmSpec.os_type}/${vmSpec.version}.qcow2"`)
    .replace(/vcpu\s*=\s*\d+/, `vcpu = ${vmSpec.vcpu}`)
    .replace(/memory\s*=\s*\d+/, `memory = ${vmSpec.memory}`)
    .replace(/init_iso\s*=\s*".*"/, `init_iso = "${timestamp}commoninit.iso"`)
    .replace(/disk_size\s*=\s*\d+/, `disk_size = ${vmSpec.disk_size}`)
    .replace(/final_disk_name\s*=\s*".*"/, `final_disk_name = "${vmSpec.name}-${user}.qcow2"`)
    .replace(/username\s*=\s*".*"/, `username = "${user}"`);

  await fs.writeFile(varsPath, content);
  return vmDir;
}

export async function applyConfig(vmDir) {
  const cmd = `cd ${vmDir} && terraform init -input=false && terraform apply -auto-approve`;
  try {
    const { stdout, stderr } = await execPromise(cmd, { maxBuffer: 1024 * 1024 * 10 });
    if (stderr && !stderr.includes('Warning')) {
      await fs.remove(vmDir);
      throw new Error(stderr);
    }
    return stdout;
  } catch (err) {
    console.error('Erreur apply VM:', err.message);
    await fs.remove(vmDir).catch(() => {});
    throw err;
  }
}

export async function getOutputs(vmDir, userEmail = null, user) {
  const cmd = `cd ${vmDir} && terraform output -json`;
  const { stdout } = await execPromise(cmd);
  const outputs = JSON.parse(stdout);

  if (userEmail && outputs.vm_cloud_IP?.value && outputs.vm_cloud_ssh_private_key?.value) {
    const ip = outputs.vm_cloud_IP.value;
    const ssh_key = outputs.vm_cloud_ssh_private_key.value;
    const html = `
      <h2>Machine virtuelle créée</h2>
      <p>Votre VM est maintenant opérationnelle 🎉</p>
      <p><b>Nom d'utilisateur :</b> ${user}</p>
      <p><b>Adresse IP :</b> ${ip}</p>
      <p>La clé privée SSH est jointe à cet e-mail sous forme de fichier</p>
    `;
    await sendEmail(userEmail, 'Votre VM est prête', html, [{
      filename: 'private_key',
      content: `${ssh_key}`
    }]);
  }

  return outputs;
}

export async function destroyConfig(vmDir, userEmail = null, vmName = null) {
  const cmd = `cd ${vmDir} && terraform destroy -auto-approve`;
  const { stdout, stderr } = await execPromise(cmd).catch(err => { throw err; });
  if (stderr && !stderr.includes('Warning')) throw new Error(stderr);
  await fs.remove(vmDir).catch(() => {});
  if (userEmail) {
    const html = `<h2>Machine virtuelle supprimée</h2><p>La VM <b>${vmName}</b> a bien été supprimée</p>`;
    await sendEmail(userEmail, 'Votre VM a bien été supprimée', html);
  }
  return stdout;
}