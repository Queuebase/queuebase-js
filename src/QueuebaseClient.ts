import { BASE_URL, DEFAULT_HEADERS } from "./lib/constants";

export default class QueuebaseClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.baseUrl = BASE_URL;
    this.apiKey = apiKey;

    this.headers = {
      ...DEFAULT_HEADERS,
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async publish(event: string, data: Record<string, any>): Promise<any> {
    const res = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        event,
        payload: {
          ...data,
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `Failed to publish message: ${res.status} ${
          res.statusText
        } - ${JSON.stringify(errorData)}`
      );
    }

    return res.json();
  }
}
