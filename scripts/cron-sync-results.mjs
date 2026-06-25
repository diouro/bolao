const baseUrl = process.env.PLATFORM_BASE_URL || "http://localhost:3000";
const secret = process.env.CRON_SECRET?.trim();

if (!secret) {
  console.error("CRON_SECRET is not set. Add it to .env.local first.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/cron/sync-results`, {
  headers: {
    Authorization: `Bearer ${secret}`,
  },
});

const body = await response.text();

console.log(body);

if (!response.ok) {
  process.exit(1);
}
