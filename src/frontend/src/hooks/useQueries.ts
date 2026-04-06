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

export function useAllTags() {
  const { actor, isFetching } = useActor();
  return useQuery<Tag[]>({
    queryKey: ["allTags"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTags();
    },
    enabled: !!actor && !isFetching,
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

export function useCreateTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createTag(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTags"] });
    },
  });
}

export function useDeleteTag() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tagId: string) => {
      if (!actor) throw new Error("Actor not available");
      await actor.deleteTag(tagId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allTags"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTag"] });
      queryClient.invalidateQueries({ queryKey: ["imagesByTags"] });
      queryClient.invalidateQueries({ queryKey: ["latestImages"] });
    },
  });
}

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
