import 'dotenv/config';
import { emailQueue } from '../services/queue.js';
import { sendVMEmail } from '../services/email.js';
import { User, VirtualMachine } from '../models/index.js';

emailQueue.process('vm-created', async (job) => {
  const { email, vmName, ip, sshKey } = job.data;
  const user = await User.findOne({ where: { email } });
  const vm = await VirtualMachine.findOne({ where: { name: vmName } });
  
  await sendVMEmail(user, vm, 'created', sshKey); // ✅ Passer sshKey
});

emailQueue.process('vm-deleted', async (job) => {
  const { email, vmName } = job.data;
  const user = await User.findOne({ where: { email } });
  await sendVMEmail(user, { name: vmName }, 'deleted');
});

console.log('📧 Email Worker started');