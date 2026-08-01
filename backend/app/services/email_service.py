import httpx

from app.config.settings import settings


class EmailService:
    async def send_otp(self, email: str, otp: str) -> None:
        provider = settings.email_provider.strip().lower()

        if provider == "console":
            print(f"OTP for {email}: {otp}")
            return

        if provider != "emailjs":
            raise ValueError(f"Unsupported email provider: {provider}")

        service_id = settings.email_service_id.strip()
        template_id = settings.email_template_id.strip()
        public_key = settings.email_public_key.strip()
        from_email = settings.email_from.strip()

        if not service_id or not template_id or not public_key:
            raise ValueError(
                "EmailJS is not configured. Set EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, and EMAIL_PUBLIC_KEY in your environment."
            )

        payload = {
            "service_id": service_id,
            "template_id": template_id,
            "user_id": public_key,
            "accessToken": public_key,
            "template_params": {
                "email": email,
                "otp": otp,
                "from_email": from_email,
                "subject": "BLACKBUSER OTP Verification",
            },
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post("https://api.emailjs.com/api/v1.0/email/send", json=payload)
            response.raise_for_status()
