import { useEffect, useRef, useState } from "react";
import type { WatermarkConfig } from "../backend";

interface WatermarkedImageProps {
  imageUrl: string;
  watermarkConfig: WatermarkConfig | null | undefined;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function WatermarkedImage({
  imageUrl,
  watermarkConfig,
  className = "",
  alt = "",
  onClick,
}: WatermarkedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [error, setError] = useState(false);
  // Store natural aspect ratio (height / width) for layout
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setRendered(false);
    setError(false);

    const baseImg = new Image();
    baseImg.crossOrigin = "anonymous";

    const drawBase = () => {
      canvas.width = baseImg.naturalWidth || baseImg.width;
      canvas.height = baseImg.naturalHeight || baseImg.height;

      if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = 400;
        canvas.height = 300;
      }

      // Record aspect ratio (h/w) so the container can size itself correctly
      setAspectRatio(canvas.height / canvas.width);

      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
    };

    const drawWatermark = (wmImg: HTMLImageElement) => {
      if (!watermarkConfig || !watermarkConfig.enabled || !watermarkConfig.blob)
        return;
      ctx.drawImage(wmImg, 0, 0, canvas.width, canvas.height);
    };

    baseImg.onload = () => {
      drawBase();

      if (watermarkConfig?.enabled && watermarkConfig?.blob) {
        const wmUrl = watermarkConfig.blob.getDirectURL();
        const wmImg = new Image();
        wmImg.crossOrigin = "anonymous";
        wmImg.onload = () => {
          drawWatermark(wmImg);
          setRendered(true);
        };
        wmImg.onerror = () => {
          setRendered(true);
        };
        wmImg.src = wmUrl;
      } else {
        setRendered(true);
      }
    };

    baseImg.onerror = () => {
      setError(true);
      setRendered(true);
    };

    baseImg.src = imageUrl;
  }, [imageUrl, watermarkConfig]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  if (error) {
    return (
      <div
        className={`bg-muted flex items-center justify-center text-muted-foreground text-sm ${className}`}
        style={{ minHeight: 120 }}
      >
        图片加载失败
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`protected-image-wrapper relative overflow-hidden ${className} p-0 border-0 bg-transparent`}
      onContextMenu={handleContextMenu}
      onClick={onClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        display: "block",
        width: "100%",
        // Preserve natural aspect ratio via padding-bottom trick once known
        ...(aspectRatio
          ? { paddingBottom: `${aspectRatio * 100}%`, height: 0 }
          : { minHeight: 80 }),
      }}
      aria-label={alt || "图片"}
    >
      {!rendered && <div className="absolute inset-0 bg-muted animate-pulse" />}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full protected-image transition-opacity duration-300 ${
          rendered ? "opacity-100" : "opacity-0"
        }`}
        aria-label={alt}
        style={{ display: "block", objectFit: "contain" }}
      />
    </button>
  );
}
