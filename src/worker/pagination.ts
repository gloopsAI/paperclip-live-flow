/**
 * Exhaustively paginate a public SDK list API using offset/limit until a short page.
 */
export async function paginateToExhaustion<T>(
  fetchPage: (offset: number, limit: number) => Promise<T[]>,
  pageSize = 100
): Promise<T[]> {
  const all: T[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(offset, pageSize);
    all.push(...page);
    if (page.length < pageSize) {
      break;
    }
    offset += page.length;
  }

  return all;
}
