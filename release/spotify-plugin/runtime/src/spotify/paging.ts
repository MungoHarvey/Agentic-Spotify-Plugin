export type SpotifyPage<T> = {
  items: T[];
  next?: string | null;
};

export type PaginateAllOptions = {
  maxPages?: number;
};

type PageRequest<T> = (pathOrUrl: string) => Promise<SpotifyPage<T> | unknown> | SpotifyPage<T> | unknown;

function isPageShape<T>(value: unknown): value is SpotifyPage<T> {
  return typeof value === 'object' && value !== null && 'items' in value;
}

function readPageItems<T>(page: SpotifyPage<T>): T[] {
  if (!Array.isArray(page.items)) {
    throw new Error('Spotify page items must be an array.');
  }

  return page.items;
}

export async function paginateAll<T>(
  initialPathOrUrl: string,
  request: PageRequest<T>,
  options: PaginateAllOptions = {},
): Promise<T[]> {
  const items: T[] = [];
  const maxPages = options.maxPages;
  let pageCount = 0;
  let nextPathOrUrl: string | null | undefined = initialPathOrUrl;

  while (nextPathOrUrl !== null && nextPathOrUrl !== undefined) {
    if (maxPages !== undefined && pageCount >= maxPages) {
      throw new Error(`Spotify pagination exceeded maxPages of ${maxPages}.`);
    }

    const page = await request(nextPathOrUrl);

    if (!isPageShape<T>(page)) {
      throw new Error('Spotify page items must be an array.');
    }

    items.push(...readPageItems(page));
    pageCount += 1;
    nextPathOrUrl = page.next;
  }

  return items;
}
