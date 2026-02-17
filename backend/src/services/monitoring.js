import { exec } from 'child_process';
import { promisify } from 'util';
import { VirtualMachine } from '../models/index.js';
import { getVMState } from './virsh.js';

const execAsync = promisify(exec);

/**
 * Récupère les statistiques système de l'hôte
 * @returns {Promise<Object>} { cpu: { usage, cores }, ram: { used, total, percent }, disk: { used, total, percent } }
 */
export async function getSystemStats() {
  try {
    // CPU : utilisation moyenne (1 min) en pourcentage
    const cpuUsage = await execAsync("top -bn1 | grep '%Cpu' | awk '{print $2}'");
    const cpuCores = await execAsync('nproc');
    const cpuPercent = parseFloat(cpuUsage.stdout.trim()) || 0;
    const cores = parseInt(cpuCores.stdout.trim()) || 1;

    // RAM : utilisé / total en MB
    const memInfo = await execAsync("free -m | awk '/Mem:/ {print $3 \" \" $2}'");
    const [memUsed, memTotal] = memInfo.stdout.trim().split(' ').map(Number);
    const ramPercent = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0;

    // Disque : utilisé / total en GB (partition racine)
    const diskInfo = await execAsync("df -BG / | awk 'NR==2 {print $3 \" \" $2}' | sed 's/G//g'");
    const [diskUsedGB, diskTotalGB] = diskInfo.stdout.trim().split(' ').map(Number);
    const diskPercent = diskTotalGB > 0 ? Math.round((diskUsedGB / diskTotalGB) * 100) : 0;

    // Nombre de VMs actives sur l'hôte (via virsh)
    const activeVMs = await execAsync("virsh list --state-running --name | grep -c .");
    const activeCount = parseInt(activeVMs.stdout.trim()) || 0;

    return {
      cpu: { usage: cpuPercent, cores },
      ram: { used: memUsed, total: memTotal, percent: ramPercent },
      disk: { used: diskUsedGB, total: diskTotalGB, percent: diskPercent },
      activeVMs: activeCount
    };
  } catch (error) {
    console.error('[Monitoring] Erreur stats système:', error.message);
    return {
      cpu: { usage: 0, cores: 0 },
      ram: { used: 0, total: 0, percent: 0 },
      disk: { used: 0, total: 0, percent: 0 },
      activeVMs: 0
    };
  }
}

/**
 * Récupère les statistiques d'une VM spécifique
 * @param {string} vmName - Nom de la VM (full_name)
 * @returns {Promise<Object|null>}
 */
export async function getVMStats(vmName) {
  try {
    const state = await getVMState(vmName);
    if (state === 'unknown') return null;

    // CPU : temps CPU brut en nanosecondes
    const cpuStats = await execAsync(`virsh domstats "${vmName}" --cpu-total | grep cpu.time | awk '{print $3}'`);
    const cpuTime = parseInt(cpuStats.stdout.trim()) || 0;

    // Nombre de vCPU
    const vcpuInfo = await execAsync(`virsh dominfo "${vmName}" | grep 'CPU(s)' | awk '{print $2}'`);
    const vcpu = parseInt(vcpuInfo.stdout.trim()) || 1;

    // RAM : parsing fiable
    const memCmd = await execAsync(`virsh dommemstat "${vmName}"`);
    const memLines = memCmd.stdout.split('\n');

    let memActualKB = 0;
    let memUnusedKB = 0;

    for (const line of memLines) {
      const [key, val] = line.trim().split(' ');
      if (key === 'actual') memActualKB = Number(val) || 0;
      if (key === 'unused') memUnusedKB = Number(val) || 0;
    }

    const memActual = memActualKB / 1024;
    const memUsed = (memActualKB - memUnusedKB) / 1024;
    const memPercent = memActual > 0 ? Math.round((memUsed / memActual) * 100) : 0;

    // Disque : récupération en bytes puis conversion GB
    const diskPath = await execAsync(`virsh domblklist "${vmName}" | awk '/vda/ {print $2}'`);
    const path = diskPath.stdout.trim();

    if (path) {
      const volInfo = await execAsync(`virsh vol-info --bytes "${path}" --pool default`);
      const output = volInfo.stdout;

      const capacityMatch = output.match(/Capacity:\s+(\d+)/);
      const allocationMatch = output.match(/Allocation:\s+(\d+)/);

      const capacityBytes = capacityMatch ? Number(capacityMatch[1]) : 0;
      const allocationBytes = allocationMatch ? Number(allocationMatch[1]) : 0;

      const diskTotal = Math.round(capacityBytes / 1024 / 1024 / 1024);
      const diskUsed = Math.round(allocationBytes / 1024 / 1024 / 1024);
      const diskPercent = diskTotal > 0 ? Math.round((diskUsed / diskTotal) * 100) : 0;

      return {
        name: vmName,
        status: state,
        cpu: { usage: cpuTime, vcpu },
        ram: { used: memUsed, total: memActual, percent: memPercent },
        disk: { used: diskUsed, total: diskTotal, percent: diskPercent }
      };
    }

    return null;
  } catch (error) {
    console.error(`[Monitoring] Erreur VM ${vmName}:`, error.message);
    return null;
  }
}

/**
 * Récupère les statistiques de toutes les VMs d'un utilisateur (ou toutes si admin)
 * @param {number} userId - ID de l'utilisateur
 * @param {boolean} isAdmin - Si admin, toutes les VMs sont retournées
 * @returns {Promise<Array>}
 */
export async function getUserVMsStats(userId, isAdmin) {
  const where = isAdmin ? {} : { user_id: userId };
  const vms = await VirtualMachine.findAll({ where });

  const stats = [];
  for (const vm of vms) {
    if (vm.full_name) {
      const stat = await getVMStats(vm.full_name);
      if (stat) stats.push({ ...stat, ...vm.toJSON() });
    }
  }

  return stats;
}
