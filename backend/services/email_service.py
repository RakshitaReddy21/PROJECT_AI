import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from backend.config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def send_email(self, recipient_email: str, subject: str, body_text: str, body_html: str = None) -> bool:
        """
        Sends an email using SMTP.
        Returns True if sent successfully, False otherwise.
        """
        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.warning(f"[EmailService] SMTP credentials not configured. Email to {recipient_email} omitted.")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            msg["To"] = recipient_email

            msg.attach(MIMEText(body_text, "plain"))
            if body_html:
                msg.attach(MIMEText(body_html, "html"))

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.SMTP_FROM_EMAIL, [recipient_email], msg.as_string())

            logger.info(f"[EmailService] Email successfully sent to {recipient_email}")
            return True
        except Exception as e:
            logger.error(f"[EmailService] Failed to send email to {recipient_email}: {e}")
            return False

email_service = EmailService()

