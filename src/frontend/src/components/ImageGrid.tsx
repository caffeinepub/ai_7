import { Skeleton } from "@/components/ui/skeleton";
import type { AIImage, WatermarkConfig } from "../backend";
import { WatermarkedImage } from "./WatermarkedImage";

const SKELETONS = Array.from({ length: 15 }, (_, i) => `sk-${i}`);
const IMG_SKELETONS = Array.from({ length: 10 }, (_, i) => `isk-${i}`);

interface ImageGridProps {
  images: AIImage[];
  isLoading: boolean;
  watermarkConfig?: WatermarkConfig | null;
  onImageClick: (image: AIImage, index: number) => void;
  showWatermark?: boolean;
  skeletonKeys?: string[];
}

export function ImageGrid({
  images,
  isLoading,
  watermarkConfig,
  onImageClick,
  showWatermark = true,
  skeletonKeys = SKELETONS,
}: ImageGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2" data-ocid="images.loading_state">
        {skeletonKeys.map((k) => (
          <Skeleton
            key={k}
            className="h-24 rounded-xl bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-24 text-muted-foreground"
        data-ocid="images.empty_state"
      >
        <svg
          className="h-16 w-16 mb-4 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-label="暂无图片"
          role="img"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">暂无图片</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {images.map((image, idx) => (
        <button
          key={image.id}
          type="button"
          className="group relative rounded-xl overflow-hidden bg-muted cursor-pointer shadow-md hover:shadow-lg transition-shadow duration-200 text-left w-full"
          onClick={() => onImageClick(image, idx)}
          data-ocid={`images.item.${idx + 1}`}
        >
          {/* Sequence number badge */}
          <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full backdrop-blur-sm leading-none pointer-events-none z-10">
            #{idx + 1}
          </span>
          {showWatermark ? (
            <WatermarkedImage
              imageUrl={image.blob.getDirectURL()}
              watermarkConfig={watermarkConfig}
              className=""
              alt={image.fileName}
            />
          ) : (
            <div
              className="w-full overflow-hidden"
              onContextMenu={(e) => e.preventDefault()}
            >
              <img
                src={image.blob.getDirectURL()}
                alt={image.fileName}
                className="w-full h-auto object-contain"
                draggable={false}
              />
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-xl" />
        </button>
      ))}
    </div>
  );
}

export { IMG_SKELETONS };
