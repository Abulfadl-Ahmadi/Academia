import { MathPreview } from "@/components/MathPreview";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Option {
  id: number;
  option_text: string;
  order: number;
}

interface Question {
  id: number;
  public_id: string; // شناسه شش‌کاراکتری امن
  question_text: string;
  difficulty_level: "easy" | "medium" | "hard";
  folders: number[]; // Array of folder IDs
  folders_names: string[]; // Array of folder names
  options: Option[];
  correct_option?: number;
  detailed_solution?: string; // پاسخ تشریحی
  created_at: string;
  updated_at: string;
  is_active: boolean;
  publish_date: string;
  source: string;
}

interface QuestionCardProps {
  question: Question;
  onEdit?: (questionId: number) => void;
  onDelete?: (questionId: number) => void;
  onToggleStatus?: (questionId: number, isActive: boolean) => void;
  showActions?: boolean;
}

export function QuestionCard({
  question,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
}: QuestionCardProps) {
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "easy":
        return "bg-green-500/5 text-green-500 border-green-500/12";
      case "medium":
        return "bg-yellow-500/5 text-yellow-500 border-yellow-500/12";
      case "hard":
        return "bg-red-500/5 text-red-500 border-red-500/12";
      default:
        return "";
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case "easy":
        return "ساده";
      case "medium":
        return "متوسط";
      case "hard":
        return "دشوار";
      default:
        return "نامشخص";
    }
  };

  const renderFolderPath = () => {
    if (!question.folders_names || question.folders_names.length === 0) {
      return <span className="text-muted-foreground text-sm">بدون پوشه</span>;
    }

    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge>
          {question.folders_names[question.folders_names.length - 1]}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="w-64 flex flex-wrap gap-2">
            {question.folders_names.map((folderName, index) => (
              <div key={index} className="items-center text-sm border px-1 bg-accent-foreground/7 rounded">
                {folderName}
              </div>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  // Shared content component for both Dialog and Drawer
  const SolutionContent = () => (
    <div className="space-y-4">
      {/* Question text */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          متن سوال:
        </h4>
        <div className="p-3 bg-muted/50 rounded border">
          <MathPreview text={question.question_text} />
        </div>
      </div>

      {/* Detailed solution */}
      <div>
        <h4 className="font-medium text-sm text-muted-foreground mb-2">
          پاسخ تشریحی:
        </h4>
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-800">
          <MathPreview text={question.detailed_solution || ""} />
        </div>
      </div>
    </div>
  );

  return (
    <Card
      className={`${
        !question.is_active
          ? "opacity-60 border-dashed p-4 gap-2"
          : "p-4 gap-2 "
      }`}
    >
      <CardContent className="p-0">
        {/* Header with metadata */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center mb-4">
          {/* Question ID - نمایش شناسه امن */}
          <Badge variant="outline" className="font-mono text-xs">
            {question.public_id || "N/A"}
          </Badge>

          {/* Folder path */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1">
              {renderFolderPath()}
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <Badge variant={"secondary"}><MathPreview text={question.publish_date || "N/A"}></MathPreview></Badge>
            <Badge variant={"secondary"}><MathPreview text={question.source || "N/A"}></MathPreview></Badge>
            <Badge
              className={`text-xs ${getDifficultyColor(
                question.difficulty_level
              )}`}
            >
              {getDifficultyLabel(question.difficulty_level)}
            </Badge>

            {/* Show Answer Button */}
            {question.detailed_solution &&
              question.detailed_solution.trim() && (
                <>
                  {/* Desktop Dialog */}
                  {!isMobile && (
                    <Dialog
                      open={showSolutionDialog}
                      onOpenChange={setShowSolutionDialog}
                    >
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 ml-1" />
                          نمایش پاسخ
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="!max-w-4xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-right">
                            پاسخ تشریحی سوال {question.public_id}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                          <SolutionContent />
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {/* Mobile Drawer */}
                  {isMobile && (
                    <Drawer
                      open={showSolutionDialog}
                      onOpenChange={setShowSolutionDialog}
                    >
                      <DrawerTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-xs"
                        >
                          <FileText className="h-3 w-3 ml-1" />
                          نمایش پاسخ
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="max-h-[90vh]">
                        <DrawerHeader>
                          <DrawerTitle className="text-right">
                            پاسخ تشریحی سوال {question.public_id}
                          </DrawerTitle>
                        </DrawerHeader>
                        <div className="p-4 overflow-y-auto">
                          <SolutionContent />
                        </div>
                      </DrawerContent>
                    </Drawer>
                  )}
                </>
              )}
          </div>

          {/* Status */}
          {!question.is_active && (
            <Badge variant="secondary" className="text-xs">
              غیرفعال
            </Badge>
          )}

          {/* Actions */}
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(question.id)}>
                    <Edit className="h-4 w-4 ml-2" />
                    ویرایش
                  </DropdownMenuItem>
                )}
                {onToggleStatus && (
                  <DropdownMenuItem
                    onClick={() =>
                      onToggleStatus(question.id, !question.is_active)
                    }
                  >
                    {question.is_active ? (
                      <>
                        <EyeOff className="h-4 w-4 ml-2" />
                        غیرفعال کردن
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 ml-2" />
                        فعال کردن
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(question.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Question text */}
        <div className="mb-4">
          <MathPreview text={question.question_text} />
        </div>

        {/* Options */}
        {question.options && question.options.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {question.options
              .sort((a, b) => a.order - b.order)
              .map((option, index) => (
                <div
                  key={option.id}
                  className={`p-3 rounded-sm flex flex-row justify-start items-center gap-2 border ${
                    question.correct_option === option.id
                      ? "bg-green-500/5 border-green-500/10"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="w-4 text-center font-medium">
                        {["۱)", "۲)", "۳)", "۴)"][index] || `${index + 1})`}
                      </span>
                      {question.correct_option === option.id && (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <MathPreview text={option.option_text} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Footer with timestamps */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t text-xs text-muted-foreground">
          <span>
            ایجاد: {new Date(question.created_at).toLocaleDateString("fa-IR")}
          </span>
          {question.updated_at !== question.created_at && (
            <span>
              بروزرسانی:{" "}
              {new Date(question.updated_at).toLocaleDateString("fa-IR")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
