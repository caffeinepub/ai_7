import { Tag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect } from "react";
import type { AIImage, Tag as TagType, WatermarkConfig } from "../backend";
import { WatermarkedImage } from "./WatermarkedImage";

interface ImageLightboxProps {
  image: AIImage | null;
  imageIndex?: number;
  imageTags?: TagType[];
  watermarkConfig?: WatermarkConfig | null;
  onClose: () => void;
  showWatermark?: boolean;
  isAdmin?: boolean;
  onDownload?: (image: AIImage) => void;
  onDelete?: (image: AIImage) => void;
  onTagClick?: (tagId: string) => void;
}

export function ImageLightbox({
  image,
  imageIndex,
  imageTags = [],
  watermarkConfig,
  onClose,
  showWatermark = true,
  isAdmin = false,
  onDownload,
  onDelete,
  onTagClick,
}: ImageLightboxProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  useEffect(() => {
    if (image) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [image]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!isAdmin) e.preventDefault();
  };

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-ocid="lightbox.modal"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="absolute inset-0 bg-black/85 backdrop-blur-sm cursor-default"
            onClick={handleClose}
            aria-label="关闭预览"
          />

          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            onClick={handleClose}
            data-ocid="lightbox.close_button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Image */}
          <motion.div
            className="relative z-10 flex flex-col items-center max-w-4xl w-full mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Image sequence number */}
            {imageIndex !== undefined && (
              <div className="mb-2 self-start">
                <span className="text-white/60 text-xs font-mono bg-black/30 px-2 py-0.5 rounded-full">
                  #{imageIndex + 1}
                </span>
              </div>
            )}

            <div
              className="w-full rounded-lg overflow-hidden shadow-2xl bg-black"
              onContextMenu={handleContextMenu}
              style={{ maxHeight: "75vh" }}
            >
              {showWatermark ? (
                <WatermarkedImage
                  imageUrl={image.blob.getDirectURL()}
                  watermarkConfig={watermarkConfig}
                  className="w-full"
                  alt={image.fileName}
                />
              ) : (
                <img
                  src={image.blob.getDirectURL()}
                  alt={image.fileName}
                  className="w-full object-contain"
                  style={{ maxHeight: "75vh" }}
                  draggable={false}
                />
              )}
            </div>

            {/* Tag pills + admin actions */}
            <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
              {imageTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="flex items-center gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground text-sm px-3 py-1.5 rounded-full transition-colors"
                  onClick={() => {
                    if (onTagClick) {
                      handleClose();
                      onTagClick(tag.id);
                    }
                  }}
                  data-ocid="lightbox.link"
                >
                  <Tag className="h-3.5 w-3.5" />
                  {tag.name}
                </button>
              ))}

              {isAdmin && onDownload && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-full transition-colors"
                  onClick={() => onDownload(image)}
                  data-ocid="lightbox.secondary_button"
                >
                  下载原图
                </button>
              )}

              {isAdmin && onDelete && (
                <button
                  type="button"
                  className="flex items-center gap-1.5 bg-destructive/80 hover:bg-destructive text-destructive-foreground text-sm px-3 py-1.5 rounded-full transition-colors"
                  onClick={() => onDelete(image)}
                  data-ocid="lightbox.delete_button"
                >
                  删除图片
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
