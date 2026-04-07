import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  Download,
  Loader2,
  Plus,
  Search,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { AIImage } from "../../backend";
import { ImageLightbox } from "../../components/ImageLightbox";
import {
  useAddImage,
  useAllTags,
  useCreateTag,
  useDeleteImage,
  useDeleteTag,
  useLatestImages,
} from "../../hooks/useQueries";
import { AdminLayout } from "./AdminLayout";

const IMG_SKELETONS = [
  "is-1",
  "is-2",
  "is-3",
  "is-4",
  "is-5",
  "is-6",
  "is-7",
  "is-8",
  "is-9",
  "is-10",
];

const MAX_TAGS_PER_IMAGE = 3;

export function ImageManagementPage() {
  // Tag management state
  const [newTagName, setNewTagName] = useState("");
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [tagPanelOpen, setTagPanelOpen] = useState(true);
  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  // Upload state
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [inlineNewTagName, setInlineNewTagName] = useState("");
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<AIImage | null>(null);
  const [lightboxImageIndex, setLightboxImageIndex] = useState<
    number | undefined
  >(undefined);

  // Search by index
  const [searchInput, setSearchInput] = useState("");
  const imageRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Mount a file input directly on document.body to avoid React DOM insertBefore errors
  useEffect(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/*";
    input.style.display = "none";
    input.addEventListener("change", (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) handleFilesSelected(target.files);
      // Reset so same file can be re-selected
      input.value = "";
    });
    document.body.appendChild(input);
    fileInputRef.current = input;
    return () => {
      document.body.removeChild(input);
      fileInputRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: allTags = [], isLoading: tagsLoading } = useAllTags();
  const { data: allImages = [], isLoading: imgLoading } = useLatestImages(500);

  const createTag = useCreateTag();
  const deleteTag = useDeleteTag();
  const addImage = useAddImage();
  const deleteImage = useDeleteImage();

  // ── Tag management ───────────────────────────────────────────
  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag.mutateAsync(newTagName.trim());
      setNewTagName("");
      setShowNewTagInput(false);
      toast.success(`标签 "${newTagName.trim()}" 创建成功`);
    } catch (e) {
      toast.error(`创建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleDeleteTag = async () => {
    if (!deletingTagId) return;
    try {
      await deleteTag.mutateAsync(deletingTagId);
      setDeletingTagId(null);
      toast.success("标签已删除");
    } catch (e) {
      toast.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  // ── Search by number ──────────────────────────────────────────
  const handleSearch = () => {
    const raw = searchInput.replace(/^#/, "").trim();
    const num = Number.parseInt(raw, 10);
    if (Number.isNaN(num) || num < 1 || num > allImages.length) {
      toast.error(`找不到编号 #${raw}，共 ${allImages.length} 张图片`);
      return;
    }
    const idx = num - 1;
    const el = imageRefs.current[idx];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus();
      // Flash highlight
      el.style.outline = "3px solid hsl(var(--primary))";
      setTimeout(() => {
        el.style.outline = "";
      }, 1500);
    }
  };

  // ── Upload flow ─────────────────────────────────────────────
  const handleFilesSelected = (files: FileList) => {
    setPendingFiles(Array.from(files));
    setSelectedTagIds([]);
  };

  const toggleUploadTag = (tagId: string) => {
    setSelectedTagIds((prev) => {
      if (prev.includes(tagId)) return prev.filter((id) => id !== tagId);
      if (prev.length >= MAX_TAGS_PER_IMAGE) return prev;
      return [...prev, tagId];
    });
  };

  const handleAddInlineTag = async () => {
    if (!inlineNewTagName.trim()) return;
    try {
      const tagId = await createTag.mutateAsync(inlineNewTagName.trim());
      setSelectedTagIds((prev) =>
        prev.length < MAX_TAGS_PER_IMAGE ? [...prev, tagId] : prev,
      );
      setInlineNewTagName("");
      toast.success(`标签 "${inlineNewTagName.trim()}" 已创建并选中`);
    } catch (e) {
      toast.error(`创建失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleConfirmUpload = async () => {
    if (pendingFiles.length === 0 || selectedTagIds.length === 0) return;
    const files = pendingFiles;
    setPendingFiles([]);

    for (const file of files) {
      const key = `${file.name}-${Date.now()}`;
      setUploadProgress((prev) => ({ ...prev, [key]: 0 }));
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        await addImage.mutateAsync({
          fileBytes: bytes,
          tagIds: selectedTagIds,
          fileName: file.name,
          size: BigInt(file.size),
          onProgress: (pct) =>
            setUploadProgress((prev) => ({ ...prev, [key]: pct })),
        });
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast.success(`"${file.name}" 上传成功`);
      } catch {
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        toast.error(`"${file.name}" 上传失败`);
      }
    }
  };

  const handleDownload = async (image: AIImage) => {
    try {
      const bytes = await image.blob.getBytes();
      const blob = new Blob([bytes]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = image.fileName;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("下载失败");
    }
  };

  const handleDeleteImage = async () => {
    if (!deletingImage) return;
    try {
      await deleteImage.mutateAsync(deletingImage);
      setDeletingImage(null);
      setLightboxImage(null);
      setLightboxImageIndex(undefined);
      toast.success("图片已删除");
    } catch (e) {
      toast.error(`删除失败：${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const uploadingCount = Object.keys(uploadProgress).length;
  const averageProgress =
    uploadingCount > 0
      ? Object.values(uploadProgress).reduce((s, v) => s + v, 0) /
        uploadingCount
      : 0;

  // Lightbox image tags
  const lightboxImageTags = lightboxImage
    ? allTags.filter((t) => lightboxImage.tagIds.includes(t.id))
    : [];

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-0">
        {/* ── Tag Management Panel ──────────────────────── */}
        <div className="border-b border-border bg-card">
          {/* Collapsible header */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
            onClick={() => setTagPanelOpen(!tagPanelOpen)}
          >
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">
                标签管理
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {allTags.length} 个标签
              </span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform ${
                tagPanelOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {tagPanelOpen && (
            <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
              {/* New tag button + input */}
              {!showNewTagInput ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs h-8"
                  onClick={() => setShowNewTagInput(true)}
                  data-ocid="admin.tag.open_modal_button"
                >
                  <Plus className="h-3.5 w-3.5" />
                  新建标签
                </Button>
              ) : (
                <div className="flex gap-1.5">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="标签名称"
                    className="h-8 text-xs flex-1"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                    autoFocus
                    data-ocid="admin.tag.input"
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2"
                    onClick={handleCreateTag}
                    disabled={createTag.isPending || !newTagName.trim()}
                    data-ocid="admin.tag.submit_button"
                  >
                    {createTag.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => {
                      setShowNewTagInput(false);
                      setNewTagName("");
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Tag pills */}
              {tagsLoading ? (
                <div className="flex gap-2 flex-wrap">
                  {["t1", "t2", "t3"].map((k) => (
                    <Skeleton key={k} className="h-7 w-16 rounded-full" />
                  ))}
                </div>
              ) : allTags.length === 0 ? (
                <p
                  className="text-xs text-muted-foreground"
                  data-ocid="admin.tags.empty_state"
                >
                  暂无标签，点击上方按钮创建
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag, idx) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium"
                      data-ocid={`admin.tags.item.${idx + 1}`}
                    >
                      #{tag.name}
                      <button
                        type="button"
                        className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                        onClick={() => setDeletingTagId(tag.id)}
                        aria-label={`删除标签 ${tag.name}`}
                        data-ocid={`admin.tags.delete_button.${idx + 1}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Upload Area ────────────────────────────────── */}
        <div className="flex-1 p-4">
          {/* Upload header */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex-1">
              <h2 className="font-semibold text-foreground">图片管理</h2>
              <p className="text-xs text-muted-foreground">
                {allImages.length} 张图片
              </p>
            </div>
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={addImage.isPending || pendingFiles.length > 0}
              data-ocid="admin.upload_button"
            >
              {addImage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              上传图片
            </Button>
            {/* file input lives outside React tree - see useEffect below */}
          </div>

          {/* ── Search by number ───────────────────────── */}
          {allImages.length > 0 && (
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="输入编号定位图片，如 23"
                  className="pl-9 h-9 text-sm"
                  data-ocid="admin.search.input"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 shrink-0"
                onClick={handleSearch}
                data-ocid="admin.search.button"
              >
                定位
              </Button>
            </div>
          )}

          {/* Tag selection UI before upload */}
          {pendingFiles.length > 0 && (
            <div
              className="mb-4 bg-card border border-border rounded-xl p-4 space-y-3"
              data-ocid="admin.upload.panel"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  已选 {pendingFiles.length} 张图片，请选择标签（最多{" "}
                  {MAX_TAGS_PER_IMAGE} 个）
                </p>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setPendingFiles([])}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Existing tags as chips */}
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  const isDisabled =
                    !isSelected && selectedTagIds.length >= MAX_TAGS_PER_IMAGE;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => toggleUploadTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary"
                          : isDisabled
                            ? "bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed"
                            : "bg-background text-foreground border-border hover:border-primary hover:text-primary"
                      }`}
                      data-ocid="admin.upload.toggle"
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>

              {/* Create new tag inline */}
              <div className="flex gap-1.5">
                <Input
                  value={inlineNewTagName}
                  onChange={(e) => setInlineNewTagName(e.target.value)}
                  placeholder="新建标签并选中..."
                  className="h-8 text-xs flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleAddInlineTag()}
                  data-ocid="admin.upload.input"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={handleAddInlineTag}
                  disabled={
                    createTag.isPending ||
                    !inlineNewTagName.trim() ||
                    selectedTagIds.length >= MAX_TAGS_PER_IMAGE
                  }
                >
                  {createTag.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>

              {/* Selected tag summary */}
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTagIds.map((id) => {
                    const tag = allTags.find((t) => t.id === id);
                    return tag ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="text-xs gap-1"
                      >
                        #{tag.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Confirm upload */}
              <Button
                className="w-full gap-2"
                onClick={handleConfirmUpload}
                disabled={selectedTagIds.length === 0 || addImage.isPending}
                data-ocid="admin.upload.submit_button"
              >
                {addImage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                确认上传 {pendingFiles.length} 张图片
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {uploadingCount > 0 && (
            <div
              className="mb-4 bg-card border border-border rounded-lg p-3"
              data-ocid="admin.upload.loading_state"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  上传中 ({uploadingCount} 个文件)...
                </span>
                <span className="text-xs font-medium">
                  {Math.round(averageProgress)}%
                </span>
              </div>
              <Progress value={averageProgress} className="h-1.5" />
            </div>
          )}

          {/* Image Grid — 4 columns, natural aspect ratio */}
          {imgLoading ? (
            <div className="grid grid-cols-4 gap-2">
              {IMG_SKELETONS.map((k) => (
                <Skeleton
                  key={k}
                  className="h-24 rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          ) : allImages.length === 0 ? (
            <button
              type="button"
              className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors w-full"
              onClick={() => fileInputRef.current?.click()}
              data-ocid="admin.images.empty_state"
            >
              <Upload className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">点击上传图片</p>
            </button>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((image, idx) => {
                const imageTags = allTags.filter((t) =>
                  image.tagIds.includes(t.id),
                );
                return (
                  <button
                    type="button"
                    key={image.id}
                    ref={(el) => {
                      imageRefs.current[idx] = el;
                    }}
                    className="group relative rounded-lg overflow-hidden bg-muted cursor-pointer w-full hover:ring-2 hover:ring-primary/50 transition-all"
                    data-ocid={`admin.images.item.${idx + 1}`}
                    onClick={() => {
                      setLightboxImage(image);
                      setLightboxImageIndex(idx);
                    }}
                  >
                    {/* Sequence number badge */}
                    <span className="absolute top-1 left-1 bg-black/50 text-white text-[10px] font-mono px-1.5 py-0.5 rounded-full backdrop-blur-sm leading-none pointer-events-none z-10">
                      #{idx + 1}
                    </span>
                    <img
                      src={image.blob.getDirectURL()}
                      alt={image.fileName}
                      className="w-full h-auto object-contain"
                      draggable={false}
                    />
                    {/* Tag badges overlay at bottom */}
                    {imageTags.length > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1.5">
                        <div className="flex flex-wrap gap-1">
                          {imageTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full backdrop-blur-sm"
                            >
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete tag dialog */}
      <AlertDialog
        open={!!deletingTagId}
        onOpenChange={(open) => !open && setDeletingTagId(null)}
      >
        <AlertDialogContent data-ocid="admin.tag.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除标签？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该标签将从所有图片中移除，此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.tag.cancel_button">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTag}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.tag.confirm_button"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete image dialog */}
      <AlertDialog
        open={!!deletingImage}
        onOpenChange={(open) => !open && setDeletingImage(null)}
      >
        <AlertDialogContent data-ocid="admin.image.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除图片？</AlertDialogTitle>
            <AlertDialogDescription>
              该图片将被永久删除且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin.image.cancel_button">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteImage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="admin.image.confirm_button"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin lightbox — download & delete buttons live here only */}
      <ImageLightbox
        image={lightboxImage}
        imageIndex={lightboxImageIndex}
        imageTags={lightboxImageTags}
        onClose={() => {
          setLightboxImage(null);
          setLightboxImageIndex(undefined);
        }}
        showWatermark={false}
        isAdmin
        onDownload={handleDownload}
        onDelete={(img) => {
          setLightboxImage(null);
          setLightboxImageIndex(undefined);
          setDeletingImage(img.id);
        }}
      />
    </AdminLayout>
  );
}
