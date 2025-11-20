import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getSystemStats() {
  try {
    console.log('[Monitoring] Collecte système en cours...');
    
    const cpuCmd = "top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1";
    const memCmd = "free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'";
    const diskCmd = "df / | tail -1 | awk '{print $5}' | cut -d'%' -f1";
    const vmCmd = "virsh list --state-running --name | grep -v '^$' | wc -l";
    const libvirtCmd = "ps -C libvirtd -o rss= 2>/dev/null | awk '{s+=$1} END {print s}'";

    const [
      { stdout: cpuOut },
      { stdout: memOut },
      { stdout: diskOut },
      { stdout: vmOut },
      { stdout: libvirtMem }
    ] = await Promise.allSettled([
      execAsync(cpuCmd),
      execAsync(memCmd),
      execAsync(diskCmd),
      execAsync(vmCmd),
      execAsync(libvirtCmd)
    ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : { stdout: '0' }));

    const stats = {
      timestamp: new Date().toISOString(),
      system: {
        cpuUsage: parseFloat(cpuOut.trim()) || 0,
        memoryUsage: parseFloat(memOut.trim()) || 0,
        diskUsage: parseInt(diskOut.trim()) || 0,
        activeVMs: parseInt(vmOut.trim()) || 0
      },
      libvirt: {
        memoryMB: Math.round((parseInt(libvirtMem.trim()) || 0) / 1024)
      }
    };

    return stats;
  } catch (err) {
    console.error('[Monitoring] Erreur collecte:', err.message);
    return { error: 'Failed to fetch stats', details: err.message };
  }
}

export async function getVMStats(userId, isAdmin = false) {
  const { VirtualMachine, User } = await import('../models/index.js');
  
  const where = isAdmin ? {} : { user_id: userId };
  const vms = await VirtualMachine.findAll({ where, raw: true });
  
  console.log(`[Monitoring] Récupération stats pour ${vms.length} VMs (userId: ${userId})`);
  
  const stats = await Promise.all(vms.map(async (vm) => {
    if (!vm.full_name) {
      return { ...vm, cpu: 0, memory: 0, diskUsed: 0, diskTotal: vm.disk_size };
    }
    
    try {
      const domstatsCmd = `virsh domstats --domain "${vm.full_name}" --cpu-total --balloon | grep -E 'cpu.time|balloon.current'`;
      const { stdout } = await execAsync(domstatsCmd, { timeout: 3000 });
      
      const cpuMatch = stdout.match(/cpu.time=(\d+)/);
      const memMatch = stdout.match(/balloon.current=(\d+)/);
      
      return {
        ...vm,
        cpu: cpuMatch ? Math.round(parseInt(cpuMatch[1]) / 1000000) : 0,
        memory: memMatch ? Math.round(parseInt(memMatch[1]) / 1024**2) : 0,
        diskUsed: vm.disk_size * 0.8, // Estimation
        diskTotal: vm.disk_size
      };
    } catch (err) {
      console.warn(`[Monitoring] Erreur VM ${vm.full_name}:`, err.message);
      return { ...vm, cpu: 0, memory: 0, diskUsed: 0, diskTotal: vm.disk_size, error: err.message };
    }
  }));
  
  return { vms: stats, total: vms.length };
}