document.addEventListener('DOMContentLoaded', () => {
  const requestOtpButton = document.getElementById('requestOtp');
  const openAccountButton = document.getElementById('openAccountBtn');
  const homeMessage = document.getElementById('homeMessage');
  const otpMessage = document.getElementById('otpMessage');

  const showMessage = (message, isError = false, target = homeMessage) => {
    if (!target) return;
    target.textContent = message;
    target.style.color = isError ? '#ff8d8d' : '#5eead4';
  };

  if (window.emailjs) {
    window.emailjs.init('GADRznVPhhlO1I3mS');
  }

  if (requestOtpButton) {
    requestOtpButton.addEventListener('click', async () => {
      const email = document.getElementById('homeEmail').value;
      const response = await fetch('/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.ok) {
        if (window.emailjs) {
          try {
            await window.emailjs.send(
              'service_w6ioj3p',
              'template_t7boqgo',
              {
                to_email: email,
                email,
                otp: data.otp,
                verification_code: data.otp,
                message: `Your Blackbuser verification code is ${data.otp}.`
              }
            );
            showMessage('OTP sent to your email. Please check your inbox and enter the code below.');
          } catch (error) {
            showMessage('The email service did not accept the request. Please try again later.', true);
            console.error(error);
          }
        } else {
          showMessage('OTP created locally. The browser email SDK is unavailable right now.', true);
        }
      } else {
        showMessage(data.message, true);
      }
    });
  }

  if (openAccountButton) {
    openAccountButton.addEventListener('click', async () => {
      const email = document.getElementById('homeEmail').value;
      const otp = document.getElementById('homeOtp').value;
      const response = await fetch('/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      const data = await response.json();

      if (!data.ok) {
        showMessage(data.message, true, otpMessage || homeMessage);
        return;
      }

      const accountResponse = await fetch('/open-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const html = await accountResponse.text();
      document.open();
      document.write(html);
      document.close();
    });
  }
});
