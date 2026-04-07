import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AIImage, ExternalBlob, Tag, WatermarkConfig } from "../backend";
import { ExternalBlob as ExternalBlobClass } from "../backend";
import { useActor } from "./useActor";

export interface PaymentConfig {
  wechatBlob?: ExternalBlob;
  alipayBlob?: ExternalBlob;
  priceText: string;
}

export interface ContactConfig {
  qqBlob?: ExternalBlob;
  wechatBlob?: ExternalBlob;
  xiaohongshuBlob?: ExternalBlob;
}

// ─── Local Tag Storage (primary, never depends on canister) ───────────────────

const LOCAL_TAGS_KEY = "xiaomianbaotuku_tags_v2";

function loadLocalTags(): Tag[] {
  try {
    const raw = localStorage.getItem(LOCAL_TAGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Tag[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalTags(tags: Tag[]): void {
  try {
    localStorage.setItem(LOCAL_TAGS_KEY, JSON.stringify(tags));
  } catch {
    // storage quota exceeded – ignore
  }
}

// Try to sync tags from canister into localStorage on first load (fire-and-forget)
async function tryImportTagsFromCanister(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actor: any,
): Promise<void> {
  try {
    const canisterTags: Tag[] = await Promise.race([
      actor.getAllTags(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 5000),
      ),
    ]);
    if (!Array.isArray(canisterTags) || canisterTags.length === 0) return;
    const localTags = loadLocalTags();
    // Merge: add canister tags that don't exist locally
    const localIds = new Set(localTags.map((t) => t.id));
    const merged = [...localTags];
    for (const t of canisterTags) {
      if (!localIds.has(t.id)) {
        merged.push(t);
      }
    }
    if (merged.length > localTags.length) {
      saveLocalTags(merged);
    }
  } catch {
    // canister unavailable – silently ignore
  }
}

let importAttempted = false;

// ─── Image queries (still use canister / blob-storage) ───────────────────────

export function useLatestImages(limit = 50) {
  const { actor, isFetching } = useActor();
  return useQuery<AIImage[]>({
    queryKey: ["latestImages", limit],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLatestImages(BigInt(limit));
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Tag queries (localStorage as primary, canister optional) ─────────────────

export function useAllTags() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useQuery<Tag[]>({
    queryKey: ["allTags"],
    queryFn: async () => {
      // One-time import from canister into local storage (best-effort, non-blocking)
      if (!importAttempted && actor) {
        importAttempted = true;
        tryImportTagsFromCanister(actor).then(() => {
          queryClient.invalidateQueries({ queryKey: ["allTags"] });
        });
      }
      return loadLocalTags();
    },
    // Always enabled – local storage never fails
    enabled: true,
    staleTime: 0,
  });
}

export function useImagesByTag(tagId: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<AIImage[]>({
    queryKey: ["imagesByTag", tagId],
    queryFn: async () => {
      if (!actor || !tagId) return [];
      return actor.getImagesByTag(tagId);
    },
    enabled: !!actor && !isFetching && !!tagId,
  });
}

export function useImagesByTags(tagIds: string[]) {
  const { actor, isFetching } = useActor();
  return useQuery<AIImage[]>({
    queryKey: ["imagesByTags", tagIds],
    queryFn: async () => {
      if (!actor || tagIds.length === 0) return [];
      return actor.getImagesByTags(tagIds);
    },
    enabled: !!actor && !isFetching && tagIds.length > 0,
  });
}

export function useWatermarkConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<WatermarkConfig>({
    queryKey: ["watermarkConfig"],
    queryFn: async () => {
      if (!actor)
        return { scale: 0.3, enabled: false, positionX: 80, positionY: 80 };
      return actor.getWatermarkConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateWatermarkConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: WatermarkConfig) => {
      if (!actor) throw new Error("Actor not available");
      await actor.updateWatermarkConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watermarkConfig"] });
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyActor = any;

export function usePaymentConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentConfig>({
    queryKey: ["paymentConfig"],
    queryFn: async () => {
      if (!actor) return { priceText: "5元/张" };
      try {
        return await (actor as AnyActor).getPaymentConfig();
      } catch {
        return { priceText: "5元/张" };
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdatePaymentConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: PaymentConfig) => {
      if (!actor) throw new Error("Actor not available");
      await (actor as AnyActor).updatePaymentConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["paymentConfig"] });
    },
  });
}

export function useContactConfig() {
  const { actor, isFetching } = useActor();
  return useQuery<ContactConfig>({
    queryKey: ["contactConfig"],
    queryFn: async () => {
      if (!actor) return {};
      try {
        return await (actor as AnyActor).getContactConfig();
      } catch {
        return {};
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateContactConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: ContactConfig) => {
      if (!actor) throw new Error("Actor not available");
      await (actor as AnyActor).updateContactConfig(config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactConfig"] });
    },
  });
}

// ─── Tag mutations (localStorage only, no canister, never fails) ──────────────

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<string> => {
      const id = `${name}_${Date.now()}`;
      const newTag: Tag = {
        id,
        name,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000), // nanoseconds like canister
      };
      const tags = loadLocalTags();
      tags.unshift(newTag);
      saveLocalTags(tags);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tagId: string): Promise<void> => {
      const tags = loadLocalTags().filter((t) => t.id !== tagId);
      saveLocalTags(tags);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTags"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTag"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTags"] });
      queryClient.invalidateQueries({ queryKey: ["latestImages"] });
    },
  });
}

// ─── Image mutations (canister / blob-storage) ────────────────────────────────

export function useAddImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fileBytes,
      tagIds,
      fileName,
      size,
      onProgress,
    }: {
      fileBytes: Uint8Array<ArrayBuffer>;
      tagIds: string[];
      fileName: string;
      size: bigint;
      onProgress?: (pct: number) => void;
    }) => {
      if (!actor) throw new Error("Actor not available");
      let blob = ExternalBlobClass.fromBytes(fileBytes);
      if (onProgress) {
        blob = blob.withUploadProgress(onProgress);
      }
      return actor.addImage(blob, tagIds, fileName, size);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latestImages"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTag"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTags"] });
    },
  });
}

export function useDeleteImage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteImage(imageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latestImages"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTag"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTags"] });
    },
  });
}
