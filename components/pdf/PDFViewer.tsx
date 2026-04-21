"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = "/api/pdf-worker";

type PDFViewerProps = {
  filePath: string;
};

export function PDFViewer({ filePath }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
    setError(null);
  }, [filePath]);

  function handleLoadSuccess(document: { numPages: number }) {
    setPageCount(document.numPages);
    setError(null);
  }

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
              onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
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
        ) : (
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
              width={containerWidth > 0 ? Math.min(containerWidth - 2, 820) : 620}
              loading={
                <div className="px-4 py-8 text-sm text-muted-foreground">
                  Rendering page...
                </div>
              }
            />
          </Document>
        )}
      </div>
    </div>
  );
}
