const nodemailer = require('nodemailer');
require('dotenv').config();

// Load and validate required environment variables for AWS SES SMTP
function getConfigFromEnv() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
    EMAIL_FROM,
    TEST_RECIPIENT,
  } = process.env;

  const missing = [];

  if (!SMTP_HOST) missing.push('SMTP_HOST');
  if (!SMTP_PORT) missing.push('SMTP_PORT');
  if (!SMTP_USER) missing.push('SMTP_USER');
  if (!SMTP_PASS) missing.push('SMTP_PASS');
  if (!EMAIL_FROM) missing.push('EMAIL_FROM');
  if (!TEST_RECIPIENT) missing.push('TEST_RECIPIENT');

  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.\n` +
        'Create a .env file in the project root with values like:\n' +
        '  SMTP_HOST=email-smtp.us-east-1.amazonaws.com\n' +
        '  SMTP_PORT=587\n' +
        '  SMTP_SECURE=false\n' +
        '  SMTP_USER=<SMTP username from SES>\n' +
        '  SMTP_PASS=<SMTP password from SES>\n' +
        '  EMAIL_FROM=noreply@flux-pro.com\n' +
        '  TEST_RECIPIENT=your-test-email@example.com\n'
    );
  }

  const port = Number(SMTP_PORT);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`SMTP_PORT must be a valid positive number. Received: ${SMTP_PORT}`);
  }

  const secure = String(SMTP_SECURE).toLowerCase() === 'true';

  return {
    smtpConfig: {
      host: SMTP_HOST,
      port,
      secure,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    },
    from: EMAIL_FROM,
    to: TEST_RECIPIENT,
  };
}

/**
 * Test sending an email via AWS SES SMTP.
 *
 * Notes about AWS SES SMTP credentials:
 * - You MUST generate dedicated SMTP credentials from the AWS SES Console.
 *   These are created under: SES Console → SMTP settings → Create SMTP credentials.
 * - These are NOT your normal AWS access key / secret access key.
 * - The SMTP credentials are region-specific (here we use us-east-1).
 *
 * SES sandbox vs production:
 * - In sandbox mode, both the SENDER (EMAIL_FROM) and RECIPIENT (TEST_RECIPIENT)
 *   must be verified identities in SES.
 * - To verify an email: SES Console → Verified identities → Create identity → Email address.
 * - To move out of sandbox (send to any address): SES Console → Request production access
 *   and follow the approval process.
 */
async function sendTestEmail() {
  console.log('📦 Loading configuration from environment variables...');

  const { smtpConfig, from, to } = getConfigFromEnv();

  console.log('✅ Configuration loaded.');
  console.log('   Host   :', smtpConfig.host);
  console.log('   Port   :', smtpConfig.port);
  console.log('   Secure :', smtpConfig.secure);
  console.log('   From   :', from);
  console.log('   To     :', to);

  console.log('\n🚀 Creating SMTP transport (AWS SES)...');
  const transporter = nodemailer.createTransport(smtpConfig);

  try {
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');
  } catch (error) {
    console.error('\n❌ Failed to verify SMTP connection.');
    console.error('   Error message:', error.message);
    console.error(
      '\nCommon causes:\n' +
        '- Incorrect SMTP host / port / secure settings.\n' +
        '- Wrong SMTP username or password.\n' +
        '- SES credentials created in a different region than email-smtp.us-east-1.amazonaws.com.\n' +
        '- Network/firewall blocking outbound traffic on port 587.'
    );
    throw error;
  }

  console.log('\n✉️  Sending test email via AWS SES SMTP...');

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: 'FreeResend SMTP Test - AWS SES (flux-pro.com)',
      text:
        'This is a test email sent via AWS SES SMTP using the configuration from your .env file.',
      html: `
        <h2>✅ AWS SES SMTP Test Successful!</h2>
        <p>This email was sent using your SES SMTP configuration:</p>
        <ul>
          <li><strong>Domain:</strong> flux-pro.com</li>
          <li><strong>Server:</strong> ${smtpConfig.host}:${smtpConfig.port}</li>
          <li><strong>Secure (TLS):</strong> ${smtpConfig.secure}</li>
          <li><strong>From:</strong> ${from}</li>
          <li><strong>To:</strong> ${to}</li>
        </ul>
        <p>If you received this email, your SMTP credentials are working correctly.</p>
        <hr>
        <p><small>Sent from FreeResend - Self-hosted email service</small></p>
      `,
    });

    console.log('\n✅ Email sent successfully!');
    console.log('   Message ID:', info.messageId);
    if (info.response) {
      console.log('   Response  :', info.response);
    }
  } catch (error) {
    console.error('\n❌ Failed to send email via SMTP.');
    console.error('   Error message:', error.message);
    console.error(
      '\nCommon causes:\n' +
        '- Sender email is not verified in SES.\n' +
        '- Recipient email is not verified while SES is still in sandbox mode.\n' +
        '- SES sending is not yet approved for production.\n' +
        '- SES sending limits or bounces / complaints issues.'
    );
    throw error;
  }
}

// Run the test when this script is executed directly
sendTestEmail()
  .then(() => {
    console.log('\n🎉 Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ SMTP test failed. See details above.');
    console.error('Full error object for debugging:', error);
    process.exit(1);
  });
