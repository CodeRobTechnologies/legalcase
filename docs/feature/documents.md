# Documents

## Overview

Documents are files attached to cases. Uploads are stored on disk under `backend/uploads/` and served at `/uploads/<filename>`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/documents/{case_id}` | Upload a file to a case |
| `GET` | `/documents/{case_id}` | List documents for a case |
| `GET` | `/documents/download/{document_id}` | Download a file |
| `DELETE` | `/documents/{document_id}` | Delete a document |

## Storage

- Upload directory: `backend/uploads/` (created automatically on startup)
- Static mount: `/uploads` in `main.py`
- Uses `python-multipart` for file upload handling

## Frontend

The `/documents` page provides upload and browse UI per case.

## Production note

Ephemeral filesystems on PaaS hosts may lose uploads on redeploy. Consider persistent volumes or cloud object storage for production.
