# TaskMaster

TaskMaster is a Next.js task manager with Prisma-backed tasks, subtasks, PDF upload support, and in-app PDF previews.

## Requirements

- Node.js 20+
- npm
- A persistent database configured with `DATABASE_URL`

The default local setup uses SQLite. For production, make sure the SQLite file is stored on persistent disk, or move Prisma to a managed database provider. Local files on serverless platforms such as Vercel are ephemeral.

## Environment

Create a local environment file from the example:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: Prisma database connection string. The local default is `file:./dev.db`.

Optional variables:

- `NEXT_TELEMETRY_DISABLED`: Set to `1` to disable Next.js telemetry in CI or containers.

## Local Setup

Install dependencies:

```bash
npm install
```

Run database migrations:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Production Build

Build the app:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

The production health endpoint is available at:

```text
/api/health
```

It returns HTTP 200 when the app can reach the database and HTTP 503 when a required check fails.

## Vercel Deployment

This app includes `next.config.js` with `output: "standalone"`. Vercel can build the project directly from the repository.

Set the required environment variable in Vercel:

- `DATABASE_URL`

Important production notes:

- SQLite database files are not persistent on Vercel serverless functions. Use a persistent database for production data.
- PDF uploads are written to the local `uploads/` folder. That folder is ignored by Git and is not durable on serverless hosts. Use persistent volume storage for containers or replace local uploads with object storage for Vercel.
- Run Prisma migrations before serving production traffic. On Vercel, this is usually handled in a separate deployment or release step, not inside request handlers.

## Docker Deployment

Build the image:

```bash
docker build -t taskmaster .
```

Create local persistent directories for the SQLite database and uploads:

```bash
mkdir -p .data uploads
```

Run the container:

```bash
docker run --rm -p 3000:3000 --user "$(id -u):$(id -g)" \
  -e DATABASE_URL="file:/app/data/prod.db" \
  -v "$PWD/.data:/app/data" \
  -v "$PWD/uploads:/app/uploads" \
  taskmaster
```

Before first production traffic, build and run the migration target against the same database location:

```bash
docker build --target migrator -t taskmaster-migrator .

docker run --rm --user "$(id -u):$(id -g)" \
  -e DATABASE_URL="file:/app/data/prod.db" \
  -v "$PWD/.data:/app/data" \
  taskmaster-migrator
```

## File Uploads

Uploaded PDFs are stored under `uploads/` in local and container deployments. The folder contents are intentionally ignored by Git; `uploads/.gitkeep` keeps the directory available in fresh checkouts.
