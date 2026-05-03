import { APPLICATION_NAME, DEFAULT_LANGUAGE, DOFUSDB_BASE_URL } from "../config.js";

export type DofusDbClientOptions = {
  baseUrl?: string;
  language?: string;
};

export class DofusDbClient {
  private readonly baseUrl: string;
  private readonly language: string;

  constructor(options: DofusDbClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DOFUSDB_BASE_URL;
    this.language = options.language ?? DEFAULT_LANGUAGE;
  }

  async get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(path, this.baseUrl);

    url.searchParams.set("lang", this.language);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      headers: {
        Referer: APPLICATION_NAME
      }
    });
    if (!response.ok) {
      throw new Error(`DofusDB request failed: ${response.status} ${response.statusText} (${url.href})`);
    }

    return response.json() as Promise<T>;
  }
}
