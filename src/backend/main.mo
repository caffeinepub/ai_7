import Text "mo:core/Text";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Array "mo:core/Array";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";



actor {
  include MixinStorage();

  // Types
  type TagId = Text;
  type ImageId = Text;

  // Data Types
  public type Tag = {
    id : TagId;
    name : Text;
    createdAt : Int;
  };

  public type AIImage = {
    id : ImageId;
    blob : Storage.ExternalBlob;
    tagIds : [Text];
    fileName : Text;
    uploadedAt : Int;
    size : Nat;
  };

  public type WatermarkConfig = {
    blob : ?Storage.ExternalBlob;
    scale : Float;
    positionX : Float;
    positionY : Float;
    enabled : Bool;
  };

  public type PaymentConfig = {
    wechatBlob : ?Storage.ExternalBlob;
    alipayBlob : ?Storage.ExternalBlob;
    priceText : Text;
  };

  public type ContactConfig = {
    qqBlob : ?Storage.ExternalBlob;
    wechatBlob : ?Storage.ExternalBlob;
    xiaohongshuBlob : ?Storage.ExternalBlob;
  };

  public type UserProfile = {
    name : Text;
  };

  // Data Structures
  let images = Map.empty<ImageId, AIImage>();
  let tags = Map.empty<TagId, Tag>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // Access control state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Watermark config
  var watermarkConfig : WatermarkConfig = {
    blob = null;
    scale = 1.0;
    positionX = 50.0;
    positionY = 50.0;
    enabled = false;
  };

  // Payment config
  var paymentConfig : PaymentConfig = {
    wechatBlob = null;
    alipayBlob = null;
    priceText = "5元/张";
  };

  // Contact config
  var contactConfig : ContactConfig = {
    qqBlob = null;
    wechatBlob = null;
    xiaohongshuBlob = null;
  };

  // Helper Functions
  func compareByCreatedAt(a : Tag, b : Tag) : Order.Order {
    Int.compare(b.createdAt, a.createdAt);
  };

  func compareByUploadedAt(a : AIImage, b : AIImage) : Order.Order {
    Int.compare(b.uploadedAt, a.uploadedAt);
  };

  func hasAllTags(imageTags : [Text], requiredTags : [Text]) : Bool {
    requiredTags.all(
      func(tag) {
        imageTags.any(func(imageTag) { imageTag == tag });
      }
    );
  };

  // Tag Management
  public shared func createTag(name : Text) : async TagId {
    if (name.size() == 0) {
      Runtime.trap("Tag name cannot be empty");
    };

    let id = name.concat("_" # Time.now().toText());
    let newTag : Tag = {
      id;
      name;
      createdAt = Time.now();
    };
    tags.add(id, newTag);
    id;
  };

  public shared func deleteTag(tagId : TagId) : async () {
    if (not tags.containsKey(tagId)) {
      Runtime.trap("Tag not found");
    };
    tags.remove(tagId);
  };

  public query func getAllTags() : async [Tag] {
    let allTags = tags.values().toArray();
    allTags.sort<Tag>(compareByCreatedAt);
  };

  // Image Management
  public shared func addImage(blob : Storage.ExternalBlob, tagIds : [Text], fileName : Text, size : Nat) : async ImageId {
    if (tagIds.size() == 0 or tagIds.size() > 3) {
      Runtime.trap("Images must have 1-3 tags");
    };

    let id = fileName.concat("_" # Time.now().toText());
    let newImage : AIImage = {
      id;
      blob;
      tagIds;
      fileName;
      uploadedAt = Time.now();
      size;
    };
    images.add(id, newImage);
    id;
  };

  public shared func deleteImage(imageId : ImageId) : async () {
    images.remove(imageId);
  };

  public query func getImage(imageId : ImageId) : async AIImage {
    switch (images.get(imageId)) {
      case (null) { Runtime.trap("Image not found") };
      case (?image) { image };
    };
  };

  public query func getImagesByTag(tagId : TagId) : async [AIImage] {
    let allImages = images.values().toArray();
    let filtered = allImages.filter(
      func(i : AIImage) : Bool {
        i.tagIds.any(func(t) { t == tagId });
      }
    );
    filtered.sort<AIImage>(compareByUploadedAt);
  };

  public query func getImagesByTags(tagIds : [Text]) : async [AIImage] {
    let allImages = images.values().toArray();
    let filtered = allImages.filter(
      func(i : AIImage) : Bool {
        hasAllTags(i.tagIds, tagIds);
      }
    );
    filtered.sort<AIImage>(compareByUploadedAt);
  };

  public query func getLatestImages(limit : Nat) : async [AIImage] {
    let allImages = images.values().toArray();
    let sorted = allImages.sort(compareByUploadedAt);
    Array.tabulate<AIImage>(
      if (sorted.size() < limit) { sorted.size() } else { limit },
      func(i) { sorted[i] },
    );
  };

  public query func getImageCount() : async Nat {
    images.size();
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  // Configuration Management
  public query func getWatermarkConfig() : async WatermarkConfig {
    watermarkConfig;
  };

  public shared func updateWatermarkConfig(config : WatermarkConfig) : async () {
    watermarkConfig := config;
  };

  public query func getPaymentConfig() : async PaymentConfig {
    paymentConfig;
  };

  public shared func updatePaymentConfig(config : PaymentConfig) : async () {
    paymentConfig := config;
  };

  public query func getContactConfig() : async ContactConfig {
    contactConfig;
  };

  public shared func updateContactConfig(config : ContactConfig) : async () {
    contactConfig := config;
  };
};
