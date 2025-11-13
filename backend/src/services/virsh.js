import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const getVMState = async (vmName) => {
  try {
    // Timeout 5 secondes pour éviter blocage
    const { stdout } = await execAsync(`virsh domstate ${vmName}`, { timeout: 5000 });
    return stdout.trim();
  } catch (err) {
    // Si VM n'existe pas, virsh retourne "error: failed to get domain"
    if (err.message?.includes('failed to get domain')) return 'unknown';
    throw err; // Autre erreur (virsh down, etc.)
  }
};


export const startVM = async (vmName) => {
  await execAsync(`virsh start ${vmName}`);
};

export const stopVM = async (vmName) => {
  await execAsync(`virsh shutdown ${vmName}`);
};

export const forceStopVM = async (vmName) => {
  await execAsync(`virsh destroy ${vmName}`);
};

export const rebootVM = async (vmName) => {
  await execAsync(`virsh reboot ${vmName}`);
};