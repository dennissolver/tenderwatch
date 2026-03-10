import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as users from "./schema/users";
import * as watches from "./schema/watches";
import * as linkedAccounts from "./schema/linked-accounts";
import * as tenders from "./schema/tenders";
import * as matches from "./schema/matches";
import * as usage from "./schema/usage";
import * as audit from "./schema/audit";

const schema = { ...users, ...watches, ...linkedAccounts, ...tenders, ...matches, ...usage, ...audit };

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
