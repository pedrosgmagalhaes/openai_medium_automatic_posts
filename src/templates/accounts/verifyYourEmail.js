
function verifyYourEmail(verificationUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Verify Your Email</title>
        </head>
        <body>
          <p>Please click the following link to verify your email:</p>
          <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        </body>
      </html>
    `;
}

module.exports = verifyYourEmail;
