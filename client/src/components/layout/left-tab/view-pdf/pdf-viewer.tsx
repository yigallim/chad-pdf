import { useCallback, useRef, useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import { Button, Spin, Typography } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { cn, withPdfPath } from "@/libs/utils";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useResizeObserver } from "@wojtekmaj/react-hooks";
import PDFControls from "./pdf-controls";
import options from "@/libs/pdf-constant";

type PDFViewerProps = {
  pdfId: string;
  filename: string;
  onBack: () => void;
  maxWidth: number;
  initialPage?: number | null;
  onPageNavigated?: () => void;
};

const PDFViewer = ({
  pdfId,
  filename,
  onBack,
  maxWidth,
  initialPage,
  onPageNavigated,
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerRef, setContainerRef] = useState<HTMLElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(maxWidth);
  const [scale, setScale] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [observerActive, setObserverActive] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const entry = entries[0];
    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef, {}, onResize);

  function onDocumentLoadSuccess(pdf: PDFDocumentProxy): void {
    setNumPages(pdf.numPages);
    setCurrentPage(1);
    setObserverActive(false);
    pageRefs.current = pageRefs.current.slice(0, pdf.numPages);
  }

  const width = containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth;

  const zoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.1, 1.5));
  };

  const zoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.1, 0.75));
  };

  const resetZoom = () => {
    setScale(1);
  };

  const handlePageChange = useCallback(
    (value: number | null, scroll: boolean = true) => {
      if (value && value >= 1 && value <= numPages) {
        setCurrentPage((prevPage) => {
          if (prevPage === value) return prevPage;

          if (scroll) {
            const pageDiv = pageRefs.current[value - 1];
            if (pageDiv && containerRef) {
              requestAnimationFrame(() => {
                console.log("Page div height:", pageDiv.offsetHeight);
                console.log("Container scrollTop:", containerRef.scrollTop);

                pageDiv.scrollIntoView({ behavior: "smooth", block: "start" });
              });
            }
          }
          return value;
        });
      }
    },
    [numPages, containerRef]
  );

  useEffect(() => {
    if (numPages === 0) return;

    let activationTimer: NodeJS.Timeout | null = null;

    if (initialPage && initialPage >= 1 && initialPage <= numPages) {
      handlePageChange(initialPage, true);

      activationTimer = setTimeout(() => {
        setObserverActive(true);
        if (onPageNavigated) {
          onPageNavigated();
        }
      }, 500);
    } else {
      setObserverActive(true);
    }

    return () => {
      if (activationTimer) {
        clearTimeout(activationTimer);
      }
    };
  }, [initialPage, numPages, handlePageChange, onPageNavigated]);

  useEffect(() => {
    if (!observerActive || !containerRef || numPages === 0) {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }

    observerRef.current = new window.IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visibleEntries.length > 0) {
          const pageIndex = Number(visibleEntries[0].target.getAttribute("data-page-index"));
          if (!isNaN(pageIndex)) {
            const newPage = pageIndex + 1;

            setCurrentPage((prevPage) => (newPage !== prevPage ? newPage : prevPage));
          }
        }
      },
      {
        root: containerRef,
        threshold: 0.5,
      }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observerRef.current?.observe(ref);
    });

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [observerActive, containerRef, numPages, scale]);

  return (
    <div className="flex flex-col h-full w-full relative">
      <Button
        onClick={onBack}
        type="default"
        color="primary"
        variant="dashed"
        className="absolute! shadow-md! w-min bottom-24 left-6 z-10"
        icon={<LogoutOutlined />}
      >
        Back
      </Button>
      <div
        className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-auto max-w-full"
        ref={setContainerRef}
      >
        <Document
          file={withPdfPath(pdfId)}
          onLoadSuccess={onDocumentLoadSuccess}
          options={options}
          loading={
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              <Spin size="large" />
            </div>
          }
          noData={
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              No PDF File Specified
            </div>
          }
          error={
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
              <Typography.Text type="danger">Failed to load PDF</Typography.Text>
            </div>
          }
        >
          {Array.from(new Array(numPages), (_, index) => (
            <div
              key={`page_${index + 1}`}
              className={cn(index == 0 && "mt-4", "mb-4 mx-auto w-min px-6")}
              ref={(el) => (pageRefs.current[index] = el)}
              data-page-index={index}
            >
              <div className="inline-block">
                <Page
                  pageNumber={index + 1}
                  width={width * scale}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  className="shadow-md"
                />
              </div>
            </div>
          ))}
        </Document>
      </div>
      <PDFControls
        filename={filename}
        currentPage={currentPage}
        numPages={numPages}
        scale={scale}
        onPageChange={(value) => handlePageChange(value, true)}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
      />
    </div>
  );
};

export default PDFViewer;
