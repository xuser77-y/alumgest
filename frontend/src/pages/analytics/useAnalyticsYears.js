import { useState, useEffect } from 'react';
import api from '../../services/api';

/**
 * Fetches available years from /api/analytics/years
 * Returns { years: string[], loading: boolean }
 */
export default function useAnalyticsYears() {
  const [years,   setYears]   = useState([String(new Date().getFullYear())]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/years')
      .then(r => {
        if (r.data?.years?.length) setYears(r.data.years);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { years, loading };
}