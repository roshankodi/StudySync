"use client";

import { type PdfJs, Worker } from "@react-pdf-viewer/core";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { searchPlugin } from "@react-pdf-viewer/search";
import { highlightPlugin } from "@react-pdf-viewer/highlight";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";
import "@react-pdf-viewer/page-navigation/lib/styles/index.css";
import "@react-pdf-viewer/search/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePdfFullText } from "@/hooks/use-pdf-full-text";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const Viewer = dynamic(
  () => import("@react-pdf-viewer/core").then((mod) => mod.Viewer),
  { ssr: false },
);

interface PdfViewerProps {
  fileUrl?: string;
  textToHighlight: string;
  initialPage?: number;
  fileId?: string;
}

export function PdfViewer({
  fileUrl,
  textToHighlight = "An artificial Intelligence",
  initialPage,
  fileId,
}: PdfViewerProps) {
  const [isLoadingDocument, setIsLoadingDocument] = useState(true);
  const [activeTab, setActiveTab] = useState<"fulltext" | "pdf">("fulltext");
  const pdfUrl =
    fileUrl ??
    process.env.NEXT_PUBLIC_SUPABASE_URL +
      "/storage/v1/object/public/files/1758031653771-we8l23-Patent_US8126832.pdf";

  const {
    data: fullTextData,
    loading: fullTextLoading,
    error: fullTextError,
  } = usePdfFullText(fileId ?? null);

  const pdfRef = useRef<PdfJs.PdfDocument>(null);
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  const pageNavigationPluginInstance = pageNavigationPlugin();
  const searchPluginInstance = searchPlugin();
  const highlightPluginInstance = highlightPlugin();

  const searchAndHighlight = useCallback(
    async (searchText: string) => {
      if (!searchText || !pdfRef.current) return;

      const doc = pdfRef.current;
      let targetPage;
      const escapedText = searchText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const multilineRegex = new RegExp(
        escapedText.replace(/\s+/g, "\\s*[\\r\\n]*\\s*"),
        "gi",
      );
      console.log("multilineRegex", multilineRegex);
      if (initialPage) {
        targetPage = initialPage;
      } else {
        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          const page = await doc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item) => item.str).join(" ");

          if (multilineRegex.test(pageText)) {
            targetPage = pageNum;
            break;
          }
        }
      }
      console.log("targetPage ", targetPage, searchText);
      if (targetPage) {
        pageNavigationPluginInstance.jumpToPage(targetPage - 1);
        void searchPluginInstance.highlight(multilineRegex);
      }
    },
    [initialPage, pageNavigationPluginInstance, searchPluginInstance],
  );

  useEffect(() => {
    if (isLoadingDocument) return;

    void searchAndHighlight(textToHighlight);
  }, [isLoadingDocument, textToHighlight]);

  const renderFormattedText = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];
    let paragraphBuffer: string[] = [];

    const flushParagraph = (index: number) => {
      if (paragraphBuffer.length === 0) return;

      const paragraphText = paragraphBuffer.join(" ").trim();
      if (!paragraphText) {
        paragraphBuffer = [];
        return;
      }

      if (
        textToHighlight &&
        paragraphText.toLowerCase().includes(textToHighlight.toLowerCase())
      ) {
        const regex = new RegExp(
          `(${textToHighlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          "gi",
        );
        const parts = paragraphText.split(regex);

        elements.push(
          <p
            key={`para-${index}`}
            className="mb-8 text-[15px] leading-[1.8] tracking-[0.01em] text-gray-800 dark:text-gray-200"
          >
            {parts.map((part, partIndex) => {
              if (part.toLowerCase() === textToHighlight.toLowerCase()) {
                return (
                  <mark
                    key={partIndex}
                    className="rounded-sm bg-blue-100 px-1 py-0.5 font-medium text-blue-900 dark:bg-blue-900/40 dark:text-blue-200"
                  >
                    {part}
                  </mark>
                );
              }
              return part;
            })}
          </p>,
        );
      } else {
        elements.push(
          <p
            key={`para-${index}`}
            className="mb-8 text-[15px] leading-[1.8] tracking-[0.01em] text-gray-800 dark:text-gray-200"
          >
            {paragraphText}
          </p>,
        );
      }

      paragraphBuffer = [];
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;

      const pageMarkerMatch = /^--- Page (\d+) ---$/.exec(line);
      if (pageMarkerMatch) {
        flushParagraph(i);

        const pageNum = pageMarkerMatch[1];
        elements.push(
          <div key={`page-${pageNum}-${i}`} className="my-16 flex items-center">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
            <div className="mx-6 flex items-center space-x-2 rounded-full border border-gray-200 bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Page {pageNum}</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
          </div>,
        );
        continue;
      }

      if (line.trim() === "") {
        flushParagraph(i);
        continue;
      }

      paragraphBuffer.push(line.trim());
    }

    flushParagraph(lines.length);

    return elements;
  };

  return (
    <div className="flex h-full w-full flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <Button
          variant={activeTab === "fulltext" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("fulltext")}
          className={`rounded-none border-b-2 px-6 py-3 font-medium transition-all ${
            activeTab === "fulltext"
              ? "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-400"
              : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          }`}
        >
          📄 Full Text
        </Button>
        <Button
          variant={activeTab === "pdf" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("pdf")}
          className={`rounded-none border-b-2 px-6 py-3 font-medium transition-all ${
            activeTab === "pdf"
              ? "border-blue-600 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-400"
              : "border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          }`}
        >
          📋 PDF Viewer
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900">
        {activeTab === "fulltext" ? (
          <div className="h-full bg-gray-50 dark:bg-gray-950">
            {fullTextLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
                  <p className="text-muted-foreground">
                    Loading document text...
                  </p>
                </div>
              </div>
            ) : fullTextError ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-destructive text-center">
                  <p className="mb-2">Failed to load document text</p>
                  <p className="text-muted-foreground text-sm">
                    {fullTextError}
                  </p>
                </div>
              </div>
            ) : fullTextData ? (
              <ScrollArea className="h-full">
                <div className="mx-auto max-w-3xl px-8 py-8">
                  <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-700">
                    <h1 className="mb-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
                      {fullTextData.fileName}
                    </h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>{fullTextData.pageCount} pages</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <svg
                          className="h-4 w-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>Full text extracted</span>
                      </span>
                    </div>
                  </div>
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <div className="text-content space-y-2">
                      {renderFormattedText(fullTextData.fullText)}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">No document selected</p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full">
            <Worker
              workerUrl={`https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js`}
            >
              <div className="h-full">
                <Viewer
                  onDocumentLoad={(e) => {
                    setIsLoadingDocument(false);
                    pdfRef.current = e.doc;
                  }}
                  fileUrl={pdfUrl}
                  plugins={[
                    defaultLayoutPluginInstance,
                    pageNavigationPluginInstance,
                    searchPluginInstance,
                    highlightPluginInstance,
                  ]}
                />
              </div>
            </Worker>
          </div>
        )}
      </div>
    </div>
  );
}
