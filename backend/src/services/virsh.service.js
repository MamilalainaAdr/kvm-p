import util from 'util';
import { exec } from 'child_process';
import { XMLParser } from 'fast-xml-parser';
const execPromise = util.promisify(exec);

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

async function run(cmd) {
  try {
    const { stdout } = await execPromise(cmd, { maxBuffer: 1024 * 1024 * 10 });
    return stdout?.toString().trim() || '';
  } catch (err) {
    throw new Error(`${cmd} failed: ${err.message}`);
  }
}

// --- Helpers -------------------------------------------------------

function parseSizeToBytes(s) {
  if (!s) return null;
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return null;
  const lower = s.toLowerCase();
  if (lower.includes('t')) return Math.round(n * 1024 ** 4);
  if (lower.includes('g')) return Math.round(n * 1024 ** 3);
  if (lower.includes('m')) return Math.round(n * 1024 ** 2);
  if (lower.includes('k')) return Math.round(n * 1024);
  return Math.round(n);
}

async function getDiskInfo(path) {
  // Try qemu-img first
  if (path?.startsWith('/')) {
    try {
      const out = await run(`qemu-img info --output=json ${path}`);
      const info = JSON.parse(out);
      return {
        virtual_bytes: info['virtual-size'] ?? null,
        actual_bytes: info['actual-size'] ?? null,
        disk_path: path,
      };
    } catch { /* fallback to virsh */ }
  }

  // Try virsh vol-info fallback
  try {
    const out = await run(`virsh vol-info ${path}`);
    let capacity, allocation;
    for (const line of out.split('\n')) {
      const l = line.trim().toLowerCase();
      if (l.startsWith('capacity')) capacity = parseSizeToBytes(line.split(':')[1]);
      if (l.startsWith('allocation')) allocation = parseSizeToBytes(line.split(':')[1]);
    }
    return {
      virtual_bytes: capacity ?? null,
      actual_bytes: allocation ?? null,
      disk_path: path,
    };
  } catch {
    return { virtual_bytes: null, actual_bytes: null, disk_path: path ?? null };
  }
}

function extractDiskPaths(xmlDomain) {
  if (!xmlDomain?.domain?.devices?.disk) return [];
  const disks = Array.isArray(xmlDomain.domain.devices.disk)
    ? xmlDomain.domain.devices.disk
    : [xmlDomain.domain.devices.disk];

  const paths = [];
  for (const d of disks) {
    const src = d?.source;
    if (!src) continue;
    if (typeof src === 'string') paths.push(src);
    if (src.file) paths.push(src.file);
    if (src['@_file']) paths.push(src['@_file']);
    if (src.dev) paths.push(src.dev);
  }
  return [...new Set(paths)];
}

// --- Main ----------------------------------------------------------

export async function listVMs() {
  const out = await run('virsh list --all --name');
  return out.split('\n').map(l => l.trim()).filter(Boolean);
}

export async function getVMState(vmName) {
  try {
    return (await run(`virsh domstate ${vmName}`)).trim();
  } catch {
    return 'unknown';
  }
}

export async function getVMInfo(vmName) {
  const xmlOut = await run(`virsh dumpxml ${vmName}`);
  if (!xmlOut) return null;

  const xml = parser.parse(xmlOut);
  const vcpu = parseInt(xml?.domain?.vcpu?.['#text'] ?? xml?.domain?.vcpu ?? 0, 10) || null;
  const memKib = parseInt(xml?.domain?.memory?.['#text'] ?? xml?.domain?.memory ?? 0, 10);
  const memory_mib = memKib ? Math.round(memKib / 1024) : null;

  // get first disk
  const disks = extractDiskPaths({ domain: xml.domain });
  let virtual_bytes = null, actual_bytes = null, disk_path = null;

  for (const d of disks) {
    const info = await getDiskInfo(d);
    if (info.virtual_bytes || info.actual_bytes) {
      virtual_bytes = info.virtual_bytes;
      actual_bytes = info.actual_bytes;
      disk_path = info.disk_path;
      break;
    }
  }

  const capacity_mib = virtual_bytes ? Math.round(virtual_bytes / (1024 * 1024)) : null;
  const allocation_mib = actual_bytes ? Math.round(actual_bytes / (1024 * 1024)) : null;
  const thin_provisioned = virtual_bytes && actual_bytes
    ? virtual_bytes > actual_bytes * 4
    : false;

  return {
    vcpu,
    memory_mib,
    size: { capacity_mib, allocation_mib },
    disk_path,
    virtual_bytes,
    actual_bytes,
    thin_provisioned,
    rawXml: xml,
  };
}

export async function getVMSummary(vmName) {
  try {
    const [state, info] = await Promise.all([
      getVMState(vmName),
      getVMInfo(vmName),
    ]);
    return {
      name: vmName,
      state: state || 'unknown',
      vcpu: info?.vcpu ?? null,
      memory_mib: info?.memory_mib ?? null,
      size: info?.size ?? { capacity_mib: null, allocation_mib: null },
      virtual_bytes: info?.virtual_bytes ?? null,
      actual_bytes: info?.actual_bytes ?? null,
      disk_path: info?.disk_path ?? null,
      thin_provisioned: info?.thin_provisioned ?? false,
    };
  } catch (err) {
    return {
      name: vmName,
      state: 'unknown',
      vcpu: null,
      memory_mib: null,
      size: { capacity_mib: null, allocation_mib: null },
      virtual_bytes: null,
      actual_bytes: null,
      disk_path: null,
      thin_provisioned: false,
      error: err.message,
    };
  }
}

export async function startVM(vmName) {
  await run(`virsh start ${vmName}`);
  return { success: true };
}

export async function stopVM(vmName) {
  await run(`virsh shutdown ${vmName}`);
  return { success: true };
}

export async function rebootVM(vmName) {
  await run(`virsh reboot ${vmName}`);
  return { success: true };
}

export async function forceStopVM(vmName) {
  await run(`virsh destroy ${vmName}`);
  return { success: true };
}

export async function getVMResources(vmName) {
  try {
    const [state, info] = await Promise.all([
      getVMState(vmName),
      getVMInfo(vmName),
    ]);

    return {
      name: vmName,
      state,
      vcpu: info?.vcpu ?? null,
      memory_mib: info?.memory_mib ?? null,
      disk: {
        capacity_mib: info?.size?.capacity_mib ?? null,
        allocation_mib: info?.size?.allocation_mib ?? null,
        virtual_bytes: info?.virtual_bytes ?? null,
        actual_bytes: info?.actual_bytes ?? null,
        path: info?.disk_path ?? null,
        thin_provisioned: info?.thin_provisioned ?? false,
      },
      raw: info?.rawXml ?? null,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    throw new Error(`Failed to get VM resources for ${vmName}: ${err.message}`);
  }
}