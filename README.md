# BloodAid (Spring Boot + PostgreSQL)

Blood bank platform: find banks and live stock on a map, request blood, register as a donor, recipient or
blood bank staff member, manage inventory, and use two optional Gemini-powered tools (medical assistant and
blood demand forecast).

This is a port of the Next.js app `vanshtomar09/blood-aid` to:

| Layer      | Technology                                                                  |
|------------|-----------------------------------------------------------------------------|
| Backend    | Java 17+, Spring Boot 3.5, Spring Web, Spring Data JPA (Hibernate)          |
| Database   | PostgreSQL, schema and demo data managed by Flyway                          |
| Security   | Spring Security, stateless JWT (HS256), BCrypt passwords, role-based access |
| Frontend   | Plain HTML, CSS and JS served by Spring Boot (no Node, no build step)       |
| Map        | Leaflet 1.9.4 + OpenStreetMap tiles (loaded from a CDN)                     |
| AI         | Gemini REST API, optional. The app runs fully without a key.                |

> **Status.** Builds and runs locally against PostgreSQL 16: Flyway migrations apply, Hibernate's schema check passes and the demo
> accounts work. Run `mvn verify` to run the unit tests.

---

## 1. Prerequisites

- JDK **17 or newer** (`java -version`)
- Maven **3.9+** (`mvn -v`)
- PostgreSQL **14+** (or Docker, see below)
- Internet access in the browser for the map (Leaflet and map tiles load from CDNs)

## 2. Start PostgreSQL

**Option A: Docker (simplest)**

```bash
docker run --name bloodaid-db \
  -e POSTGRES_DB=bloodaid -e POSTGRES_USER=bloodaid -e POSTGRES_PASSWORD=bloodaid \
  -p 5432:5432 -d postgres:16
```

Next time: `docker start bloodaid-db`. To wipe everything: `docker rm -f bloodaid-db`.

**Option B: PostgreSQL installed locally**

```bash
psql -U postgres -c "CREATE USER bloodaid WITH PASSWORD 'bloodaid';"
psql -U postgres -c "CREATE DATABASE bloodaid OWNER bloodaid;"
```

Flyway creates all tables and loads the demo data the first time the app starts. You do not run any SQL by hand.

## 3. Set environment variables

The defaults match the database above, so for a first run **you do not need to set anything**. Everything is
configurable:

| Variable                   | Default                                     | Purpose                                                                  |
|----------------------------|---------------------------------------------|--------------------------------------------------------------------------|
| `DB_URL`                   | `jdbc:postgresql://localhost:5432/bloodaid` | JDBC URL                                                                 |
| `DB_USERNAME`              | `bloodaid`                                  | Database user                                                            |
| `DB_PASSWORD`              | `bloodaid`                                  | Database password                                                        |
| `JWT_SECRET`               | built-in dev value (logs a warning)         | Signing key, **at least 32 characters**. Set your own for anything real. |
| `JWT_EXPIRATION_MINUTES`   | `1440`                                      | Token lifetime                                                           |
| `GEMINI_API_KEY`           | empty                                       | Enables the Gemini chatbot and forecast. Empty means built-in fallbacks. |
| `GEMINI_MODEL`             | `gemini-2.5-flash`                          | Gemini model name                                                        |
| `APP_SEED_ENABLED`         | `true`                                      | Create the four demo accounts on startup. **Set `false` outside demos.** |
| `MAIL_HOST`                | empty                                       | SMTP server. Set it to email verification codes (e.g. `smtp.gmail.com`)   |
| `MAIL_PORT`                | `587`                                       | SMTP port (587 STARTTLS, 465 SSL)                                        |
| `MAIL_USERNAME`            | empty                                       | SMTP login (for Gmail, your address)                                     |
| `MAIL_PASSWORD`            | empty                                       | SMTP password (for Gmail, an **app password**)                           |
| `MAIL_FROM`                | the username                                | Sender address                                                           |
| `APP_DEMO_OTP`             | `true`                                      | Only used when `MAIL_HOST` is empty: show the code on screen instead of emailing it |
| `PORT`                     | `8080`                                      | HTTP port                                                                |

macOS / Linux:

```bash
export JWT_SECRET="$(openssl rand -base64 48)"
export GEMINI_API_KEY="your-key-here"        # optional
```

Windows PowerShell:

```powershell
$env:JWT_SECRET = [Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
$env:GEMINI_API_KEY = "your-key-here"        # optional
```

## 4. Build, test and run

```bash
mvn verify              # compiles and runs the unit tests (no database needed)
mvn spring-boot:run     # starts the app on http://localhost:8080
```

