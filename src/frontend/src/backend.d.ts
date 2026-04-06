import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PaymentConfig {
    alipayBlob?: ExternalBlob;
    wechatBlob?: ExternalBlob;
    priceText: string;
}
export interface WatermarkConfig {
    blob?: ExternalBlob;
    scale: number;
    enabled: boolean;
    positionX: number;
    positionY: number;
}
export type TagId = string;
export interface Tag {
    id: TagId;
    name: string;
    createdAt: bigint;
}
export type ImageId = string;
export interface ContactConfig {
    wechatBlob?: ExternalBlob;
    qqBlob?: ExternalBlob;
    xiaohongshuBlob?: ExternalBlob;
}
export interface AIImage {
    id: ImageId;
    blob: ExternalBlob;
    size: bigint;
    fileName: string;
    tagIds: Array<string>;
    uploadedAt: bigint;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addImage(blob: ExternalBlob, tagIds: Array<string>, fileName: string, size: bigint): Promise<ImageId>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createTag(name: string): Promise<TagId>;
    deleteImage(imageId: ImageId): Promise<void>;
    deleteTag(tagId: TagId): Promise<void>;
    getAllTags(): Promise<Array<Tag>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getContactConfig(): Promise<ContactConfig>;
    getImage(imageId: ImageId): Promise<AIImage>;
    getImageCount(): Promise<bigint>;
    getImagesByTag(tagId: TagId): Promise<Array<AIImage>>;
    getImagesByTags(tagIds: Array<string>): Promise<Array<AIImage>>;
    getLatestImages(limit: bigint): Promise<Array<AIImage>>;
    getPaymentConfig(): Promise<PaymentConfig>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWatermarkConfig(): Promise<WatermarkConfig>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateContactConfig(config: ContactConfig): Promise<void>;
    updatePaymentConfig(config: PaymentConfig): Promise<void>;
    updateWatermarkConfig(config: WatermarkConfig): Promise<void>;
}
