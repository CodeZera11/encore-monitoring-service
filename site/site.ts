import { api } from "encore.dev/api";
import log from "encore.dev/log";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import { IsURL } from "encore.dev/validate";
import knex from "knex";

export interface Site {
  id: number;
  url: string;
}

export interface AddSiteParams {
  url:  string & IsURL;
}

export interface ListResponse {
  sites: Site[];
}

export const add = api<AddSiteParams, Site>(
  {
    expose: true,
    method: "POST",
    path: "/site",
  },
  async (params) => {
    log.info(`Inserting site ${params.url} to db...`);
    const site = (await Sites().insert({ url: params.url }, "*"))[0];

    return site;
  }
);

export const get = api<{ id: number }, Promise<Site>>(
  {
    expose: true,
    method: "GET",
    path: "/site/:id",
  },
  async ({ id }) => {
    const site = await Sites().where("id", id).first();

    return site ?? Promise.reject(new Error("site not found"));
  }
);

/**
 * Delete a site by id.
 */
export const del = api<{ id: number }, void>(
  { expose: true, method: "DELETE", path: "/site/:id" },
  async ({ id }) => {
    await Sites().where("id", id).delete();
  }
);

/**
 * Lists the monitored websites.
 */
export const list = api<{}, ListResponse>(
  { expose: true, method: "GET", path: "/site" },
  async () => {
    const sites = await Sites().select();
    return { sites };
  }
);

/**
 * Define a database named 'site', using the database migrations in the "./migrations" folder. Encore automatically provisions, migrates,
 * and connects to the database.
 */
const SiteDB = new SQLDatabase("site", {
  migrations: "./migrations",
});

const orm = knex({
  client: "pg",
  connection: SiteDB.connectionString,
});

const Sites = () => orm<Site>("site");
