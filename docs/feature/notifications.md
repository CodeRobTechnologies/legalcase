# Notifications

## Overview

LegalCase supports in-app notifications and optional WhatsApp reminders via Twilio.

## In-app notifications

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/notifications/` | List notifications |
| `GET` | `/notifications/{notification_id}` | Get one notification |
| `POST` | `/notifications/` | Create a notification |
| `PUT` | `/notifications/{notification_id}` | Mark read / update |
| `DELETE` | `/notifications/{notification_id}` | Delete |
| `POST` | `/notifications/send-hearing-reminders` | Trigger hearing reminders |

## Hearing reminders

`reminder_service.py` creates notifications for hearings scheduled the next day. The notification service coordinates delivery.

## WhatsApp (Twilio)

When Twilio env vars are configured, `whatsapp_service.py` sends messages via the Twilio WhatsApp API.

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | Sender number (auto-prefixed with `whatsapp:`) |

Indian mobile numbers without a country code are auto-prefixed with `+91`.

WhatsApp is **optional** — the app runs without it; reminders fall back to in-app notifications only.
