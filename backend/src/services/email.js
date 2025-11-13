import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export const sendEmail = async (to, subject, html, attachments = []) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments  // ✅ Ajout du paramètre
    });
    console.log(`✅ Email envoyé à ${to}`);
  } catch (err) {
    console.error('❌ Erreur envoi email:', err.message);
    throw err;
  }
};

export const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.CORS_ORIGIN}/verify-email?token=${token}`;
  await sendEmail(user.email, 'Vérifiez votre email', `
    <p>Bonjour ${user.name},</p>
    <p>Cliquez pour vérifier : <a href="${url}">${url}</a></p>
  `);
};

export const sendVMEmail = async (user, vm, action, sshKey = null) => {
  const messages = {
    created: {
      subject: '✅ VM créée',
      body: `
        <h2>VM créée avec succès</h2>
        <p><strong>Nom:</strong> ${vm.name}</p>
        <p><strong>IP:</strong> ${vm.ip_address || 'N/A'}</p>
        ${sshKey ? '<p>La clé SSH est jointe en pièce jointe.</p>' : '<p>Aucune clé SSH générée.</p>'}
      `
    },
    deleted: {
      subject: '🗑️ VM supprimée',
      body: `<p>La VM ${vm.name} a été supprimée.</p>`
    }
  };

  const msg = messages[action];

  // ✅ Passer les attachments
  await sendEmail(user.email, msg.subject, msg.body, sshKey ? [{
    filename: `${vm.name}-ssh-key.pem`,
    content: sshKey,
    contentType: 'application/x-pem-file',
    contentDisposition: 'attachment'
  }] : []);
};