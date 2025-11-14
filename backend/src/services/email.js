import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

export const sendEmail = async (to, subject, html, attachments = []) => {
  console.log(`[Email Service] 📤 Envoi en cours:`, { to, subject, attachments: attachments.length }); // ✅ Log envoi
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments
    });
    console.log(`✅ Email envoyé à ${to})`); // ✅ Log succès avec ID
  } catch (err) {
    console.error('❌ Erreur envoi email:', err.message); // ✅ Log détaillé
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
      html: `
        <h2>Machine virtuelle créée</h2>
        <p>Votre VM est maintenant opérationnelle 🎉</p>
        <p><b>Nom :</b> ${vm.name}</p>
        <p><b>Adresse IP :</b> ${vm.ip_address || 'N/A'}</p>
        ${
          sshKey
            ? '<p>La clé privée SSH est jointe en pièce jointe.</p>'
            : '<p>Aucune clé SSH n’a été générée.</p>'
        }
      `
    },

    deleted: {
      subject: '🗑️ VM supprimée',
      html: `
        <h2>Machine virtuelle supprimée</h2>
        <p>La VM <b>${vm.name}</b> a bien été supprimée.</p>
      `
    }
  };

  const msg = messages[action];

  console.log(
    `[Email Service] Préparation email: action=${action}, vm=${vm?.name}, sshKey=${!!sshKey}`
  );

  // 👉 Construction sécurisée des attachments
  const attachments = sshKey
    ? [
        {
          filename: `${vm.name}-ssh-key.pem`,
          content: sshKey,
          contentType: 'application/x-pem-file',
          contentDisposition: 'attachment'
        }
      ]
    : [];

  console.log(`[Email Service] Attachments: ${attachments.length}`);

  // 👉 Envoi
  await sendEmail(user.email, msg.subject, msg.html, attachments);
};
