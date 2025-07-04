import QueuebaseClient from "./QueuebaseClient";

export { default as QueuebaseClient } from "./QueuebaseClient";

/**
 * Create a new Queuebase client instance.
 * @param queuebaseApiKey - The API key for your queue
 * @returns
 */
export const createClient = (queuebaseApiKey: string): QueuebaseClient => {
  return new QueuebaseClient(queuebaseApiKey);
};
