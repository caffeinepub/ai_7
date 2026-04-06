import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { WatermarkConfig } from "../../backend";
import {
  useUpdateWatermarkConfig,
  useWatermarkConfig,
} from "../../hooks/useQueries";
import { AdminLayout } from "./AdminLayout";

// 9:16 portrait sample image
const SAMPLE_IMAGE = "/assets/generated/sample-portrait.dim_450x800.jpg";

export function WatermarkPage() {
  const { data: savedConfig, isLoading } = useWatermarkConfig();
  const updateConfig = useUpdateWatermarkConfig();

  const [enabled, setEnabled] = useState(true);
  const [stickerBlob, setStickerBlob] = useState<ExternalBlob | null>(null);
  const [stickerPreviewUrl, setStickerPreviewUrl] = useState<string | null>(
    null,
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseImgRef = useRef<HTMLImageElement | null>(null);
  const stickerImgRef = useRef<HTMLImageElement | null>(null);

  // Load saved config
  useEffect(() => {
    if (savedConfig) {
      setEnabled(savedConfig.enabled);
      if (savedConfig.blob) {
        const url = savedConfig.blob.getDirectURL();
        setStickerPreviewUrl(url);
        setStickerBlob(savedConfig.blob);
      }
    }
  }, [savedConfig]);

  // Draw preview: base image + fullscreen watermark overlay
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseImg = baseImgRef.current;
    if (!baseImg || !baseImg.complete) return;

    canvas.width = baseImg.naturalWidth || 450;
    canvas.height = baseImg.naturalHeight || 800;
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

    // Full-screen watermark: stretch to cover entire image
    if (enabled && stickerImgRef.current && stickerImgRef.current.complete) {
      const wmImg = stickerImgRef.current;
      ctx.drawImage(wmImg, 0, 0, canvas.width, canvas.height);
    }
  }, [enabled]);

  // Load base sample image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      baseImgRef.current = img;
      drawPreview();
    };
    img.src = SAMPLE_IMAGE;
  }, [drawPreview]);

  // Update sticker image when URL changes
  useEffect(() => {
    if (!stickerPreviewUrl) {
      stickerImgRef.current = null;
      drawPreview();
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      stickerImgRef.current = img;
      drawPreview();
    };
    img.onerror = () => {
      stickerImgRef.current = null;
    };
    img.src = stickerPreviewUrl;
  }, [stickerPreviewUrl, drawPreview]);

  // Redraw on param changes
  useEffect(() => {
    drawPreview();
  }, [drawPreview]);

  const handleStickerUpload = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(bytes);
    setStickerBlob(blob);
    const objectUrl = URL.createObjectURL(new Blob([bytes]));
    setStickerPreviewUrl(objectUrl);
  };

  const handleSave = async () => {
    // For fullscreen mode: position is irrelevant, scale=1 means full cover
    const config: WatermarkConfig = {
      scale: 1,
      enabled,
      positionX: 50,
      positionY: 50,
      blob: stickerBlob ?? undefined,
    };
    try {
      await updateConfig.mutateAsync(config);
      toast.success("水印设置已保存");
    } catch (e) {
      toast.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-display font-semibold text-foreground">
            水印设置
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            上传全屏水印图片（9:16竖版PNG），覆盖在访客端所有图片上
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Preview Canvas */}
            <div>
              <Label className="text-sm font-medium mb-2 block">预览效果</Label>
              <p className="text-xs text-muted-foreground mb-3">
                以下为9:16示例图，水印将全屏覆盖图片
              </p>
              <div className="rounded-lg overflow-hidden border border-border shadow-sm bg-muted max-w-[200px]">
                <canvas
                  ref={canvasRef}
                  className="w-full"
                  style={{ display: "block" }}
                  onContextMenu={(e) => e.preventDefault()}
                  data-ocid="admin.watermark.canvas_target"
                />
              </div>
            </div>

            {/* Upload sticker */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                上传全屏水印图片
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                建议使用9:16透明背PNG图片，上传后将自动全屏覆盖访客端图片
              </p>
              <button
                type="button"
                className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                data-ocid="admin.watermark.dropzone"
              >
                {stickerPreviewUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={stickerPreviewUrl}
                      alt="水印图片"
                      className="max-h-20 object-contain"
                    />
                    <p className="text-xs text-muted-foreground">
                      点击更换水印图片
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8 opacity-50" />
                    <p className="text-sm">点击上传水印图片</p>
                    <p className="text-xs">推荐使用9:16 PNG透明背景图片</p>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && handleStickerUpload(e.target.files[0])
                }
                data-ocid="admin.watermark.upload_button"
              />
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">启用水印</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  控制访客是否看到水印
                </p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                data-ocid="admin.watermark.switch"
              />
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={updateConfig.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
              data-ocid="admin.watermark.save_button"
            >
              {updateConfig.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              保存设置
            </Button>

            {updateConfig.isSuccess && (
              <div
                className="text-center text-sm text-primary"
                data-ocid="admin.watermark.success_state"
              >
                ✓ 设置已保存
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
