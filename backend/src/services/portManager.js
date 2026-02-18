import { exec } from 'child_process';
import { promisify } from 'util';
import { Op } from 'sequelize';
import { VirtualMachine } from '../models/index.js';

const execAsync = promisify(exec);

const PORT_RANGE_START = parseInt(process.env.PORT_RANGE_START) || 10000;
const PORT_RANGE_END = parseInt(process.env.PORT_RANGE_END) || 20000;

/**
 * Trouve un port libre dans la plage configurée
 */
export async function findFreePort() {
  const usedPorts = await VirtualMachine.findAll({
    attributes: ['port'],
    where: { port: { [Op.ne]: null } }
  });
  const used = usedPorts.map(vm => vm.port);
  for (let port = PORT_RANGE_START; port <= PORT_RANGE_END; port++) {
    if (!used.includes(port)) return port;
  }
  throw new Error('Aucun port libre disponible');
}

/**
 * Configure la redirection iptables pour une VM
 * @param {number} port - Port externe
 * @param {string} internalIp - IP interne de la VM
 */
export async function addPortForwarding(port, internalIp) {
  const rules = [
    // Insérer au début de FORWARD pour passer avant UFW/DROP rules
    `sudo iptables -I FORWARD 1 -p tcp -d ${internalIp} --dport 22 -m conntrack --ctstate NEW -j ACCEPT`,
    `sudo iptables -I FORWARD 1 -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT`,
    
    // NAT rules (PREROUTING et POSTROUTING)
    `sudo iptables -t nat -A PREROUTING -p tcp --dport ${port} -j DNAT --to-destination ${internalIp}:22`,
    `sudo iptables -t nat -A POSTROUTING -d ${internalIp} -p tcp --dport 22 -j MASQUERADE`
  ];
  
  const ufwRule = `sudo ufw allow ${port}/tcp`;
  
  for (const rule of rules) {
    try {
      const { stdout, stderr } = await execAsync(rule);
      if (stderr && !stderr.includes('warning')) {
        console.warn(`[PortForward] STDERR: ${stderr}`);
      }
      console.log(`[PortForward] Règle ajoutée: ${rule}`);
    } catch (err) {
      console.error(`[PortForward] Erreur: ${rule}`);
      console.error(`${err.message}`);
    }
  }
  
  try {
    await execAsync(ufwRule);
    console.log(`[PortForward] UFW: port ${port}/tcp autorisé`);
  } catch (err) {
    console.warn(`[PortForward] UFW échoué: ${err.message}`);
  }
  
  console.log(`[PortForward] NAT + Forwarding configuré pour port ${port} -> ${internalIp}:22`);
}

/**
 * Supprime la redirection iptables pour une VM
 */
export async function removePortForwarding(port, internalIp) {
  const rules = [
    // NAT PREROUTING et POSTROUTING
    `sudo iptables -t nat -D PREROUTING -p tcp --dport ${port} -j DNAT --to-destination ${internalIp}:22`,   
    `sudo iptables -t nat -D POSTROUTING -d ${internalIp} -p tcp --dport 22 -j MASQUERADE`,   
    // FORWARD NEW, ESTABLISHED, RELATED
    `sudo iptables -D FORWARD -p tcp -d ${internalIp} --dport 22 -m conntrack --ctstate NEW -j ACCEPT`, 
    `sudo iptables -D FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT`
  ];
  
  const ufwRule = `sudo ufw delete allow ${port}/tcp`;
  
  for (const rule of rules) {
    try {
      const { stderr } = await execAsync(rule);
      if (stderr && !stderr.includes('warning')) {
        console.warn(`[PortForward] Avertissement suppression: ${stderr}`);
      }
      console.log(`[PortForward] Règle supprimée: ${rule}`);
    } catch (err) {
      console.warn(`[PortForward] Suppression échouée (peut être déjà absente): ${rule}`);
    }
  }
  
  try {
    await execAsync(ufwRule);
    console.log(`[PortForward] UFW supprimé: port ${port}/tcp`);
  } catch (err) {
    console.warn(`[PortForward] UFW suppression échouée: ${err.message}`);
  }
  
  console.log(`[PortForward] Redirection supprimée : port ${port}`);
}