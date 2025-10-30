import { useEffect, useMemo, useState } from "react";

import { fetchPrompts } from "../api/prompts";
import { fetchTemplates } from "../api/templates";

interface SearchResult {
  to: string;
  label: string;
  meta: string;
}

export const useGlobalSearch = (query: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        setIsLoading(true);
        const [prompts, templates] = await Promise.all([
          fetchPrompts({ search: debouncedQuery }),
          fetchTemplates({ search: debouncedQuery })
        ]);
        if (cancelled) return;
        const next: SearchResult[] = [
          ...prompts.map((prompt) => ({
            to: `/prompts/${prompt.id}`,
            label: prompt.name,
            meta: "Prompt"
          })),
          ...templates.map((template) => ({
            to: `/templates/${template.id}`,
            label: template.name,
            meta: "Template"
          }))
        ];
        setResults(next);
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const reset = () => setResults([]);
  return { results, isLoading, reset };
};

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return useMemo(() => debounced, [debounced]);
};