Open **http://localhost:8080**.

To run a packaged jar instead: `mvn package` then `java -jar target/bloodaid-1.0.0.jar`.

### Email verification (OTP)

Every sign-up (donor, recipient, staff) is a two-step flow: details, then a 6-digit code sent by email. The account is
only created once the code is entered correctly. Codes expire after 10 minutes, allow 5 wrong tries, and can be re-sent
every 30 seconds. Codes and passwords are stored hashed (BCrypt), and unverified sign-ups live in the
`pending_registrations` table, not in `users`.

- **Real email:** set `MAIL_HOST`, `MAIL_USERNAME` and `MAIL_PASSWORD`. With Gmail: turn on 2-Step Verification, create an
  app password at https://myaccount.google.com/apppasswords, then
  ```bash
  export MAIL_HOST=smtp.gmail.com
  export MAIL_USERNAME="you@gmail.com"
  export MAIL_PASSWORD="your-16-char-app-password"   # spaces are ignored
  ```
  The code is then only emailed, never shown in the UI.
- **No email set up (default):** with `APP_DEMO_OTP=true` the code is shown on the sign-up page and written to the server
  log, so you can still try the flow. With `APP_DEMO_OTP=false` and no `MAIL_HOST`, sign-up is refused.

## 5. Demo accounts

Created on startup while `APP_SEED_ENABLED=true`. Password for all of them: `Demo@12345`

| Email                    | Role      | Notes                                      |
|--------------------------|-----------|--------------------------------------------|
| `admin@bloodaid.test`     | ADMIN     | Admin dashboard, all staff features        |
| `staff@bloodaid.test`     | STAFF     | Linked to "Apollo Hospital Blood Bank"     |
| `donor@bloodaid.test`     | DONOR     | Blood type O+                              |
| `recipient@bloodaid.test` | RECIPIENT |                                            |

The login screen has one-tap buttons for these while demo accounts are enabled.

Demo accounts are created directly and skip email verification.

## 6. Screens and features

| Screen                | Route                                      | Who                |
|-----------------------|--------------------------------------------|--------------------|
| Home dashboard        | `#/`                                       | everyone           |
| Find blood (search)   | `#/search`                                 | everyone           |
| Map                   | `#/map`                                    | everyone           |
| Blood bank details    | `#/bank/:id`                               | everyone           |
| Help                  | `#/help`                                   | everyone           |
| Sign in / register    | `#/login`, `#/register/...`                | everyone           |
| Request blood         | `#/request`, `#/my-requests`               | signed in          |
| Staff dashboard       | `#/staff`                                  | staff, admin       |
| Inventory             | `#/inventory`                              | staff (own bank), admin |
| Demand forecast       | `#/predict`                                | staff, admin       |
| Admin dashboard       | `#/admin`                                  | admin              |
| Medical assistant     | floating chat button                       | everyone           |

The UI is responsive (drawer navigation on phones), follows the system dark/light setting, and has a manual theme
toggle that is remembered.

## 7. REST API

All JSON. Send `Authorization: Bearer <token>` where a role is listed. Errors look like
`{"error": "message", "fieldErrors": {"field": "message"}}`.

| Method & path                             | Access        | Purpose                                              |
|-------------------------------------------|---------------|------------------------------------------------------|
| `POST /api/auth/register`                 | public        | Donor or recipient sign-up step 1: emails a code     |
| `POST /api/auth/login`                    | public        | Returns `{token, user}`                              |
| `POST /api/auth/staff/code`               | public        | Staff sign-up step 1: emails a code                  |
| `POST /api/auth/resend`                   | public        | Send a new code (30 s cooldown)                      |
| `POST /api/auth/verify`                   | public        | Step 2 for every role: check code, create account, returns `{token, user}` |
| `GET  /api/me`                            | signed in     | Current user                                         |
| `GET  /api/banks?lat&lng&bloodType&q`     | public        | Banks with stock, nearest first when `lat`/`lng` given |
| `GET  /api/banks/{id}`                    | public        | One bank                                             |
| `PUT  /api/banks/{id}/inventory`          | staff, admin  | Set units per blood type (staff: own bank only)      |
| `GET  /api/public/{config,stats,camps}`   | public        | App config, totals, upcoming donation camps          |
| `GET  /api/public/requests`               | public        | Requests **without** patient name or phone           |
| `GET  /api/public/search?q=`              | public        | Banks and requests matching a name, city or blood type |
| `POST /api/requests`                      | signed in     | Create a blood request                               |
| `GET  /api/requests/mine`                 | signed in     | Your requests                                        |
| `GET  /api/staff/requests`                | staff, admin  | All requests with full details                       |
| `PATCH /api/staff/requests/{id}/status`   | staff, admin  | `PENDING`, `IN_PROGRESS`, `FULFILLED`                |
| `GET  /api/staff/stats`                   | staff, admin  | Bank totals, low stock, open requests                |
| `GET  /api/admin/stats`, `/api/admin/users` | admin       | Overview and newest users                            |
| `POST /api/chat`                          | public        | Medical assistant                                    |
| `POST /api/predict`                       | staff, admin  | Blood demand forecast                                |

