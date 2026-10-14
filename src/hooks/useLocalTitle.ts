import { useEffect } from 'react';

/** Sets the document title for a page, keeping the ATMOS prefix. */
export function useLocalTitle(page: string) {
  useEffect(() => {
    document.title = `${page} · ATMOS`;
  }, [page]);
}
