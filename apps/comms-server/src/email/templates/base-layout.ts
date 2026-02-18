/**
 * Base HTML email layout with UTA-branded header and footer.
 * Images are embedded as base64 data URIs — no attachments needed.
 */

import * as path from 'path';
import * as fs from 'fs';

/** Absolute paths to the header/footer images */
const IMAGES_DIR = path.join(
  process.cwd(),
  'apps',
  'comms-server',
  'src',
  'email',
  'images',
);

/** Read images once at startup and convert to base64 data URIs */
const headerBase64 = fs
  .readFileSync(path.join(IMAGES_DIR, 'header1.png'))
  .toString('base64');
const footerBase64 = fs
  .readFileSync(path.join(IMAGES_DIR, 'footer1.png'))
  .toString('base64');

const headerDataUri = `data:image/png;base64,${headerBase64}`;
const footerDataUri = `data:image/png;base64,${footerBase64}`;

/**
 * Wraps inner HTML body content in the branded email layout.
 * @param body - The inner HTML content specific to the template
 * @returns Full HTML document string
 */
export function baseLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mav Housing</title>
  <style>
    /* Reset */
    body, table, td, p, a { margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f8; }
    img { border: 0; display: block; }

    /* Container */
    .email-wrapper { width: 100%; background-color: #f4f6f8; padding: 24px 0; }
    .email-container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

    /* Header */
    .email-header img { width: 100%; height: auto; }

    /* Body */
    .email-body { padding: 32px 40px; color: #333333; line-height: 1.6; font-size: 15px; }
    .email-body h1 { font-size: 22px; color: #0064B1; margin-bottom: 16px; font-weight: 700; }
    .email-body p { margin-bottom: 14px; }
    .email-body .cta-button {
      display: inline-block;
      background-color: #0064B1;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 15px;
      margin: 16px 0;
    }
    .email-body .cta-button:hover { background-color: #004f8c; }
    .email-body .highlight { color: #F58025; font-weight: 600; }
    .email-body .divider { border: none; border-top: 1px solid #e0e0e0; margin: 24px 0; }

    /* Footer */
    .email-footer img { width: 100%; height: auto; }
    .email-sub-footer { background-color: #0064B1; color: #ffffff; text-align: center; padding: 12px 20px; font-size: 11px; line-height: 1.5; }
    .email-sub-footer a { color: #F58025; text-decoration: none; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <table class="email-container" role="presentation" cellpadding="0" cellspacing="0" width="600" align="center">
      <!-- Header -->
      <tr>
        <td class="email-header">
          <img src="${headerDataUri}" alt="UTA Housing and Residence Life" width="600" />
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td class="email-body">
          ${body}
        </td>
      </tr>
      <!-- Footer -->
      <tr>
        <td class="email-footer">
          <img src="${footerDataUri}" alt="UTA Housing Contact Information" width="600" />
        </td>
      </tr>
      <!-- Sub-footer -->
      <tr>
        <td class="email-sub-footer">
          This is an automated message from <a href="https://uta.edu/housing">Mav Housing</a>. Please do not reply directly to this email.
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}
