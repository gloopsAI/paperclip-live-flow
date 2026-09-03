import { useHostLocation } from "@paperclipai/plugin-sdk/ui";
import { useMemo } from "react";
import { PROJECT_FILTER_QUERY_KEY } from "../constants.js";

export function useProjectFilterFromLocation(): string | null {
  const location = useHostLocation();
  return useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get(PROJECT_FILTER_QUERY_KEY);
    return value && value.length > 0 ? value : null;
  }, [location.search]);
}
