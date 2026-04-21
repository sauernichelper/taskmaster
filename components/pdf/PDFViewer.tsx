"use client";

import dynamic from "next/dynamic";

type PDFViewerProps = {
  filePath: string;
};

const PDFViewerClient = dynamic(
  () =>
    import("@/components/pdf/PDFViewerClient").then(
      (mod) => mod.PDFViewerClient,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-lg border bg-muted/30 px-4 py-8 text-sm text-muted-foreground">
        Loading PDF...
      </div>
    ),
  },
);

export function PDFViewer({ filePath }: PDFViewerProps) {
  return <PDFViewerClient filePath={filePath} />;
}
