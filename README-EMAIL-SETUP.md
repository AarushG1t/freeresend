# AWS SES SMTP Email Setup for FreeResend

This guide walks you through configuring **AWS SES SMTP** and running the local test script `test-smtp.js` in this project.

## 1. Prerequisites

- AWS account (you already have: Account ID `0707-8584-2887`).
- Region: **us-east-1 (US East N. Virginia)**.
- Domain: **flux-pro.com** managed in your DNS provider (e.g. GoDaddy).

## 2. Verify your domain in AWS SES

1. Open the **AWS Console** and go to **Amazon SES** (v2).
2. In the top-right region selector, choose **US East (N. Virginia) – us-east-1**.
3. In the left navigation, go to **Verified identities**.
4. Click **Create identity** → choose **Domain**.
5. Enter `flux-pro.com` and follow the prompts.
6. SES will show DNS records (TXT for verification, plus 3 DKIM CNAMEs).
7. In your DNS provider (e.g. GoDaddy), add all the records exactly as shown.
8. Wait for DNS propagation, then refresh the SES console until the domain status is **Verified**.

> The sender address `noreply@flux-pro.com` must come from this verified domain.

## 3. (Optional) Verify a test recipient (SES sandbox)

New SES accounts are usually in **sandbox**. In sandbox mode, you can only send emails **to verified identities**.

1. In SES → **Verified identities**, click **Create identity**.
2. Choose **Email address**.
3. Enter your test recipient address, e.g. `your-test-email@example.com`.
4. AWS will send a verification email; click the link to confirm.

Use this email address as `TEST_RECIPIENT` in your `.env` file while SES is in sandbox.

## 4. Generate SMTP credentials (NOT AWS access keys)

SMTP credentials are **separate** from normal AWS access keys and are used by Nodemailer to authenticate with SES.

1. In SES, go to **SMTP settings** (left navigation).
2. Confirm the **SMTP endpoint** is:
   - `email-smtp.us-east-1.amazonaws.com`
3. Click **Create SMTP credentials**.
4. AWS will open the IAM console with a preconfigured user.
5. Click **Create user**.
6. On the final page, you will see:
   - **SMTP username**
   - **SMTP password**
7. Copy both values and store them securely.

> These values are what you will put into `SMTP_USER` and `SMTP_PASS` in your `.env` file.
> They are **not** your AWS access key / secret access key.

## 5. Create and configure `.env`

In the project root (`freeresend`), there is a `.env` template. If it does not exist, create it with:

```bash
cp .env .env.local # (optional) or just edit .env directly
```

Then open `.env` and set values:

```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false

SMTP_USER=YOUR_SES_SMTP_USERNAME
SMTP_PASS=YOUR_SES_SMTP_PASSWORD

EMAIL_FROM=noreply@flux-pro.com
TEST_RECIPIENT=your-test-email@example.com
```

### Notes

- `SMTP_HOST` must match the SES region where you created SMTP credentials.
- `SMTP_PORT=587` with `SMTP_SECURE=false` means we use **STARTTLS**.
- `EMAIL_FROM` must be from the verified domain (`flux-pro.com`).
- In sandbox, `TEST_RECIPIENT` must also be a verified email identity.

Environment files are already **ignored** by git via `.gitignore` (`.env*`), so your secrets will not be committed.

## 6. Install Node dependencies

In the project root:

```bash
npm install
npm install dotenv
```

- `nodemailer` is already listed as a dependency in `package.json`.
- `dotenv` is used by `test-smtp.js` to load variables from `.env`.

## 7. Run the SMTP test script

From the project root:

```bash
node test-smtp.js
```

You should see logs similar to:

```text
📦 Loading configuration from environment variables...
✅ Configuration loaded.
🚀 Creating SMTP transport (AWS SES)...
🔍 Verifying SMTP connection...
✅ SMTP connection verified successfully!
✉️  Sending test email via AWS SES SMTP...
✅ Email sent successfully!
🎉 Test completed successfully!
```

If the script fails, it will:

- Print a clear error message.
- Suggest common causes (bad SMTP host, wrong region, sandbox restrictions, etc.).

## 8. Moving out of SES sandbox mode

To send emails to **any** recipient (not just verified addresses):

1. In the SES console, search for **"Request production access"** or open the **Account dashboard**.
2. Follow the guidance to **request production access** for SES in your region (us-east-1).
3. In the request form, describe your use case (transactional email, low spam, opt-in users, etc.).
4. AWS will review and, if approved, your account will be moved out of sandbox.

Once out of sandbox:

- `EMAIL_FROM` only needs to be from a verified domain/identity.
- `TEST_RECIPIENT` (and other recipients) do not need to be individually verified.

## 9. Troubleshooting common issues

### Authentication errors (e.g. 535 Authentication Credentials Invalid)

- Double-check `SMTP_USER` and `SMTP_PASS` in `.env`.
- Ensure they match the SMTP credentials generated in SES **for us-east-1**.

### Connection errors / timeouts

- Verify `SMTP_HOST` is `email-smtp.us-east-1.amazonaws.com`.
- Confirm your network or firewall allows outbound traffic on port **587**.

### Sender not authorized / email address not verified

- Ensure `flux-pro.com` or `noreply@flux-pro.com` is a **verified identity** in SES.
- Check SES → **Verified identities** for status.

### Recipient not verified (while in sandbox)

- Verify the recipient email as an identity in SES.
- Or request production access to move out of sandbox.

---

With `.env` configured and `dotenv` installed, `node test-smtp.js` gives you a clear, production-style check that your AWS SES SMTP setup for `flux-pro.com` is working.
