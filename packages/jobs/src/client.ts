import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "tenderwatch",
  eventKey: process.env.INNGEST_EVENT_KEY
});
