import { api } from "encore.dev/api";
import { site } from "~encore/clients";
import { ping } from "./ping";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { Site } from "../site/site";
import { CronJob } from "encore.dev/cron";
import { Topic } from "encore.dev/pubsub";

export interface TransitionEvent {
  site: Site;
  up: boolean;
}

export const TransitionTopic = new Topic<TransitionEvent>("uptime-transition", {
  deliveryGuarantee: "at-least-once",
});

async function getPreviousMeasurement(siteID: number): Promise<boolean> {
  const row = await MonitorDB.queryRow`
    SELECT up
    FROM checks
    WHERE site_id = ${siteID}
    ORDERY BY checked_at DESC
    LIMIT 1
  `;

  return row?.up ?? true;
}

/**
 * Check checks a single site.
 */
export const check = api<{ siteID: number }, { up: boolean }>(
  {
    expose: true,
    method: "POST",
    path: "/check/:siteID",
  },
  async ({ siteID }) => {
    const s = await site.get({ id: siteID });
    return doCheck(s);
  }
);

/**
 * Endpoint to check all websites
 */
export const checkAll = api(
  {
    method: "POST",
    path: "/check-all",
    expose: true,
  },
  async () => {
    const sites = await site.list({});
    await Promise.all(sites.sites.map(doCheck));
  }
);

/**
 * This cron will be executed every hour to check the websites
 */
const cronJob = new CronJob("check-all", {
  title: "Check all sites",
  every: "1h",
  endpoint: checkAll,
});

/**
 * A facade for checking websites
 * @param s
 * @returns state of website
 */
export const doCheck = async (s: Site): Promise<{ up: boolean }> => {
  const { up } = await ping({ url: s.url });

  const wasUp = await getPreviousMeasurement(s.id);

  if (up !== wasUp) {
    await TransitionTopic.publish({ site: s, up });
  }

  await MonitorDB.exec`
    INSERT INTO checks (site_id, up, checked_at)
    VALUES (${s.id}, ${up}, NOW())
  `;

  return { up };
};

export const MonitorDB = new SQLDatabase("monitor", {
  migrations: "./migrations",
});
