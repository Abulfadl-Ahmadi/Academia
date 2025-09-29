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
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axiosInstance from "@/lib/axios";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

// Component for rendering images (handles both regular images and SVG)
const ImageRenderer: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [isSvg, setIsSvg] = useState(false);

  useEffect(() => {
    // Check if the URL ends with .svg (ignoring query parameters)
    const urlWithoutParams = src.split('?')[0].toLowerCase();
    const isSvgFile = urlWithoutParams.endsWith('.svg');

    if (isSvgFile) {
      setIsSvg(true);
      // Fetch SVG content
      fetch(src)
        .then(response => response.text())
        .then(content => {
          // Basic validation that it's actually SVG
          if (content.includes('<svg')) {
            // Modify SVG to be theme-aware by adding CSS classes
            const modifiedContent = content
              // Add class to SVG element for theme styling
              .replace('<svg', '<svg class="theme-aware-svg"')
              // Replace black strokes with theme-aware colors
              .replace(/stroke="black"/g, 'stroke="currentColor"')
              .replace(/stroke="#000"/g, 'stroke="currentColor"')
              .replace(/stroke="#000000"/g, 'stroke="currentColor"')
              // Replace black fills with theme-aware colors
              .replace(/fill="black"/g, 'fill="currentColor"')
              .replace(/fill="#000"/g, 'fill="currentColor"')
              .replace(/fill="#000000"/g, 'fill="currentColor"')
              // Replace black colors in CSS styles
              .replace(/stroke:black/g, 'stroke:currentColor')
              .replace(/fill:black/g, 'fill:currentColor')
              .replace(/stroke:#000/g, 'stroke:currentColor')
              .replace(/stroke:#000000/g, 'stroke:currentColor')
              .replace(/fill:#000/g, 'fill:currentColor')
              .replace(/fill:#000000/g, 'fill:currentColor');

            setSvgContent(modifiedContent);
          } else {
            // Fallback to img tag if not valid SVG
            setIsSvg(false);
          }
        })
        .catch(() => {
          // Fallback to img tag on error
          setIsSvg(false);
        });
    } else {
      setIsSvg(false);
    }
  }, [src]);

  if (isSvg && svgContent) {
    return (
      <div
        className={`${className} flex items-center justify-center text-foreground`}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
    />
  );
};

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
  images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    order: number;
  }>;
  detailed_solution_images?: Array<{
    id: number;
    image: string;
    alt_text?: string;
    order: number;
  }>;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  publish_date: string;
  source: string;
}

interface Test {
  id: number;
  name: string;
  description: string;
  test_type: string;
  collection?: {
    id: number;
    name: string;
    created_by_name: string;
  };
}

interface QuestionCardProps {
  question: Question;
  onEdit?: (questionId: number) => void;
  onDelete?: (questionId: number) => void;
  onToggleStatus?: (questionId: number, isActive: boolean) => void;
  showActions?: boolean;
  selectable?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

export function QuestionCard({
  question,
  onEdit,
  onDelete,
  onToggleStatus,
  showActions = true,
  selectable = false,
  isSelected = false,
  onSelectionChange,
}: QuestionCardProps) {
  const [showSolutionDialog, setShowSolutionDialog] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showAddToExamDrawer, setShowAddToExamDrawer] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const fetchTests = async () => {
    try {
      setLoadingTests(true);
      const response = await axiosInstance.get("/tests/");
      
      // Handle both paginated and non-paginated responses
      let testsData: Test[] = [];
      if (Array.isArray(response.data)) {
        testsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        testsData = response.data.results;
      } else {
        console.warn("Unexpected API response structure:", response.data);
        testsData = [];
      }
      
      setTests(testsData);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("خطا در بارگیری آزمون‌ها");
      setTests([]); // Ensure tests is always an array
    } finally {
      setLoadingTests(false);
    }
  };

  const addQuestionToTests = async () => {
    if (selectedTests.length === 0) {
      toast.error("لطفاً حداقل یک آزمون انتخاب کنید");
      return;
    }

    try {
      // For each selected test, get current questions and add the new one
      const promises = selectedTests.map(async (testId) => {
        // First get the current test data
        const testResponse = await axiosInstance.get(`/tests/${testId}/`);
        const currentTest = testResponse.data;
        
        // Get current question IDs
        const currentQuestionIds = currentTest.questions || [];
        
        // Add the new question if not already present
        if (!currentQuestionIds.includes(question.id)) {
          const updatedQuestionIds = [...currentQuestionIds, question.id];
          
          // Update the test with the new questions list
          return axiosInstance.patch(`/tests/${testId}/update`, {
            questions: updatedQuestionIds
          });
        }
        
        return Promise.resolve(); // Question already in test
      });

      await Promise.all(promises);
      toast.success(`سوال به ${selectedTests.length} آزمون اضافه شد`);
      setShowAddToExamDrawer(false);
      setSelectedTests([]);
    } catch (error) {
      console.error("Error adding question to tests:", error);
      toast.error("خطا در اضافه کردن سوال به آزمون‌ها");
    }
  };

  const handleTestSelection = (testId: number, checked: boolean) => {
    if (checked) {
      setSelectedTests(prev => [...prev, testId]);
    } else {
      setSelectedTests(prev => prev.filter(id => id !== testId));
    }
  };

  useEffect(() => {
    if (showAddToExamDrawer) {
      fetchTests();
    }
  }, [showAddToExamDrawer]);

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
        
        {/* Detailed solution images */}
        {question.detailed_solution_images && question.detailed_solution_images.length > 0 && (
          <div className="mt-4">
            <h5 className="font-medium text-sm text-muted-foreground mb-2">
              تصاویر پاسخ تشریحی:
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.detailed_solution_images
                .sort((a, b) => a.order - b.order)
                .map((image) => (
                  <div key={image.id} className="border rounded p-2">
                    <ImageRenderer
                      src={image.image}
                      alt={image.alt_text || `تصویر پاسخ ${image.order}`}
                      className="w-full h-auto max-h-64 object-contain rounded"
                    />
                    {image.alt_text && (
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        {image.alt_text}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
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
          {/* Selection checkbox */}
          {selectable && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelectionChange}
              className="mt-1"
            />
          )}

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
                <DropdownMenuItem onClick={() => setShowAddToExamDrawer(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن به آزمون
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Question text */}
        <div className="mb-4">
          <MathPreview text={question.question_text} />
        </div>
          <div className="flex flex-row justify-between w-full">
        {/* Question images */}
        {question.images && question.images.length > 0 && (
          <div className="mb-4" dir="ltr">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.images
                .sort((a, b) => a.order - b.order)
                .map((image) => (
                  <div key={image.id} className="p-2">
                    <ImageRenderer
                      src={image.image}
                      alt={image.alt_text || `تصویر سوال ${image.order}`}
                      className="w-full h-auto max-h-64 object-contain rounded"
                    />
                    {image.alt_text && (
                      <p className="text-xs text-muted-foreground mt-1 text-center">
                        {image.alt_text}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Options */}
        {question.options && question.options.length > 0 && (
          <div className="order-first grow">
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
          </div>
        )}
        </div>

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
    <Drawer direction="left" open={showAddToExamDrawer} onOpenChange={setShowAddToExamDrawer}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>افزودن به آزمون</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-2">سوال انتخاب شده:</h4>
              <div className="p-3 bg-muted/50 rounded border text-sm">
                <MathPreview text={question.question_text} />
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">انتخاب آزمون‌ها:</h4>
              {loadingTests ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">در حال بارگیری آزمون‌ها...</p>
                </div>
              ) : !Array.isArray(tests) || tests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {Array.isArray(tests) && tests.length === 0 ? "هیچ آزمونی یافت نشد" : "خطا در بارگیری آزمون‌ها"}
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {(tests || []).map((test) => (
                    <div key={test.id} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={`test-${test.id}`}
                        checked={selectedTests.includes(test.id)}
                        onCheckedChange={(checked) => handleTestSelection(test.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`test-${test.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        <div>
                          <div className="font-medium">{test.name}</div>
                          {test.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {test.description}
                            </div>
                          )}
                          {test.collection && (
                            <div className="text-xs text-muted-foreground">
                              مجموعه: {test.collection.name}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTests.length > 0 && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  {selectedTests.length} آزمون انتخاب شده
                </p>
                <Button
                  onClick={addQuestionToTests}
                  className="w-full"
                  disabled={loadingTests}
                >
                  افزودن به آزمون‌ها
                </Button>
              </div>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  </>
);
}
