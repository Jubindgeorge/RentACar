# RentACar

Express + Handlebars car-rental application using MongoDB Atlas / Mongoose.

## Run locally / in Codespaces

1. Install Node.js 20+.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and set real values privately.
4. In MongoDB Atlas, create a database user restricted to `readWrite` on the `RentACar` database. Allow the app's outbound IP in Network Access.
5. Set:
   - `MONGODB_URI`: the Atlas SRV URI for the app database, including the real username/password.
   - `ADMIN_API_KEY`: a long random secret (32+ characters).
   - `SESSION_SECRET`: a separate long random secret used to sign customer session cookies.
   - `PORT=3000`
6. Run `npm start`.
7. Visit `/health`? The API health endpoint is `/api/health`; browse the app at `/`, fleet at `/fleet`, admin UI at `/admin/dashboard`.

Never commit `.env`, service credentials, database passwords, or admin keys.

## API overview

Public:
- `GET /api/health`
- `GET /api/cars`
- `GET /api/cars/:id`
- `POST /api/bookings` (requires a signed-in customer session)

Admin routes require `x-admin-key: <ADMIN_API_KEY>`:
- `GET /api/admin/cars`
- `POST /api/admin/cars`
- `PATCH /api/admin/cars/:id`
- `DELETE /api/admin/cars/:id` (soft-disable; preserves history)
- `GET /api/admin/bookings`
- `PATCH /api/admin/bookings/:id/status`
- `GET /api/admin/location-sharing`

Booking response returns a one-time `locationAccessToken`. The customer must send it in `x-booking-token` to enable/disable sharing or post coordinates. Location is off by default. The current API token is a booking-specific bearer credential; it is not a substitute for a full customer account/session system.

## Deploy to Render

This repository includes a Render Blueprint at `render.yaml`. To deploy:

1. Sign in to Render and choose **New → Blueprint**.
2. Connect the `Jubindgeorge/RentACar` GitHub repository and select this repository's branch after the deployment PR is merged to `main`.
3. Review the service created from `render.yaml`. Render will generate `ADMIN_API_KEY` and `SESSION_SECRET`; keep both private.
4. Add `MONGODB_URI` in the Render service environment. Use the Atlas connection string for the intended database, and verify the database user has only the required database permissions.
5. In MongoDB Atlas Network Access, allow Render's outbound traffic using the method supported by your Atlas/Render plans. Avoid leaving `0.0.0.0/0` open as a permanent shortcut.
6. Deploy and wait for Render's health check at `/api/health` to pass. If it fails, inspect Render logs for the sanitized connection guidance; never paste secrets into issue comments or chat.

The free Render service may sleep when idle and is not a suitable guarantee for production uptime. Confirm the current plan's filesystem, outbound networking, and service limits before relying on it.

## Important deployment notes

- Keep the admin key only in server environment variables and the trusted admin browser tab. Rotate it immediately if exposed.
- Do not use a broad Atlas network rule permanently. If Codespaces outbound IP changes, update Atlas Network Access deliberately.
- This repository's older login/register UI still needs a complete secure account/session implementation before it should be used for real customer authentication. The booking API currently accepts customer details directly and does not prove account ownership.
- Customer registration and login hash passwords with bcrypt; legacy plaintext passwords are upgraded only after successful login. Rotate any credentials previously committed or exposed.
- The current session store is Express's in-memory development store. Configure a durable production session store before deploying to multiple instances or relying on sessions across restarts.
- Booking forms require a signed-in session. The booking API still needs production-grade rate limiting, email verification, and further abuse protection.
- Run the GitHub Actions syntax check and test health, booking conflicts, admin authorization, and consent revocation in a configured environment before production use.
