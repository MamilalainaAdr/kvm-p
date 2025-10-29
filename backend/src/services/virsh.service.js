import util from 'util';
import { exec } from 'child_process';
import { XMLParser } from 'fast-xml-parser';
const execPromise = util.promisify(exec);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

export async function listVMs() {
  try {
    const { stdout } = await execPromise('virsh list --all');
    return stdout;
  } catch (err) {
    throw new Error(`Erreur virsh list: ${err.message}`);
  }
}

export async function getVMState(vmName) {
  try {
    const { stdout } = await execPromise(`virsh domstate ${vmName}`);
    return stdout.trim();
  } catch {
    return 'unknown';
  }
}

export async function getVMInfo(vmName) {
  try {
    const { stdout } = await execPromise(`virsh dumpxml ${vmName}`);
    const xml = parser.parse(stdout);

    const { stdout: volInfo } = await execPromise(`virsh vol-info --pool default ${vmName}.qcow2`).catch(() => ({ stdout: '' }));

    const filtered = {};
    for (const line of volInfo.split('\n')) {
      if (line.startsWith('Capacity')) filtered.Capacity = line.split(':')[1]?.trim();
      if (line.startsWith('Allocation')) filtered.Allocation = line.split(':')[1]?.trim();
      if (line.startsWith('Name')) filtered.File = line.split(':')[1]?.trim();
    }

    function formatSize(sizeStr) {
      if (!sizeStr) return 'N/A';
      const size = parseFloat(sizeStr);
      // vol-info prints sizes in KiB (or bytes depending on virsh), attempt a safe formatting:
      if (size > 1024 * 1024) return (size / (1024 * 1024)).toFixed(2) + ' GiB';
      if (size > 1024) return (size / 1024).toFixed(2) + ' MiB';
      return size.toFixed(2) + ' KiB';
    }

    function extractValue(obj) {
      if (!obj) return 'N/A';
      if (typeof obj === 'object' && '_text' in obj) return obj._text;
      if (typeof obj === 'object' && '#text' in obj) return obj['#text'];
      if (typeof obj === 'string' || typeof obj === 'number') return obj.toString();
      return JSON.stringify(obj);
    }

    const memKiB = parseInt(extractValue(xml.domain.memory)) || 0;
    const memory = memKiB ? (memKiB >= 1024 ? `${(memKiB / 1024).toFixed(2)} MiB` : `${memKiB} KiB`) : 'N/A';
    const vcpu = extractValue(xml.domain.vcpu);

    return {
      memory,
      vcpu,
      size: {
        Capacity: formatSize(filtered.Capacity),
        Allocation: formatSize(filtered.Allocation),
      },
      rawXml: xml // keep raw parsed xml in case extra details are needed
    };
  } catch (err) {
    throw new Error(`Erreur virsh dumpxml pour ${vmName}: ${err.message}`);
  }
}

export async function getVMResources(vmName) {
  try {
    const { stdout } = await execPromise(`virsh dominfo ${vmName}`);
    return stdout;
  } catch (err) {
    throw new Error(`Erreur virsh dominfo: ${err.message}`);
  }
}

/**
 * New helper: get a summarized object for a VM:
 * { name, state, vcpu, memory, size: { Capacity, Allocation } }
 */
export async function getVMSummary(vmName) {
  try {
    const [state, info] = await Promise.all([getVMState(vmName), getVMInfo(vmName)]);
    return {
      name: vmName,
      state,
      vcpu: info?.vcpu || 'N/A',
      memory: info?.memory || 'N/A',
      size: info?.size || { Capacity: 'N/A', Allocation: 'N/A' },
    };
  } catch (err) {
    // don't throw for a single VM summary — return best-effort object
    return {
      name: vmName,
      state: 'unknown',
      vcpu: 'N/A',
      memory: 'N/A',
      size: { Capacity: 'N/A', Allocation: 'N/A' },
      error: err.message
    };
  }
}