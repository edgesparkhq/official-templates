import type { BucketDef } from "@sdk/server-types";

export const taskcovers: BucketDef<"task-covers"> = {
  bucket_name: "task-covers",
  description: "Bounty task cover images uploaded by creators",
};
