import { useState, useEffect } from "react";

interface PdfFullTextData {
  fullText: string;
  pageCount: number;
  fileName: string;
}

interface UsePdfFullTextResult {
  data: PdfFullTextData | null;
  loading: boolean;
  error: string | null;
}

export function usePdfFullText(fileId: string | null): UsePdfFullTextResult {
  const [data, setData] = useState<PdfFullTextData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const fetchFullText = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/pdf/full-text?fileId=${fileId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch PDF text: ${response.statusText}`);
        }

        const result = (await response.json()) as PdfFullTextData;
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchFullText();
  }, [fileId]);

  return { data, loading, error };
}
