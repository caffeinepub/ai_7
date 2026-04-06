import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type { PaymentConfig } from "../../hooks/useQueries";
import {
  usePaymentConfig,
  useUpdatePaymentConfig,
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
            <p className="text-xs text-muted-foreground">点击更换收款码</p>
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
          收款码已上传，访客点击支付按钮后可查看
        </div>
      )}
    </div>
  );
}

export function PaymentSettingsPage() {
  const { data: savedConfig, isLoading } = usePaymentConfig();
  const updateConfig = useUpdatePaymentConfig();

  const [wechatBlob, setWechatBlob] = useState<ExternalBlob | null>(null);
  const [wechatPreviewUrl, setWechatPreviewUrl] = useState<string | null>(null);
  const [alipayBlob, setAlipayBlob] = useState<ExternalBlob | null>(null);
  const [alipayPreviewUrl, setAlipayPreviewUrl] = useState<string | null>(null);

  // Load saved config
  useEffect(() => {
    if (savedConfig) {
      if (savedConfig.wechatBlob) {
        setWechatPreviewUrl(savedConfig.wechatBlob.getDirectURL());
        setWechatBlob(savedConfig.wechatBlob);
      }
      if (savedConfig.alipayBlob) {
        setAlipayPreviewUrl(savedConfig.alipayBlob.getDirectURL());
        setAlipayBlob(savedConfig.alipayBlob);
      }
    }
  }, [savedConfig]);

  const handleWechatUpload = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(bytes);
    setWechatBlob(blob);
    const objectUrl = URL.createObjectURL(new Blob([bytes]));
    setWechatPreviewUrl(objectUrl);
  };

  const handleAlipayUpload = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const blob = ExternalBlob.fromBytes(bytes);
    setAlipayBlob(blob);
    const objectUrl = URL.createObjectURL(new Blob([bytes]));
    setAlipayPreviewUrl(objectUrl);
  };

  const handleSave = async () => {
    const config: PaymentConfig = {
      priceText: "5元/张",
      wechatBlob: wechatBlob ?? undefined,
      alipayBlob: alipayBlob ?? undefined,
    };
    try {
      await updateConfig.mutateAsync(config);
      toast.success("支付设置已保存");
    } catch (e) {
      toast.error(`保存失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 max-w-lg mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-display font-semibold text-foreground">
            支付设置
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            上传微信和支付宝收款码，访客点击支付按钮后可扫码支付
          </p>
        </div>

        {/* Price display */}
        <div className="mb-5 flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
          <span className="text-sm font-medium text-primary">统一售价：</span>
          <span className="text-lg font-bold text-primary">5元/张</span>
          <span className="text-xs text-muted-foreground ml-2">
            （固定价格，无法修改）
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : (
          <div className="space-y-6">
            {/* WeChat QR */}
            <QRUploadSection
              label="微信收款码"
              accentClass="text-green-600"
              borderClass="border-green-200 bg-green-50/50"
              bgClass="bg-green-50"
              previewUrl={wechatPreviewUrl}
              onUpload={handleWechatUpload}
              uploadInputId="wechat-upload"
              ocidDropzone="admin.payment.wechat.dropzone"
              ocidUpload="admin.payment.wechat.upload_button"
            />

            {/* Alipay QR */}
            <QRUploadSection
              label="支付宝收款码"
              accentClass="text-blue-600"
              borderClass="border-blue-200 bg-blue-50/50"
              bgClass="bg-blue-50"
              previewUrl={alipayPreviewUrl}
              onUpload={handleAlipayUpload}
              uploadInputId="alipay-upload"
              ocidDropzone="admin.payment.alipay.dropzone"
              ocidUpload="admin.payment.alipay.upload_button"
            />

            {/* Save button */}
            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={updateConfig.isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                data-ocid="admin.payment.save_button"
              >
                {updateConfig.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                保存支付设置
              </Button>

              {updateConfig.isSuccess && (
                <div
                  className="text-center text-sm text-primary"
                  data-ocid="admin.payment.success_state"
                >
                  ✓ 支付设置已保存，访客端收款码已更新
                </div>
              )}

              {updateConfig.isError && (
                <div
                  className="text-center text-sm text-destructive"
                  data-ocid="admin.payment.error_state"
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
