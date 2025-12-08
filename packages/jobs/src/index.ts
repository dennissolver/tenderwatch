export { inngest } from "./client";
export { syncAccount } from "./sync-account";
export { processTender } from "./process-tender";
export { sendDigest } from "./send-digest";

// Export all functions for Inngest serve
import { syncAccount } from "./sync-account";
import { processTender } from "./process-tender";
import { sendDigest } from "./send-digest";

export const functions = [syncAccount, processTender, sendDigest];
