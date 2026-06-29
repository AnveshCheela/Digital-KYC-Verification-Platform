const { Worker } = require('bullmq');
const IORedis = require('ioredis');

let resend = null;

// Lazy-init Resend only if API key is configured
function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const connection = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null,
});

/**
 * Notification Worker — sends status notification emails via Resend API.
 *
 * Falls back to console logging if Resend is not configured,
 * so the system works without an email provider during development.
 */
const notificationWorker = new Worker(
  'notification',
  async (job) => {
    const { userEmail, userName, verificationId, status, notes } = job.data;

    console.log(`[NOTIFICATION] Sending ${status} notification to ${userEmail}`);

    const subject = getSubject(status);
    const html = getEmailHtml(userName, status, verificationId, notes);

    const client = getResendClient();

    if (!client) {
      // No Resend API key — log the email instead of sending
      console.log(`[NOTIFICATION] Email (no Resend key, logging only):`);
      console.log(`  To: ${userEmail}`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Status: ${status}`);
      return { sent: false, reason: 'No Resend API key configured' };
    }

    const { data, error } = await client.emails.send({
      from: process.env.EMAIL_FROM || 'VerifyFlow <noreply@verifyflow.com>',
      to: [userEmail],
      subject,
      html,
    });

    if (error) {
      throw new Error(`Email send failed: ${error.message}`);
    }

    console.log(`[NOTIFICATION] Email sent to ${userEmail} (ID: ${data?.id})`);
    return { sent: true, emailId: data?.id };
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000, // Max 10 emails per second
    },
  }
);

function getSubject(status) {
  const subjects = {
    approved: 'KYC Verification Approved ✅',
    rejected: 'KYC Verification Update',
    manual_review: 'KYC Verification Under Review',
  };
  return subjects[status] || 'KYC Verification Status Update';
}

function getEmailHtml(userName, status, verificationId, notes) {
  const statusConfig = {
    approved: {
      color: '#10b981',
      icon: '✅',
      heading: 'Verification Approved!',
      message: 'Your identity document has been successfully verified. Your account is now fully activated.',
    },
    rejected: {
      color: '#ef4444',
      icon: '❌',
      heading: 'Verification Not Approved',
      message: 'Unfortunately, we were unable to verify your identity document. Please review the notes below and try again with a clearer image.',
    },
    manual_review: {
      color: '#f59e0b',
      icon: '🔍',
      heading: 'Verification Under Review',
      message: 'Your document requires additional review by our team. We\'ll notify you once the review is complete.',
    },
  };

  const config = statusConfig[status] || statusConfig.manual_review;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0a0e1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
        <div style="background:linear-gradient(135deg,#1a1f35,#0f1428);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">${config.icon}</div>
          <h1 style="color:#ffffff;font-size:24px;margin-bottom:8px;">Hello, ${userName}</h1>
          <h2 style="color:${config.color};font-size:20px;margin-bottom:24px;">${config.heading}</h2>
          <p style="color:#94a3b8;font-size:16px;line-height:1.6;margin-bottom:24px;">${config.message}</p>
          ${notes ? `
            <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:16px;margin-bottom:24px;text-align:left;">
              <p style="color:#64748b;font-size:12px;text-transform:uppercase;margin-bottom:8px;">Review Notes</p>
              <p style="color:#e2e8f0;font-size:14px;margin:0;">${notes}</p>
            </div>
          ` : ''}
          <div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:12px;margin-bottom:24px;">
            <p style="color:#64748b;font-size:12px;margin:0;">Verification ID</p>
            <p style="color:#94a3b8;font-size:14px;font-family:monospace;margin:4px 0 0;">${verificationId}</p>
          </div>
          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:24px 0;">
          <p style="color:#475569;font-size:12px;">This is an automated message from VerifyFlow. Do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ── Worker Event Handlers ───────────────────────────────
notificationWorker.on('completed', (job) => {
  console.log(`[NOTIFICATION] Job ${job.id} completed`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[NOTIFICATION] Job ${job?.id} failed:`, err.message);
});

module.exports = notificationWorker;
