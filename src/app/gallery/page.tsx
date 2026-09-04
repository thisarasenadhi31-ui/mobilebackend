import Image from "next/image";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MissingTableNotice, Notice } from "@/components/notice";
import { getGalleryItems, type GalleryItem } from "@/lib/data/gallery";
import { getMobilePhotos, type MobilePhoto } from "@/lib/data/photos";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Images published to the mobile app's photo gallery.",
};

export default async function GalleryPage() {
  const [galleryResult, photosResult] = await Promise.all([
    getGalleryItems(),
    getMobilePhotos(),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gallery"
        description="Images published to the mobile app's photo gallery."
        action={
          (galleryResult.status === "ok" || photosResult.status === "ok") ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {(galleryResult.status === "ok" ? galleryResult.rows.length : 0) +
                (photosResult.status === "ok" ? photosResult.rows.length : 0)}{" "}
              images
            </span>
          ) : null
        }
      />

      {/* Gallery Items Section */}
      {galleryResult.status === "missing-table" ? (
        <MissingTableNotice table={galleryResult.table} />
      ) : galleryResult.status === "error" ? (
        <Notice tone="danger" title="Couldn't load the gallery">
          {galleryResult.message}
        </Notice>
      ) : galleryResult.rows.length === 0 ? null : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Published Gallery</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryResult.rows.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </ul>
        </div>
      )}

      {/* Mobile Photos Section */}
      {photosResult.status === "missing-table" ? (
        <MissingTableNotice table={photosResult.table} />
      ) : photosResult.status === "error" ? (
        <Notice tone="danger" title="Couldn't load mobile photos">
          {photosResult.message}
        </Notice>
      ) : photosResult.rows.length === 0 && galleryResult.rows.length === 0 ? (
        <Notice title="No images yet">
          Photos synced from the mobile app will appear here.
        </Notice>
      ) : photosResult.rows.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Synced Mobile Photos</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photosResult.rows.map((photo) => (
              <MobilePhotoCard key={photo.id} photo={photo} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function GalleryCard({ item }: { item: GalleryItem }) {
  const { title, caption, image_url, created_at } = item;

  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={image_url}
          alt={title}
          fill
          sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
          className="object-cover"
        />
      </div>

      <div className="space-y-1 p-4">
        <h2 className="truncate text-sm font-semibold" title={title}>
          {title}
        </h2>
        {caption ? (
          <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
            {caption}
          </p>
        ) : null}
        <time
          dateTime={created_at}
          className="block text-xs text-zinc-500 dark:text-zinc-400"
        >
          {formatDate(created_at)}
        </time>
      </div>
    </li>
  );
}

function MobilePhotoCard({ photo }: { photo: MobilePhoto }) {
  const { display_name, synced_at, size } = photo;
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);

  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-40 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700">
        <div className="text-center">
          <div className="text-2xl">📱</div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Photo</p>
        </div>
      </div>

      <div className="space-y-1 p-4">
        <h3 className="truncate text-sm font-semibold" title={display_name}>
          {display_name}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {sizeInMB} MB
        </p>
        <time
          dateTime={synced_at}
          className="block text-xs text-zinc-500 dark:text-zinc-400"
        >
          {formatDate(synced_at)}
        </time>
      </div>
    </li>
  );
}
