import { describe, expect, test } from "vitest";
import { ping } from "./ping";

describe("ping", () => {
  test.each([
    { site: "google.com", expected: true },
    { site: "https://encore.dev", expected: true },
    { site: "https://some-randomg-tes-url.dev", expected: false },
    { site: "invalid://scheme", expected: false },
  ])(
    `should verify sites`,
    async ({ site, expected }) => {
      const resp = await ping({ url: site });

      expect(resp.up).toBe(expected);
    }
  );
});
