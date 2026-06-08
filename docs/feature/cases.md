# Cases

## Overview

Cases are the central entity in LegalCase. Each case has a title, description, status, optional case number, and links to a client and assigned lawyer.

## Case fields

| Field | Type | Description |
|-------|------|-------------|
| `case_title` | string | Display name |
| `case_number` | string | Court/reference number (optional) |
| `case_description` | text | Full case details |
| `case_status` | string | Default: `Pending` |
| `client_id` | FK | Linked client record |
| `lawyer_id` | integer | Assigned lawyer user ID |
| `created_at` | datetime | Auto-set on creation |

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cases/` | Create a case |
| `GET` | `/cases/` | List all cases |
| `GET` | `/cases/{case_id}` | Get case by ID |
| `PUT` | `/cases/{case_id}` | Update a case |
| `DELETE` | `/cases/{case_id}` | Delete a case |
| `GET` | `/cases/search/` | Text search |
| `GET` | `/cases/advanced-search/` | Filtered search |

## Related data

Deleting a case cascades to:

- Hearings
- Timeline events
- Documents

## Frontend

The `/cases` page provides the case list and management UI. Client name and mobile are exposed via computed properties on the `Case` model.