## 8. Gemini features without a key

With `GEMINI_API_KEY` unset (or if a Gemini call fails) the app keeps working:

- **Medical assistant**: answers common questions (eligibility, compatibility, minor first aid, emergencies) from
  built-in rules and always includes the medical disclaimer. The panel header says "Basic mode".
- **Demand forecast**: computes the average and a one-standard-deviation range per blood type from the CSV you paste,
  and labels the result "Basic estimate", not AI.

With a key, both call Gemini (`generateContent`). The key is sent in the `x-goog-api-key` header and never logged.
The forecast CSV format is a header of blood types and one row per period:

```
Date,A+,A-,B+,B-,AB+,AB-,O+,O-
2026-05-01,42,10,35,8,14,4,60,18
```

## 9. Project layout

```
src/main/java/com/bloodaid/
  config/      SecurityConfig, DemoAccountSeeder
  security/    JwtService, JwtAuthFilter
  domain/      JPA entities and enums
  repository/  Spring Data repositories
  service/     business logic (+ service/ai: Gemini client and fallbacks)
  web/         REST controllers, error handling
  dto/         request/response records
src/main/resources/
  db/migration/V1__schema.sql        tables and constraints
  db/migration/V2__seed_demo_data.sql  12 blood banks, stock, 4 requests, 2 camps
  db/migration/V3__pending_registrations.sql  sign-ups waiting for their email code
  static/                            index.html, css/app.css, js/*.js
src/test/java/                       unit tests
```

## 10. Tests

`mvn verify` runs plain JUnit/Mockito unit tests (no database, no network, no Docker): JWT creation, parsing, expiry and
tampering; the JWT request filter; bank search, sorting and availability rules; the email verification flow (codes, expiry, attempts, resend, account creation); haversine
distance; chatbot and forecast fallbacks; Gemini conversation building.

These do **not** start the Spring context or touch PostgreSQL. There are no integration tests yet, so the end-to-end check
is to start the app (sections 2 to 4) and click through it.

## 11. Security notes

- Passwords are BCrypt-hashed. Roles are enforced on the server (`SecurityConfig`); hiding a menu item in the UI is only cosmetic.
- Public endpoints never return patient names or phone numbers; only staff and admins see them.
- The JWT is kept in the browser's `localStorage`, so any XSS bug would expose it. All dynamic text in the UI is escaped,
  but if you deploy this for real, consider an HttpOnly-cookie session and a Content-Security-Policy.
- There is no rate limiting or account lockout on login.
- Change `JWT_SECRET`, set `APP_SEED_ENABLED=false` and `APP_DEMO_OTP=false` before exposing this to anyone, and configure `MAIL_*` so
  verification codes are actually emailed (with `APP_DEMO_OTP=false` and no mail server, sign-up is refused).
- Keep `MAIL_PASSWORD` and `GEMINI_API_KEY` in environment variables or your host's secret settings, never in the code.

## 12. Differences from the original Next.js app

- The UI is a redesign (not a pixel copy): new layout, dark mode, mobile drawer, a crimson home hero with floating blood cells, and small click effects (turned off when the OS "reduce motion" setting is on). The map still uses Leaflet; pins are now colour-coded by stock level (green, amber, red).
- Data is real: seeded from the original mock data, stored in PostgreSQL, and editable. Admin and home totals are
  **computed** from the database; the original showed hard-coded numbers (for example 1,245 units).
- Seed details the original never had are placeholders: request patient names, phone numbers, units and urgency, and bank
  phone/email (the original also showed "(Example)" values). Camp dates are relative to when the migration first runs,
  because the original's fixed 2024 dates are in the past.
- The Help page keeps the original five FAQs and the contact details (104 health helpline, support@bloodaid.io) word for word, and adds three entries about this version's features.
- The original chatbot had a placeholder "find hospitals" tool; here the assistant points users to the Map page instead.
- The original only showed a "Verification successful" alert for staff and checked nothing. Here every sign-up (donor, recipient and staff) is verified by an emailed 6-digit code that expires after 10 minutes, with attempt and resend limits.
