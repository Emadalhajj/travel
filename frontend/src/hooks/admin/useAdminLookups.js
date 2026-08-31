import { useCallback, useState } from "react";
import {
  apiGetAdminLookup,
  apiGetHotelLookupById,
} from "../../services/api/admin/lookups";

const TTL_MS = 5 * 60 * 1000;
const cache = new Map();
const pending = new Map();

export const resetAdminLookupCacheForTests = () => {
  cache.clear();
  pending.clear();
};

const fresh = (entry) => entry && Date.now() - entry.loadedAt < TTL_MS;

async function loadCached(key, request) {
  const cached = cache.get(key);
  if (fresh(cached)) return cached.data;
  if (pending.has(key)) return pending.get(key);

  const promise = request().then((data) => {
    cache.set(key, { data, loadedAt: Date.now() });
    pending.delete(key);
    return data;
  }).catch((error) => {
    pending.delete(key);
    throw error;
  });
  pending.set(key, promise);
  return promise;
}

export default function useAdminLookups() {
  const [lookups, setLookups] = useState({});

  const loadLookup = useCallback(async (type) => {
    const data = await loadCached(type, () => apiGetAdminLookup(type));
    setLookups((current) => current[type] === data ? current : { ...current, [type]: data });
    return data;
  }, []);

  const loadHotel = useCallback(async (hotelId) => {
    const key = `hotel:${hotelId}`;
    const hotel = await loadCached(key, () => apiGetHotelLookupById(hotelId));
    setLookups((current) => ({ ...current, [key]: hotel ? [hotel] : [] }));
    return hotel;
  }, []);

  return { lookups, loadLookup, loadHotel };
}
