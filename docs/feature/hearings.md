# Hearings

## Overview

Hearings represent scheduled court appearances linked to a case. The system supports listing, calendar views, and upcoming hearing filters.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/hearings/` | Create a hearing |
| `GET` | `/hearings/` | List hearings |
| `GET` | `/hearings/upcoming` | Upcoming hearings |
| `GET` | `/hearings/calendar` | Calendar-formatted data |
| `PUT` | `/hearings/{hearing_id}` | Update a hearing |
| `DELETE` | `/hearings/{hearing_id}` | Delete a hearing |

## Reminders

The reminder service (`reminder_service.py`) scans hearings scheduled for tomorrow and creates in-app notifications. WhatsApp reminders can be triggered via:

```
POST /notifications/send-hearing-reminders
```

Requires Twilio configuration — see [notifications.md](notifications.md).

## Frontend pages

| Route | Purpose |
|-------|---------|
| `/hearings` | Hearing list and management |
| `/preparation` | Preparation checklist for upcoming hearings |
