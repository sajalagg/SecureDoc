import { useEffect, useState } from "react";
import { getDocuments } from "../services/documentService";

export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDocuments().then((docs) => {
      if (active) {
        setDocuments(docs);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return { documents, loading };
}
