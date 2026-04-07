import { Tag, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
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
  // Track natural aspect ratio of the loaded image
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Preload image to detect natural dimensions, reset when image changes
  useEffect(() => {
    setNaturalRatio(null);
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      if (img.naturalHeight > 0) {
        setNaturalRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.src = image.blob.getDirectURL();
  }, [image]);

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

  // Calculate image container style based on real aspect ratio
  // Portrait (ratio < 1): constrain width = 60vh * ratio so height fills exactly 60vh
  // Landscape (ratio >= 1): full width, let aspect-ratio + maxHeight do the rest
  const getImageContainerStyle = (): React.CSSProperties => {
    if (!naturalRatio) {
      return { width: "100%", maxHeight: "60vh" };
    }
    if (naturalRatio < 1) {
      // portrait: derive width from the 60vh height ceiling
      return {
        width: `min(100%, calc(60vh * ${naturalRatio}))`,
        aspectRatio: String(naturalRatio),
        maxHeight: "60vh",
      };
    }
    // landscape
    return {
      width: "100%",
      aspectRatio: String(naturalRatio),
      maxHeight: "60vh",
    };
  };

  return (
    <AnimatePresence>
      {image && (
        <motion.div
          className="fixed inset-0 z-50 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          data-ocid="lightbox.modal"
        >
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black/85 backdrop-blur-sm cursor-default"
            onClick={handleClose}
            aria-label="关闭预览"
          />

          {/* Close button — fixed at top-right, always above scrollable content */}
          <button
            type="button"
            className="fixed top-3 right-3 z-[60] bg-white/20 hover:bg-white/35 text-white rounded-full p-2.5 transition-colors"
            onClick={handleClose}
            data-ocid="lightbox.close_button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Scrollable content column, starts below the close button */}
          <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto px-3 py-10">
            <motion.div
              className="flex flex-col items-center w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* Image sequence number */}
              {imageIndex !== undefined && (
                <div className="mb-1.5 self-start pl-0.5">
                  <span className="text-white/70 text-xs font-mono bg-black/40 px-2 py-0.5 rounded-full">
                    #{imageIndex + 1}
                  </span>
                </div>
              )}

              {/* Image container — respects real aspect ratio */}
              <div
                className="rounded-lg overflow-hidden shadow-2xl bg-black"
                style={getImageContainerStyle()}
                onContextMenu={handleContextMenu}
              >
                {showWatermark ? (
                  <WatermarkedImage
                    imageUrl={image.blob.getDirectURL()}
                    watermarkConfig={watermarkConfig}
                    className="w-full h-full object-contain"
                    alt={image.fileName}
                  />
                ) : (
                  <img
                    src={image.blob.getDirectURL()}
                    alt={image.fileName}
                    className="w-full h-full object-contain"
                    draggable={false}
                    onLoad={(e) => {
                      const t = e.currentTarget;
                      if (t.naturalHeight > 0) {
                        setNaturalRatio(t.naturalWidth / t.naturalHeight);
                      }
                    }}
                  />
                )}
              </div>

              {/* Tag pills + admin actions */}
              {(imageTags.length > 0 ||
                (isAdmin && (onDownload || onDelete))) && (
                <div className="mt-2.5 mb-1 flex items-center gap-2 flex-wrap justify-center">
                  {imageTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="flex items-center gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-full transition-colors"
                      onClick={() => {
                        if (onTagClick) {
                          handleClose();
                          onTagClick(tag.id);
                        }
                      }}
                      data-ocid="lightbox.link"
                    >
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </button>
                  ))}

                  {isAdmin && onDownload && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
                      onClick={() => onDownload(image)}
                      data-ocid="lightbox.secondary_button"
                    >
                      下载原图
                    </button>
                  )}

                  {isAdmin && onDelete && (
                    <button
                      type="button"
                      className="flex items-center gap-1.5 bg-destructive/80 hover:bg-destructive text-destructive-foreground text-xs px-3 py-1.5 rounded-full transition-colors"
                      onClick={() => onDelete(image)}
                      data-ocid="lightbox.delete_button"
                    >
                      删除图片
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
