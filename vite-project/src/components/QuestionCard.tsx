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
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useState, useEffect, useCallback } from "react";
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
export const ImageRenderer: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
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

interface QuestionCollection {
  id: number;
  name: string;
  description?: string;
  total_questions: number;
  is_active: boolean;
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
  const [showAddToCollectionDrawer, setShowAddToCollectionDrawer] = useState(false);
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTests, setSelectedTests] = useState<number[]>([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [testsWithQuestion, setTestsWithQuestion] = useState<number[]>([]);
  const [collections, setCollections] = useState<QuestionCollection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [collectionsWithQuestion, setCollectionsWithQuestion] = useState<number[]>([]);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const fetchTests = useCallback(async () => {
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

      // Check which tests already contain this question
      const testsContainingQuestion: number[] = [];
      
      for (const test of testsData) {
        try {
          const testResponse = await axiosInstance.get(`/tests/${test.id}/`);
          const testData = testResponse.data;
          
          // Get current question IDs - handle both array of IDs and array of objects
          const currentQuestionIds = (testData.questions || []).map((q: { id: number } | number) => 
            typeof q === 'object' && q !== null ? (q as { id: number }).id : (q as number)
          );
          
          if (currentQuestionIds.includes(question.id)) {
            testsContainingQuestion.push(test.id);
          }
        } catch (error) {
          console.error(`Error checking test ${test.id}:`, error);
        }
      }
      
      setTestsWithQuestion(testsContainingQuestion);
      // Set tests that already contain the question as selected
      setSelectedTests(testsContainingQuestion);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast.error("خطا در بارگیری آزمون‌ها");
      setTests([]); // Ensure tests is always an array
      setTestsWithQuestion([]);
    } finally {
      setLoadingTests(false);
    }
  }, [question.id]);

  const addQuestionToTests = async () => {
    try {
      const promises: Promise<unknown>[] = [];
      
      // Get all tests that need to be updated
      const allRelevantTests = [...new Set([...selectedTests, ...testsWithQuestion])];
      
      for (const testId of allRelevantTests) {
        // First get the current test data
        const testResponse = await axiosInstance.get(`/tests/${testId}/`);
        const currentTest = testResponse.data;
        
        // Get current question IDs - handle both array of IDs and array of objects
        const currentQuestionIds = (currentTest.questions || []).map((q: { id: number } | number) => 
          typeof q === 'object' && q !== null ? (q as { id: number }).id : (q as number)
        );
        
        const isSelected = selectedTests.includes(testId);
        const isCurrentlyIncluded = currentQuestionIds.includes(question.id);
        
        if (isSelected && !isCurrentlyIncluded) {
          // Add question to test
          const updatedQuestionIds = [...currentQuestionIds, question.id];
          promises.push(
            axiosInstance.patch(`/tests/${testId}/update`, {
              questions: updatedQuestionIds
            })
          );
        } else if (!isSelected && isCurrentlyIncluded) {
          // Remove question from test
          const updatedQuestionIds = currentQuestionIds.filter((id: number) => id !== question.id);
          promises.push(
            axiosInstance.patch(`/tests/${testId}/update`, {
              questions: updatedQuestionIds
            })
          );
        }
      }

      await Promise.all(promises);
      
      const addedCount = selectedTests.filter(id => !testsWithQuestion.includes(id)).length;
      const removedCount = testsWithQuestion.filter(id => !selectedTests.includes(id)).length;
      
      let message = '';
      if (addedCount > 0 && removedCount > 0) {
        message = `سوال به ${addedCount} آزمون اضافه و از ${removedCount} آزمون حذف شد`;
      } else if (addedCount > 0) {
        message = `سوال به ${addedCount} آزمون اضافه شد`;
      } else if (removedCount > 0) {
        message = `سوال از ${removedCount} آزمون حذف شد`;
      } else {
        message = 'تغییری اعمال نشد';
      }
      
      toast.success(message);
      setShowAddToExamDrawer(false);
      setSelectedTests([]);
    } catch (error) {
      console.error("Error updating question in tests:", error);
      toast.error("خطا در به‌روزرسانی آزمون‌ها");
    }
  };

  const handleTestSelection = (testId: number, checked: boolean) => {
    if (checked) {
      setSelectedTests(prev => [...prev, testId]);
    } else {
  setSelectedTests((prev: number[]) => prev.filter((id: number) => id !== testId));
    }
  };

  useEffect(() => {
    if (showAddToExamDrawer) {
      fetchTests();
    }
  }, [showAddToExamDrawer, fetchTests]);

  const fetchCollections = useCallback(async () => {
    try {
      setLoadingCollections(true);
      const response = await axiosInstance.get("/question-collections/");
      
      let collectionsData: QuestionCollection[] = [];
      if (Array.isArray(response.data)) {
        collectionsData = response.data;
      } else if (response.data && Array.isArray(response.data.results)) {
        collectionsData = response.data.results;
      } else {
        console.warn("Unexpected API response structure:", response.data);
        collectionsData = [];
      }
      
      setCollections(collectionsData);

      // Check which collections already contain this question
      const collectionsContainingQuestion: number[] = [];
      
      for (const collection of collectionsData) {
        try {
          const collectionResponse = await axiosInstance.get(`/question-collections/${collection.id}/`);
          const collectionData = collectionResponse.data;
          
          // Get current question IDs
          const currentQuestionIds = (collectionData.questions || []).map((q: { id: number } | number) => 
            typeof q === 'object' && q !== null ? (q as { id: number }).id : (q as number)
          );
          
          if (currentQuestionIds.includes(question.id)) {
            collectionsContainingQuestion.push(collection.id);
          }
        } catch (error) {
          console.error(`Error checking collection ${collection.id}:`, error);
        }
      }
      
      setCollectionsWithQuestion(collectionsContainingQuestion);
      // Set collections that already contain the question as selected
      setSelectedCollections(collectionsContainingQuestion);
    } catch (error) {
      console.error("Error fetching collections:", error);
      toast.error("خطا در بارگیری مجموعه‌های سوال");
      setCollections([]);
      setCollectionsWithQuestion([]);
    } finally {
      setLoadingCollections(false);
    }
  }, [question.id]);

  useEffect(() => {
    if (showAddToCollectionDrawer) {
      fetchCollections();
    }
  }, [showAddToCollectionDrawer, fetchCollections]);

  // Safety: reset body pointer-events when overlays are closed
  useEffect(() => {
    const anyOverlayOpen = showAddToExamDrawer || showAddToCollectionDrawer || showSolutionDialog;
    if (!anyOverlayOpen && typeof document !== 'undefined') {
      const body = document.body;
      if (body && body.style.pointerEvents === 'none') {
        body.style.pointerEvents = 'auto';
      }
    }
  }, [showAddToExamDrawer, showAddToCollectionDrawer, showSolutionDialog]);



  const addQuestionToCollections = async () => {
    try {
      const promises: Promise<unknown>[] = [];
      
      // Get all collections that need to be updated
      const allRelevantCollections = [...new Set([...selectedCollections, ...collectionsWithQuestion])];
      
      for (const collectionId of allRelevantCollections) {
        const isSelected = selectedCollections.includes(collectionId);
        const isCurrentlyIncluded = collectionsWithQuestion.includes(collectionId);
        
        if (isSelected && !isCurrentlyIncluded) {
          // Add question to collection
          promises.push(
            axiosInstance.post(`/question-collections/${collectionId}/add_questions/`, {
              question_ids: [question.id]
            })
          );
        } else if (!isSelected && isCurrentlyIncluded) {
          // Remove question from collection
          promises.push(
            axiosInstance.post(`/question-collections/${collectionId}/remove_questions/`, {
              question_ids: [question.id]
            })
          );
        }
      }

      await Promise.all(promises);
      
      const addedCount = selectedCollections.filter(id => !collectionsWithQuestion.includes(id)).length;
      const removedCount = collectionsWithQuestion.filter(id => !selectedCollections.includes(id)).length;
      
      if (addedCount > 0 && removedCount > 0) {
        toast.success(`سوال به ${addedCount} مجموعه اضافه و از ${removedCount} مجموعه حذف شد`);
      } else if (addedCount > 0) {
        toast.success(`سوال با موفقیت به ${addedCount} مجموعه اضافه شد`);
      } else if (removedCount > 0) {
        toast.success(`سوال با موفقیت از ${removedCount} مجموعه حذف شد`);
      } else {
        toast.info("تغییری اعمال نشد");
      }
      
      setShowAddToCollectionDrawer(false);
    } catch (error) {
      console.error("Error updating question in collections:", error);
      toast.error("خطا در به‌روزرسانی مجموعه‌های سوال");
    }
  };

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
          <div className="flex items-center gap-2 persian-number">
            <Badge variant={"secondary"}>{question.publish_date || "N/A"}</Badge>
            <Badge variant={"secondary"}>{question.source || "N/A"}</Badge>
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
                          <FileText className="h-3 w-3 mr-1" />
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
                <DropdownMenuItem onClick={() => setShowAddToCollectionDrawer(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  <p dir="rtl">افزودن به مجموعه سوال</p>
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
    {showAddToExamDrawer && (
      <Drawer direction="left" open={showAddToExamDrawer} onOpenChange={setShowAddToExamDrawer}>
        <DrawerContent className="h-screen flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>افزودن به آزمون</DrawerTitle>
            <DrawerDescription>سوال را به آزمون‌های دلخواه اضافه یا حذف کنید</DrawerDescription>
          </DrawerHeader>
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex-shrink-0">
              <h4 className="font-medium text-sm mb-2">سوال انتخاب شده:</h4>
              <div className="p-3 bg-muted/50 rounded border text-sm">
                <MathPreview text={question.question_text} />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="font-medium text-sm mb-2 flex-shrink-0">انتخاب آزمون‌ها:</h4>
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
                <ScrollArea className="flex-1 w-full border rounded-md min-h-0">
                  <div className="p-2 space-y-2">
                    {(tests || []).map((test) => {
                      const isAlreadyIncluded = testsWithQuestion.includes(test.id);
                      return (
                        <div 
                          key={test.id} 
                          className={`flex items-start space-x-reverse p-2 rounded border transition-colors hover:bg-muted/50 ${
                            isAlreadyIncluded ? 'bg-muted/30' : 'bg-background'
                          }`}
                        >
                          <Checkbox
                            id={`test-${test.id}`}
                            checked={selectedTests.includes(test.id)}
                            onCheckedChange={(checked) => handleTestSelection(test.id, checked as boolean)}
                            className="mt-0.5 ml-3"
                          />
                          <label
                            htmlFor={`test-${test.id}`}
                            className={`text-sm font-medium leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 ${
                              isAlreadyIncluded ? 'text-muted-foreground' : ''
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{test.name}</span>
                                {isAlreadyIncluded && (
                                  <Badge variant="secondary" className="text-xs">
                                    شامل این سوال
                                  </Badge>
                                )}
                              </div>
                              {test.description && (
                                <div className="text-xs text-muted-foreground leading-normal">
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
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            {(() => {
              const hasChanges = selectedTests.some(id => !testsWithQuestion.includes(id)) || 
                                testsWithQuestion.some(id => !selectedTests.includes(id));
              
              if (!hasChanges) return null;
              
              const addedCount = selectedTests.filter(id => !testsWithQuestion.includes(id)).length;
              const removedCount = testsWithQuestion.filter(id => !selectedTests.includes(id)).length;
              
              let statusText = '';
              if (addedCount > 0 && removedCount > 0) {
                statusText = `${addedCount} اضافه، ${removedCount} حذف`;
              } else if (addedCount > 0) {
                statusText = `${addedCount} آزمون برای اضافه شدن`;
              } else if (removedCount > 0) {
                statusText = `${removedCount} آزمون برای حذف شدن`;
              }
              
              return (
                <div className="pt-4 border-t flex-shrink-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {statusText}
                  </p>
                  <Button
                    onClick={addQuestionToTests}
                    className="w-full"
                    disabled={loadingTests}
                  >
                    اعمال تغییرات
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
        </DrawerContent>
      </Drawer>
    )}

    {/* Add to Question Collection Drawer */}
    {showAddToCollectionDrawer && (
      <Drawer direction="left" open={showAddToCollectionDrawer} onOpenChange={setShowAddToCollectionDrawer}>
        <DrawerContent className="h-screen flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>افزودن به مجموعه سوال</DrawerTitle>
            <DrawerDescription>این سوال را به مجموعه‌های انتخاب شده اضافه یا حذف کنید</DrawerDescription>
          </DrawerHeader>
        <div className="p-4 flex-1 flex flex-col min-h-0">
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <div className="flex-shrink-0">
              <h4 className="font-medium text-sm mb-2">سوال انتخاب شده:</h4>
              <div className="p-3 bg-muted/50 rounded border text-sm">
                <MathPreview text={question.question_text} />
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <h4 className="font-medium text-sm mb-2 flex-shrink-0">انتخاب مجموعه‌های سوال:</h4>
              {loadingCollections ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">در حال بارگیری مجموعه‌ها...</p>
                </div>
              ) : !Array.isArray(collections) || collections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {Array.isArray(collections) && collections.length === 0 ? "هیچ مجموعه‌ای یافت نشد" : "خطا در بارگیری مجموعه‌ها"}
                </p>
              ) : (
                <ScrollArea className="flex-1 w-full border rounded-md min-h-0">
                  <div className="p-2 space-y-2">
                    {(collections || []).map((collection) => {
                      const isAlreadyIncluded = collectionsWithQuestion.includes(collection.id);
                      return (
                        <div 
                          key={collection.id} 
                          className={`flex items-start space-x-reverse p-2 rounded border transition-colors hover:bg-muted/50 ${
                            isAlreadyIncluded ? 'bg-muted/30' : 'bg-background'
                          }`}
                        >
                          <Checkbox
                            id={`collection-${collection.id}`}
                            checked={selectedCollections.includes(collection.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCollections(prev => [...prev, collection.id]);
                              } else {
                                setSelectedCollections((prev: number[]) => prev.filter((id: number) => id !== collection.id));
                              }
                            }}
                            className="mt-0.5 ml-3"
                          />
                          <label
                            htmlFor={`collection-${collection.id}`}
                            className={`text-sm font-medium leading-normal peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 ${
                              isAlreadyIncluded ? 'text-muted-foreground' : ''
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{collection.name}</span>
                                {isAlreadyIncluded && (
                                  <Badge variant="secondary" className="text-xs">
                                    شامل این سوال
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {collection.total_questions} سوال
                                </Badge>
                              </div>
                              {collection.description && (
                                <div className="text-xs text-muted-foreground leading-normal">
                                  {collection.description}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground">
                                وضعیت: {collection.is_active ? 'فعال' : 'غیرفعال'}
                              </div>
                            </div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            {(() => {
              const hasChanges = selectedCollections.some(id => !collectionsWithQuestion.includes(id)) || 
                                collectionsWithQuestion.some(id => !selectedCollections.includes(id));
              
              if (!hasChanges) return null;
              
              const addedCount = selectedCollections.filter(id => !collectionsWithQuestion.includes(id)).length;
              const removedCount = collectionsWithQuestion.filter(id => !selectedCollections.includes(id)).length;
              
              let statusText = '';
              if (addedCount > 0 && removedCount > 0) {
                statusText = `${addedCount} اضافه، ${removedCount} حذف`;
              } else if (addedCount > 0) {
                statusText = `${addedCount} مجموعه برای اضافه شدن`;
              } else if (removedCount > 0) {
                statusText = `${removedCount} مجموعه برای حذف شدن`;
              }
              
              return (
                <div className="pt-4 border-t flex-shrink-0">
                  <p className="text-sm text-muted-foreground mb-3">
                    {statusText}
                  </p>
                  <Button
                    onClick={addQuestionToCollections}
                    className="w-full"
                    disabled={loadingCollections}
                  >
                    اعمال تغییرات
                  </Button>
                </div>
              );
            })()}
          </div>
        </div>
        </DrawerContent>
      </Drawer>
    )}
  </>
);
}
