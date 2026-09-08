import { useEffect, useState } from "react";
import { getDocument } from "../services/documentService";

export function useDocument(documentId) {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    getDocument(documentId).then((doc) => {
      if (!active) return;
      setDocument(doc ?? null);
      setNotFound(doc === null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [documentId]);

  return { document, loading, notFound };
}