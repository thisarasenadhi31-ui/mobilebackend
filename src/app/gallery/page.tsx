import Image from "next/image";
import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { MissingTableNotice, Notice } from "@/components/notice";
import { ImageViewer } from "@/components/image-viewer";
import { DownloadIcon } from "@/components/icons";
import { getGalleryItems, type GalleryItem } from "@/lib/data/gallery";
import { getMobilePhotos, type MobilePhoto } from "@/lib/data/photos";
import { getMobileImages, type MobileImage } from "@/lib/data/images";
import { formatBytes, formatDate } from "@/lib/format";
import { isOptimizableImage } from "@/lib/images";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Images published to the mobile app's photo gallery.",
};

export default async function GalleryPage() {
  const [galleryResult, photosResult, imagesResult] = await Promise.all([
    getGalleryItems(),
    getMobilePhotos(),
    getMobileImages(),
  ]);

  const galleryRows = galleryResult.status === "ok" ? galleryResult.rows : [];
  const photoRows = photosResult.status === "ok" ? photosResult.rows : [];
  const imageRows = imagesResult.status === "ok" ? imagesResult.rows : [];
  const anyRows = galleryRows.length + photoRows.length + imageRows.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Gallery"
        description="Images published to the mobile app's photo gallery."
        action={
          galleryResult.status === "ok" ||
          photosResult.status === "ok" ||
          imagesResult.status === "ok" ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {anyRows} images
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
      ) : galleryRows.length === 0 ? null : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Published Gallery</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryRows.map((item) => (
              <GalleryCard key={item.id} item={item} />
            ))}
          </ul>
        </div>
      )}

      {/* Uploaded Images Section — POST /api/images/upload */}
      {imagesResult.status === "missing-table" ? (
        <MissingTableNotice table={imagesResult.table} />
      ) : imagesResult.status === "error" ? (
        <Notice tone="danger" title="Couldn't load uploaded images">
          {imagesResult.message}
        </Notice>
      ) : imageRows.length === 0 ? null : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Uploaded Images</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {imageRows.map((image) => (
              <MobileImageCard key={image.id} image={image} />
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
      ) : anyRows === 0 ? (
        <Notice title="No images yet">
          Photos synced or uploaded from the mobile app will appear here.
        </Notice>
      ) : photoRows.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Synced Mobile Photos</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photoRows.map((photo) => (
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
          // A row can hold any URL. Optimizing an unconfigured host throws and
          // takes the page down with it, so serve those as-is instead.
          unoptimized={!isOptimizableImage(image_url)}
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

function MobileImageCard({ image }: { image: MobileImage }) {
  const { url, downloadUrl, filename, filesize, created_at } = image;

  return (
    <li className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative aspect-square bg-zinc-100 dark:bg-zinc-800">
        <ImageViewer
          src={url}
          downloadUrl={downloadUrl}
          filename={filename}
          filesize={filesize}
        >
          <Image
            src={url}
            alt={filename}
            fill
            sizes="(min-width: 1024px) 320px, (min-width: 640px) 45vw, 90vw"
            className="object-cover"
            unoptimized={!isOptimizableImage(url)}
          />
        </ImageViewer>
      </div>

      <div className="space-y-1 p-4">
        <h3 className="truncate text-sm font-semibold" title={filename}>
          {filename}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {formatBytes(filesize)}
        </p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <time
            dateTime={created_at}
            className="text-xs text-zinc-500 dark:text-zinc-400"
          >
            {formatDate(created_at)}
          </time>
          <a
            href={downloadUrl}
            download={filename}
            aria-label={`Download ${filename}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <DownloadIcon className="size-3.5" />
            Download
          </a>
        </div>
      </div>
    </li>
  );
}

function MobilePhotoCard({ photo }: { photo: MobilePhoto }) {
  const { display_name, synced_at, size } = photo;

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
          {formatBytes(size)}
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
