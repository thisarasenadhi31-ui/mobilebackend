"use client";

import { useCallback, useRef, useState } from "react";
import { CloseIcon, DownloadIcon } from "@/components/icons";
import { formatBytes } from "@/lib/format";

/**
 * Click-to-enlarge wrapper around a thumbnail.
 *
 * Built on the native <dialog>, so Escape-to-close, focus trapping and the
 * backdrop come from the platform rather than from scroll-locking hand-rolled
 * state. `children` is the thumbnail to render in the grid.
 */
export function ImageViewer({
  src,
  downloadUrl,
  filename,
  filesize,
  children,
}: {
  src: string;
  downloadUrl: string;
  filename: string;
  filesize: number;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);

  // The full-size image is only mounted once the dialog has been opened. A
  // closed <dialog> is display:none, but the browser still fetches any <img>
  // inside it — which would pull every original on page load.
  const [opened, setOpened] = useState(false);

  const open = useCallback(() => {
    setOpened(true);
    dialog.current?.showModal();
  }, []);

  // A click's target is the dialog itself only when it landed on the backdrop;
  // anywhere inside the content hits a descendant.
  const closeOnBackdrop = useCallback(
    (event: React.MouseEvent<HTMLDialogElement>) => {
      if (event.target === dialog.current) dialog.current?.close();
    },
    []
  );

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-label={`View ${filename} full size`}
        className="absolute inset-0 cursor-zoom-in focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      >
        {children}
      </button>

      <dialog
        ref={dialog}
        onClick={closeOnBackdrop}
        className="m-auto max-h-[92dvh] max-w-[92vw] rounded-xl bg-white p-0 text-zinc-900 backdrop:bg-black/70 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 p-3 dark:border-zinc-800">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold" title={filename}>
              {filename}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatBytes(filesize)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={downloadUrl}
              download={filename}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <DownloadIcon className="size-4" />
              Download
            </a>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="rounded-lg border border-zinc-200 p-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
        </div>

        {/*
          Plain <img>: the dialog shows the original at whatever size it happens
          to be, and next/image needs intrinsic dimensions the database doesn't
          store.
        */}
        {opened ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={filename}
            className="max-h-[78dvh] max-w-[92vw] object-contain"
          />
        ) : (
          <div className="h-40 w-80 max-w-[92vw]" />
        )}
      </dialog>
    </>
  );
}
