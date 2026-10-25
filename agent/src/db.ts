import { readFileSync } from "node:fs";
import pg from "pg";
import { config } from "./config";

// Tiger Cloud certs are signed by Timescale's own CA, which Node doesn't trust by default.
const ca = readFileSync(new URL("../db/tiger-ca.pem", import.meta.url), "utf8");

// pg lets ?sslmode= in the URL override the `ssl` option, so drop it and verify against the CA.
const url = new URL(config.DATABASE_URL);
url.searchParams.delete("sslmode");

/** Shared connection pool for the Tiger Cloud database. Schema lives in db/schema.sql. */
export const db = new pg.Pool({ connectionString: url.toString(), ssl: { ca } });
