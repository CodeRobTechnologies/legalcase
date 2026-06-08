# Timeline

## Overview

Timeline events provide a chronological audit trail of activity on each case (filings, updates, notes, etc.).

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/timeline/` | Create a timeline event |
| `GET` | `/timeline/{case_id}` | Events for a specific case |
| `GET` | `/timeline/recent/all` | Recent events across all cases |
| `GET` | `/timeline/event/{timeline_id}` | Single event by ID |
| `DELETE` | `/timeline/{timeline_id}` | Delete an event |

## Frontend

The `/timeline` page displays events with filtering by case. Timeline creation is handled through the timeline service layer for consistent event formatting.
