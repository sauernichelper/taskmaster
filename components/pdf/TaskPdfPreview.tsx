"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";

type TaskPdfPreviewProps = {
  filePath: string;
};

type ReactPdfComponents = Pick<typeof import("react-pdf"), "Document" | "Page">;

export function TaskPdfPreview({ filePath }: TaskPdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pdfComponents, setPdfComponents] =
    useState<ReactPdfComponents | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let mounted = true;

    void import("react-pdf")
      .then(({ Document, Page, pdfjs }) => {
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

        if (mounted) {
          setPdfComponents({ Document, Page });
        }
      })
      .catch(() => {
        if (mounted) {
          setError("Unable to load this PDF.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("ResizeObserver" in window)) {
      return;
    }

    const element = containerRef.current;

    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });

    resizeObserver.observe(element);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setPageNumber(1);
    setPageCount(0);
    setError(null);
  }, [filePath]);

  function handleLoadSuccess(document: { numPages: number }) {
    setPageCount(document.numPages);
    setError(null);
  }

  const Document = pdfComponents?.Document;
  const Page = pdfComponents?.Page;

  return (
    <div ref={containerRef} className="grid gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <FileText className="size-4" />
          PDF preview
        </div>

        {pageCount > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Previous PDF page"
              disabled={pageNumber <= 1}
              onClick={() =>
                setPageNumber((current) => Math.max(1, current - 1))
              }
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="min-w-16 text-center text-xs text-muted-foreground">
              {pageNumber} / {pageCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Next PDF page"
              disabled={pageNumber >= pageCount}
              onClick={() =>
                setPageNumber((current) => Math.min(pageCount, current + 1))
              }
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-lg border bg-muted/30">
        {error ? (
          <div className="px-4 py-8 text-sm text-destructive">{error}</div>
        ) : Document && Page ? (
          <Document
            file={filePath}
            loading={
              <div className="px-4 py-8 text-sm text-muted-foreground">
                Loading PDF...
              </div>
            }
            error={
              <div className="px-4 py-8 text-sm text-destructive">
                Unable to load this PDF.
              </div>
            }
            onLoadError={() => setError("Unable to load this PDF.")}
            onLoadSuccess={handleLoadSuccess}
          >
            <Page
              pageNumber={pageNumber}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              width={
                containerWidth > 0 ? Math.min(containerWidth - 2, 820) : 620
              }
              loading={
                <div className="px-4 py-8 text-sm text-muted-foreground">
                  Rendering page...
                </div>
              }
            />
          </Document>
        ) : (
          <div className="px-4 py-8 text-sm text-muted-foreground">
            Loading PDF...
          </div>
        )}
      </div>
    </div>
  );
}
