import React, { useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
// PDF styles are loaded from index.html
import '@/utils/pdf-styles';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { ChevronRight, ChevronLeft, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
  onDocumentLoad?: (totalPages: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  currentPage,
  totalPages,
  onPageChange,
  onDocumentLoad,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();

  const { CurrentScale, ZoomIn, ZoomOut } = zoomPluginInstance;
  const { CurrentPageLabel, GoToNextPage, GoToPreviousPage } = pageNavigationPluginInstance;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex justify-between items-center p-3 border-b dark:border-gray-700">
        <div className="flex items-center space-x-2 space-x-reverse">
          <GoToPreviousPage>
            {(props) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={props.onClick}
                      disabled={currentPage === 0}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>صفحه قبلی</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </GoToPreviousPage>
          
          <span className="font-medium text-sm mx-2">
            <CurrentPageLabel>
              {(props) => (
                <span>
                  صفحه {props.currentPage + 1} از {totalPages}
                </span>
              )}
            </CurrentPageLabel>
          </span>
          
          <GoToNextPage>
            {(props) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={props.onClick}
                      disabled={currentPage === totalPages - 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>صفحه بعدی</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </GoToNextPage>
        </div>

        <div className="flex items-center space-x-2">
          <ZoomOut>
            {(props) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={props.onClick}>
                      <ZoomOutIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>کوچک‌نمایی</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </ZoomOut>
          
          <CurrentScale>
            {(props) => (
              <span className="text-sm font-mono w-16 text-center">
                {Math.round(props.scale * 100)}%
              </span>
            )}
          </CurrentScale>
          
          <ZoomIn>
            {(props) => (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={props.onClick}>
                      <ZoomInIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>بزرگ‌نمایی</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </ZoomIn>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFullscreen ? 'خروج از حالت تمام‌صفحه' : 'حالت تمام‌صفحه'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
          <div className="h-full">
            <Viewer
              fileUrl={fileUrl}
              plugins={[pageNavigationPluginInstance, zoomPluginInstance]}
              defaultScale={SpecialZoomLevel.PageFit}
              onDocumentLoad={(e) => {
                onDocumentLoad?.(e.doc.numPages);
              }}
              onPageChange={(e) => {
                onPageChange(e.currentPage);
              }}
            />
          </div>
        </Worker>
      </div>
    </div>
  );
};
