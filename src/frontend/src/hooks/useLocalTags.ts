/**
 * useLocalTags — 纯本地 localStorage 标签管理，完全不依赖后端 canister
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tag } from "../backend";

// Raw shape stored in localStorage (createdAt as number for JSON compat)
interface RawTag {
  id: string;
  name: string;
  createdAt: number;
}

const STORAGE_KEY = "xiaomubread_tags_v1";

function loadRawTags(): RawTag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RawTag[];
  } catch {
    return [];
  }
}

function saveRawTags(tags: RawTag[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
}

function rawToTag(r: RawTag): Tag {
  return { id: r.id, name: r.name, createdAt: BigInt(r.createdAt) };
}

export function useLocalAllTags() {
  return useQuery<Tag[]>({
    queryKey: ["localTags"],
    queryFn: () => loadRawTags().map(rawToTag),
    staleTime: 0,
  });
}

export function useLocalCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<string> => {
      const tags = loadRawTags();
      const existing = tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase(),
      );
      if (existing) return existing.id;
      const id = `tag_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const newTag: RawTag = { id, name, createdAt: Date.now() };
      saveRawTags([newTag, ...tags]);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localTags"] });
    },
  });
}

export function useLocalDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tagId: string): Promise<void> => {
      const tags = loadRawTags().filter((t) => t.id !== tagId);
      saveRawTags(tags);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["localTags"] });
    },
  });
}
