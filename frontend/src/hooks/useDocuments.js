import { useCallback, useEffect, useState } from "react";
import { getDocuments } from "../services/documentService";

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { documents, loading, reload };
}
