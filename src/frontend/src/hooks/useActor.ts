import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretFromHash, getSessionParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";

/**
 * Get the Caffeine admin token.
 * Priority: URL hash → sessionStorage (already stored by urlParams utility)
 * After login, getSecretFromHash stores it in sessionStorage automatically.
 * For admin password login (no URL token), we still call _initializeAccessControlWithSecret
 * with whatever token is available (may be empty string, which is OK for blob read ops).
 */
function getAdminToken(): string {
  // getSecretFromHash checks sessionStorage first, then URL hash, and stores it
  const fromHash = getSecretFromHash("caffeineAdminToken");
  if (fromHash) return fromHash;
  // Also check sessionStorage directly (set by AdminLoginPage as fallback)
  const fromSession = getSessionParameter("caffeineAdminToken");
  return fromSession || "";
}

export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        // Return anonymous actor if not authenticated
        const actor = await createActorWithConfig();
        const adminToken = getAdminToken();
        if (adminToken) {
          await actor._initializeAccessControlWithSecret(adminToken);
        }
        return actor;
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);
      const adminToken = getAdminToken();
      await actor._initializeAccessControlWithSecret(adminToken);
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // This will cause the actor to be recreated when the identity changes
    enabled: true,
  });

  // When the actor changes, invalidate dependent queries
  useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        },
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
