import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { ContactConfig } from "../../hooks/useQueries";
import {
  useContactConfig,
  useUpdateContactConfig,
} from "../../hooks/useQueries";
import { AdminLayout } from "./AdminLayout";

interface QRUploadSectionProps {
  label: string;
  accentClass: string;
  borderClass: string;
  bgClass: string;
  previewUrl: string | null;
  onUpload: (file: File) => void;
  uploadInputId: string;
  ocidDropzone: string;
  ocidUpload: string;
}

function QRUploadSection({
  label,
  accentClass,
  borderClass,
  bgClass,
  previewUrl,
  onUpload,
  uploadInputId,
  ocidDropzone,
  ocidUpload,
}: QRUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">{label}</Label>
      <button
        type="button"
        className={`w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${borderClass} hover:opacity-80`}
        onClick={() => fileInputRef.current?.click()}
        data-ocid={ocidDropzone}
      >
        {previewUrl ? (
          <div className="flex flex-col items-center gap-3">
            <img
              src={previewUrl}
              alt={label}
              className="max-h-48 object-contain rounded-lg"
            />
            <p className="text-xs text-muted-foreground">点击更换二维码</p>
          </div>
        ) : (
          <div className={`flex flex-col items-center gap-2 ${accentClass}`}>
            <Upload className="h-8 w-8 opacity-50" />
            <p className="text-sm">点击上传{label}</p>
            <p className="text-xs opacity-70">支持 PNG / JPG 格式</p>
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        id={uploadInputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        data-ocid={ocidUpload}
      />
      {previewUrl && (
        <div
          className={`rounded-lg p-3 text-center text-xs ${bgClass} ${accentClass}`}
        >
          二维码已上传，访客点击联系发图可查看
        </div>
      )}
    </div>
  );
}

export function ContactSettingsPage() {
  const { data: savedConfig, isLoading } = useContactConfig();
  const updateConfig = useUpdateContactConfig();

  const [qqBlob, setQqBlob] = useState<ExternalBlob | null>(null);
  const [qqPreviewUrl, setQqPreviewUrl] = useState<string | null>(null);
  const [wechatBlob, setWechatBlob] = useState<ExternalBlob | null>(null);
  const [wechatPreviewUrl, setWechatPreviewUrl] = useState<string | null>(null);
  const [xiaohongshuBlob, setXiaohongshuBlob] = useState<ExternalBlob | null>(
    null,
  );
  const [xiaohongshuPreviewUrl, setXiaohongshuPreviewUrl] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (savedConfig) {
      if (savedConfig.qqBlob) {
        setQqPreviewUrl(savedConfig.qqBlob.getDirectURL());
        setQqBlob(savedConfig.qqBlob);
      }
      if (savedConfig.wechatBlob) {
        setWechatPreviewUrl(savedConfig.wechatBlob.getDirectURL());
        setWechatBlob(savedConfig.wechatBlob);
      }
      if (savedConfig.xiaohongshuBlob) {
        setXiaohongshuPreviewUrl(savedConfig.xiaohongshuBlob.getDirectURL());
        setXiaohongshuBlob(savedConfig.xiaohongshuBlob);
      }
    }
  }, [savedConfig]);

  const handleUpload = async (
    file: File,
    setBlob: (b: ExternalBlob) => void,
    setUrl: (u: string) => void,
  ) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(bytes);
    setBlob(blob);
    const objectUrl = URL.createObjectURL(new Blob([bytes]));
    setUrl(objectUrl);
  };

  const handleSave = async () => {
    const config: ContactConfig = {
      qqBlob: qqBlob ?? undefined,
      wechatBlob: wechatBlob ?? undefined,
      xiaohongshuBlob: xiaohongshuBlob ?? undefined,
    };
    try {
      await updateConfig.mutateAsync(config);
      toast.success("联系设置已保存");
    } catch (e) {
      toast.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-display font-semibold text-foreground">
            联系发图设置
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            上传 QQ、微信、小红书二维码，访客点击联系发图可扫码联系
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : (
          <div className="space-y-6">
            <QRUploadSection
              label="QQ 二维码"
              accentClass="text-sky-600"
              borderClass="border-sky-200 bg-sky-50/50"
              bgClass="bg-sky-50"
              previewUrl={qqPreviewUrl}
              onUpload={(f) => handleUpload(f, setQqBlob, setQqPreviewUrl)}
              uploadInputId="qq-upload"
              ocidDropzone="admin.contact.qq.dropzone"
              ocidUpload="admin.contact.qq.upload_button"
            />

            <QRUploadSection
              label="微信二维码"
              accentClass="text-green-600"
              borderClass="border-green-200 bg-green-50/50"
              bgClass="bg-green-50"
              previewUrl={wechatPreviewUrl}
              onUpload={(f) =>
                handleUpload(f, setWechatBlob, setWechatPreviewUrl)
              }
              uploadInputId="wechat-contact-upload"
              ocidDropzone="admin.contact.wechat.dropzone"
              ocidUpload="admin.contact.wechat.upload_button"
            />

            <QRUploadSection
              label="小红书二维码"
              accentClass="text-red-600"
              borderClass="border-red-200 bg-red-50/50"
              bgClass="bg-red-50"
              previewUrl={xiaohongshuPreviewUrl}
              onUpload={(f) =>
                handleUpload(f, setXiaohongshuBlob, setXiaohongshuPreviewUrl)
              }
              uploadInputId="xiaohongshu-upload"
              ocidDropzone="admin.contact.xiaohongshu.dropzone"
              ocidUpload="admin.contact.xiaohongshu.upload_button"
            />

            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={updateConfig.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                data-ocid="admin.contact.save_button"
              >
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                保存联系设置
              </Button>

              {updateConfig.isSuccess && (
                <div
                  className="text-center text-sm text-primary"
                  data-ocid="admin.contact.success_state"
                >
                  ✓ 联系设置已保存，访客端二维码已更新
                </div>
              )}

              {updateConfig.isError && (
                <div
                  className="text-center text-sm text-destructive"
                  data-ocid="admin.contact.error_state"
                >
                  保存失败，请重试
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
