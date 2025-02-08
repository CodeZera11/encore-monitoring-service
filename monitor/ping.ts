import { api } from "encore.dev/api";
import log from "encore.dev/log";
import { secureHeapUsed } from "node:crypto";

export interface PingParams {
  url: string;
}

export interface PingResponse {
  up: boolean;
}

export const ping = api<PingParams, PingResponse>(
  {
    expose: true,
    path: "/ping/:url",
    method: "GET",
  },
  async ({ url }) => {
    if (!url.startsWith("http:") && !url.startsWith("https:")) {
      url = "https://" + url;
    }

    try {
      log.info(`Pinging ${url}...`);
      const resp = await fetch(url, { method: "GET" });
      const up = resp.status >= 200 && resp.status < 300;
      return { up };
    } catch (error) {
      return { up: false };
    }
  }
);
