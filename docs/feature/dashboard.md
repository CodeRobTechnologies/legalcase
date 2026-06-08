# Dashboard

## Overview

The dashboard provides a high-level summary of the firm's active workload.

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard/` | Dashboard aggregate data |

Additional stats are available via legacy page routes:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/dashboard-stats` | Extended statistics (api_page_routes) |

## Frontend

The `/dashboard` route is the default landing page after login. It displays key metrics drawn from cases, hearings, and notifications.

## Health

Page health can be checked at `GET /page-health` for monitoring HTML and API page routes.
