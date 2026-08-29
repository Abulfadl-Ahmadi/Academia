import React, { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, Sparkles, Tag, Info } from "lucide-react";
import { toast } from "sonner";
import {
  getDisplayVersion,
  APP_VERSION,
  GIT_TAG,
  GIT_COMMIT,
  BUILD_DATE,
  copyDiagnosticInfoToClipboard,
} from "@/config/version";
import { subscribeToUpdate, applyAppUpdate } from "@/pwa";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SidebarVersion() {
  const [copied, setCopied] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToUpdate((state) => {
      setHasUpdate(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyDiagnosticInfoToClipboard();
    if (success) {
      setCopied(true);
      toast.success("مشخصات نسخه و سیستم برای پشتیبانی کپی شد", {
        description: `نسخه: ${getDisplayVersion()}`,
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("خطا در کپی مشخصات نسخه");
    }
  };

  const handleUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.info("در حال بارگذاری مجدد و دریافت آخرین نسخه...");
    applyAppUpdate();
  };

  return (
    <div className="w-full flex flex-col gap-1.5 px-2 py-1 mt-1 text-xs select-none">
      {/* Update notification banner if PWA update is available */}
      {hasUpdate && (
        <button
          onClick={handleUpdate}
          type="button"
          className="flex items-center justify-between gap-1.5 w-full px-2.5 py-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 transition-all cursor-pointer group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:justify-center"
          title="بروزرسانی سایت به آخرین نسخه"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <RefreshCw className="size-3.5 shrink-0 animate-spin text-amber-500" />
            <span className="truncate text-[11px] font-medium group-data-[collapsible=icon]:hidden">
              بروزرسانی موجود است
            </span>
          </div>
          <span className="text-[10px] underline underline-offset-2 shrink-0 group-data-[collapsible=icon]:hidden">
            اعمال
          </span>
        </button>
      )}

      {/* Expanded view */}
      <div className="group-data-[collapsible=icon]:hidden flex items-center justify-between text-muted-foreground/70 hover:text-foreground transition-colors px-1 py-1 rounded">
        <div
          onClick={handleCopy}
          className="flex items-center gap-1.5 min-w-0 cursor-pointer overflow-hidden"
          title="برای کپی مشخصات نسخه جهت پشتیبانی کلیک کنید"
        >
          <Tag className="size-3 shrink-0 text-muted-foreground/60" />
          <span className="truncate text-[11px] font-mono font-medium">
            {getDisplayVersion()}
          </span>
        </div>

        <button
          onClick={handleCopy}
          type="button"
          className="shrink-0 p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
          title="کپی مشخصات برای پشتیبانی"
        >
          {copied ? (
            <Check className="size-3 text-emerald-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      </div>

      {/* Collapsed icon mode */}
      <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                type="button"
                className="p-1.5 text-muted-foreground/70 hover:text-foreground hover:bg-sidebar-accent rounded-md transition-colors"
              >
                {copied ? (
                  <Check className="size-3.5 text-emerald-500" />
                ) : (
                  <Info className="size-3.5" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs font-mono">
              <p className="font-sans font-medium mb-0.5">نسخه سامانه</p>
              <p>{getDisplayVersion()}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                کلیک برای کپی مشخصات
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
