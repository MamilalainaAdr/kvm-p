import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import dotenv from 'dotenv';
dotenv.config();

const execPromise = util.promisify(exec);
const BASE_DIR = path.resolve(process.env.TERRAFORM_BASE_DIR || './terraform');
const TEMPLATE_DIR = path.resolve(process.env.TERRAFORM_TEMPLATE_DIR || path.join(BASE_DIR, 'cloud_img'));
const RETRY_ATTEMPTS = parseInt(process.env.TERRAFORM_RETRY_ATTEMPTS || '3');

export async function generateConfig(user, vmSpec) {
  const userDir = path.join(BASE_DIR, user);
  await fs.ensureDir(userDir);
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const vmDir = path.join(userDir, `${user}_${timestamp}`);
  await fs.copy(TEMPLATE_DIR, vmDir);
  
  const varsPath = path.join(vmDir, 'terraform.tfvars');
  let content = await fs.readFile(varsPath, 'utf-8');

  // Logique conditionnelle pour l'extension
  const imageExt = vmSpec.version === '2404' || vmSpec.version === '2204' ? 'img' : 'qcow2';

  content = content
    .replace(/name\s*=\s*".*"/, `name = "${vmSpec.name}-${user}"`)
    .replace(/volume_name\s*=\s*".*"/, `volume_name = "${vmSpec.name}.qcow2"`)
    .replace(/image_path\s*=\s*".*"/, `image_path = "./images/${vmSpec.os_type}/${vmSpec.version}.${imageExt}"`)
    .replace(/vcpu\s*=\s*\d+/, `vcpu = ${vmSpec.vcpu}`)
    .replace(/memory\s*=\s*\d+/, `memory = ${vmSpec.memory}`)
    .replace(/disk_size\s*=\s*\d+/, `disk_size = ${vmSpec.disk_size}`)
    .replace(/username\s*=\s*".*"/, `username = "${user}"`);

  await fs.writeFile(varsPath, content);
  return vmDir;
}

export async function applyConfig(vmDir) {
  const cmd = `cd ${vmDir} && terraform init -input=false && terraform apply -auto-approve`;
  try {
    const { stdout, stderr } = await execPromise(cmd, { maxBuffer: 1024 * 1024 * 10 });
    if (stderr && !stderr.includes('Warning')) throw new Error(stderr);
    return stdout;
  } catch (err) {
    await fs.remove(vmDir).catch(() => {});
    throw err;
  }
}

export async function getOutputs(vmDir) {
  const cmd = `cd ${vmDir} && terraform output -json`;
  const { stdout } = await execPromise(cmd);
  return JSON.parse(stdout);
}

export async function destroyConfig(vmDir) {
  const cmd = `cd ${vmDir} && terraform destroy -auto-approve`;
  const { stdout } = await execPromise(cmd);
  await fs.remove(vmDir).catch(() => {});
  return stdout;
}

export async function applyConfigWithRetry(vmDir, retries = RETRY_ATTEMPTS) {
  for (let i = 0; i < retries; i++) {
    try {
      return await applyConfig(vmDir);
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`[Terraform] Retry ${i + 1}/${retries}...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}