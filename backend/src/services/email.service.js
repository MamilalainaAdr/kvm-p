import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendEmail(to, subject, html, attachments = []) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      attachments
    });
    console.log(`✅ Email envoyé à ${to}`);
  } catch (err) {
    console.error('❌ Erreur envoi email:', err.message);
    throw err;
  }
}

// sendVerificationEmail: builds link to frontend verify page (CORS_ORIGIN)
export const sendVerificationEmail = async (user, token) => {
  const appUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const url = `${appUrl}/verify-email?token=${token}`;
  const html = `<p>Bonjour ${user.name},</p>
    <p>Merci de vous être inscrit. Cliquez sur le lien pour vérifier votre email :</p>
    <a href="${url}">${url}</a>`;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'no-reply@example.com',
      to: user.email,
      subject: 'Vérification email - KVM Platform',
      html
    });
    console.log('Verification email sent to', user.email);
  } catch (err) {
    // si en dev sans SMTP on ne veut pas bloquer
    console.warn('sendVerificationEmail warning (email not sent):', err.message);
  }
};