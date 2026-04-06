import { ChevronDown, Tag, X } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { AIImage } from "../backend";
import { ImageGrid } from "../components/ImageGrid";
import { ImageLightbox } from "../components/ImageLightbox";
import { PublicHeader } from "../components/PublicHeader";
import { useLocalAllTags } from "../hooks/useLocalTags";
import {
  useImagesByTags,
  useLatestImages,
  useWatermarkConfig,
} from "../hooks/useQueries";

const MAX_SELECTED_TAGS = 3;

export function HomePage() {
  const [selectedImage, setSelectedImage] = useState<AIImage | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<
    number | undefined
  >(undefined);
  const [tagMenuOpen, setTagMenuOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const { data: allTags = [] } = useLocalAllTags();
  const { data: latestImages = [], isLoading: latestLoading } =
    useLatestImages(100);
  const { data: tagFilteredImages = [], isLoading: tagLoading } =
    useImagesByTags(selectedTagIds);

  const { data: watermarkConfig } = useWatermarkConfig();

  const isFiltering = selectedTagIds.length > 0;
  const images = isFiltering ? tagFilteredImages : latestImages;
  const isLoading = isFiltering ? tagLoading : latestLoading;

  const selectedTags = allTags.filter((t) => selectedTagIds.includes(t.id));

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) {
        return prev.filter((id) => id !== tagId);
      }
      if (prev.length >= MAX_SELECTED_TAGS) return prev;
      return [...prev, tagId];
    });
  };

  const clearTags = () => setSelectedTagIds([]);

  // Find tags for selected image
  const selectedImageTags = selectedImage
    ? allTags.filter((t) => selectedImage.tagIds.includes(t.id))
    : [];

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Title row: "最新图片" + tag filter on the right */}
          <div className="mb-6 flex items-center justify-between gap-3">
            <h1 className="text-2xl font-display font-semibold text-primary">
              {isFiltering ? "筛选结果" : "最新图片"}
            </h1>

            {/* Tag filter dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setTagMenuOpen(!tagMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border text-sm text-foreground hover:bg-accent transition-colors"
                data-ocid="nav.dropdown_menu"
              >
                <Tag className="h-4 w-4" />
                {isFiltering ? (
                  <span className="text-primary font-medium">
                    图库标签 · {selectedTags.map((t) => t.name).join(" · ")}
                  </span>
                ) : (
                  "图库标签"
                )}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${
                    tagMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {tagMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setTagMenuOpen(false)}
                    onKeyDown={(e) =>
                      e.key === "Escape" && setTagMenuOpen(false)
                    }
                    role="button"
                    tabIndex={-1}
                    aria-label="关闭菜单"
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 bg-popover border border-border rounded-lg shadow-lg w-72 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          图库标签
                        </span>
                        <span className="text-xs text-muted-foreground">
                          最多选 {MAX_SELECTED_TAGS} 个
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isFiltering && (
                          <button
                            type="button"
                            onClick={clearTags}
                            className="text-xs text-primary hover:text-primary/80 px-2 py-0.5 rounded hover:bg-primary/10 transition-colors"
                            data-ocid="nav.toggle"
                          >
                            清除
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setTagMenuOpen(false)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {allTags.length === 0 ? (
                      <div
                        className="px-4 py-6 text-center text-muted-foreground text-sm"
                        data-ocid="nav.empty_state"
                      >
                        暂无标签
                      </div>
                    ) : (
                      <div className="p-3 flex flex-wrap gap-2">
                        {allTags.map((tag) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          const isDisabled =
                            !isSelected &&
                            selectedTagIds.length >= MAX_SELECTED_TAGS;
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => toggleTag(tag.id)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : isDisabled
                                    ? "bg-muted text-muted-foreground opacity-40 cursor-not-allowed"
                                    : "bg-muted text-foreground hover:bg-primary/15 hover:text-primary"
                              }`}
                              data-ocid="nav.tab"
                            >
                              # {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {isFiltering && (
                      <div className="px-3 pb-3">
                        <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-1">
                          已选：
                          {selectedTags.map((t) => t.name).join("、")}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Selected tag pills */}
          {isFiltering && (
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  # {tag.name}
                  <button
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                    aria-label={`移除标签 ${tag.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearTags}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="nav.secondary_button"
              >
                清除全部
              </button>
            </div>
          )}

          <ImageGrid
            images={images}
            isLoading={isLoading}
            watermarkConfig={watermarkConfig}
            onImageClick={(image, idx) => {
              setSelectedImage(image);
              setSelectedImageIndex(idx);
            }}
            showWatermark
          />
        </motion.div>
      </main>

      <footer className="mt-16 border-t border-border py-6 text-center text-muted-foreground text-sm">
        <p>
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-primary">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <ImageLightbox
        image={selectedImage}
        imageIndex={selectedImageIndex}
        imageTags={selectedImageTags}
        watermarkConfig={watermarkConfig}
        onClose={() => {
          setSelectedImage(null);
          setSelectedImageIndex(undefined);
        }}
        showWatermark
        onTagClick={(tagId) => {
          setSelectedImage(null);
          setSelectedImageIndex(undefined);
          setSelectedTagIds([tagId]);
        }}
      />
    </div>
  );
}
