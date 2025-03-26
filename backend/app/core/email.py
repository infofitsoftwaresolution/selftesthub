import smtplib
from email.mime.text import MIMEText
from app.core.config import settings

async def send_email(to_email: str, subject: str, body: str):
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = settings.SMTP_USER
    msg['To'] = to_email
    
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send email") 