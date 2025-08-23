import React, { useState } from 'react';
import { Worker, Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
// PDF styles are loaded from index.html
import '@/utils/pdf-styles';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import { zoomPlugin } from '@react-pdf-viewer/zoom';
import { ChevronRight, ChevronLeft, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  fileUrl,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const zoomPluginInstance = zoomPlugin();

  const { CurrentScale, ZoomIn: ZoomInButton, ZoomOut: ZoomOutButton } = zoomPluginInstance;
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    GoToPreviousPage({});
                    if (currentPage > 0) {
                      onPageChange(currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>صفحه قبلی</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <span className="font-medium text-sm mx-2">
            <CurrentPageLabel>
              {(props) => (
                <span>
                  صفحه {props.currentPage + 1} از {totalPages}
                </span>
              )}
            </CurrentPageLabel>
          </span>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    GoToNextPage({});
                    if (currentPage < totalPages - 1) {
                      onPageChange(currentPage + 1);
                    }
                  }}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>صفحه بعدی</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => ZoomOutButton({})}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>کوچک‌نمایی</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <CurrentScale>
            {(props) => (
              <span className="text-sm font-mono w-16 text-center">
                {Math.round(props.scale * 100)}%
              </span>
            )}
          </CurrentScale>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => ZoomInButton({})}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>بزرگ‌نمایی</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
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
          <div style={{ height: '100%' }}>
            <Viewer
              fileUrl={fileUrl}
              plugins={[pageNavigationPluginInstance, zoomPluginInstance]}
              defaultScale={SpecialZoomLevel.PageFit}
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
