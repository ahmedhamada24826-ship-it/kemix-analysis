# KEMIX Analysis

KEMIX Analysis is a bilingual client and team operations platform for a data analytics services company. It covers service intake, proposals, client communication, project delivery, team assignments, department workflows, file handover, and support.

## Main workspaces

- **Public website:** services, service intake, delivery approach, confidentiality information, and contact details.
- **Client portal:** requests, proposals, project progress, approved deliverables, conversations, and support tickets.
- **Operations and customer service:** client requests, proposals, project follow-up, client records, and support.
- **Department and employee workspace:** department-scoped projects, assigned tasks, workflow stages, team directory, and project files.
- **Project coordination:** internal project notes are kept separate from client-visible messages.
- **Management coordination:** a private company-wide chat is available to department leads and operations administrators, with access checks on the server and message notifications.
- **Contact and account recovery:** public contact inquiries are stored for support and operations follow-up; password reset links are single-use, expire after 30 minutes, and invalidate previous sessions.

## Roles

- `SUPER_ADMIN`: full platform administration.
- `OPERATIONS_MANAGER`: company-wide operational oversight and staff management.
- `PROJECT_LEAD`: project or department leadership, subject to project membership and department scope.
- `ANALYST`: assigned work and authorized project information.
- `TRAINEE`: assigned tasks, limited project context, and allowed files.
- `SUPPORT_AGENT`: client-relevant requests, proposals, projects, files, and support conversations; internal project notes and internal financial fields are restricted.
- `CLIENT`: their own requests, projects, proposals, approved deliverables, and support tickets.
- Department-manager chat is restricted to active department leads, operations managers, and super administrators.

The server checks access for project, task, file, request, support, and conversation APIs. Hiding a page or navigation item is not used as the security boundary.

## Technology

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- Prisma 6 with SQLite for local development
- JWT sessions in HTTP-only cookies and bcrypt password hashing
- Private project file storage under `private/uploads`

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set a unique `JWT_SECRET` with at least 32 characters. Keep secrets out of source control.
   Configure `RESEND_API_KEY`, a verified `EMAIL_FROM`, and `NEXT_PUBLIC_APP_URL` to enable password recovery emails.
3. Generate the Prisma client and prepare the local database with `npx prisma db push`.
4. Optionally load sample data with `npm run seed`. The command prints a random one-time password for local demo accounts. Demo seeding is blocked in production.
5. Start the app with `npm run dev` and open `http://localhost:3000`.

For production, configure a persistent database, a strong secret, HTTPS, private persistent file storage, and backups. The local SQLite database and local upload folder are for development and single-instance use.

## Useful commands

- `npm run dev` — local development server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint checks
- `npm run test` — business flow integration tests
- `npm run seed` — load sample data
- `npx prisma generate` — regenerate the Prisma client after schema changes

The language control supports English and Arabic direction (`LTR`/`RTL`). Core client, employee, admin, and authentication screens support both languages; some public and secondary screens still need translation review. User-entered business content remains as originally entered.
