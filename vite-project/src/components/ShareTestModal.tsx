import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SlidingNumber } from "../../components/motion-primitives/sliding-number";
import { 
  Clock, 
  FileText, 
  Calendar, 
  Share2, 
  Copy, 
  CheckCircle,
  Users,
  BookOpen,
  Timer
} from "lucide-react";
import { toast } from "sonner";

interface Test {
  id: number;
  name: string;
  description: string;
  questions_count: number;
  time_limit: number;
  is_active: boolean;
  created_at: string;
  pdf_file_url: string;
  answers_file_url?: string;
}

interface TestCollection {
  id: number;
  name: string;
  description: string;
  total_tests: number;
  student_count: number;
  created_by_name: string;
  created_at: string;
  is_active: boolean;
}

interface ShareTestModalProps {
  test: Test;
  collection: TestCollection;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shareUrl?: string;
  endTime?: string; // ISO datetime string for countdown
}

const ShareTestModal: React.FC<ShareTestModalProps> = ({
  test,
  collection,
  isOpen,
  onOpenChange,
  shareUrl,
  endTime
}) => {
  // Default end time to 2 hours from now if not provided
  const defaultEndTime = useMemo(() => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toISOString();
  }, []);

  const targetDate = useMemo(() => new Date(endTime || defaultEndTime), [endTime, defaultEndTime]);
  const [days, setDays] = useState(0);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const difference = Math.max(0, targetDate.getTime() - now.getTime());
      
      // Calculate days, hours, minutes, seconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setDays(days);
      setHours(hours);
      setMinutes(minutes);
      setSeconds(seconds);
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const handleCopyUrl = async () => {
    const urlToCopy = shareUrl || `${window.location.origin}/tests/${test.id}`;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      toast.success("لینک کپی شد!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("خطا در کپی کردن لینک");
    }
  };

  const shareText = `آزمون "${test.name}" از مجموعه "${collection.name}"
📚 ${test.questions_count} سوال
⏱️ ${test.time_limit} دقیقه
👨‍🏫 ایجاد شده توسط: ${collection.created_by_name}`;

  const handleShare = async () => {
    const urlToShare = shareUrl || `${window.location.origin}/tests/${test.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `آزمون ${test.name}`,
          text: shareText,
          url: urlToShare,
        });
      } catch {
        console.log("Share cancelled");
      }
    } else {
      // Fallback to copy URL
      await handleCopyUrl();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            اشتراک‌گذاری آزمون
          </DialogTitle>
          <DialogDescription>
            اطلاعات آزمون و زمان باقی‌مانده را با دیگران به اشتراک بگذارید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Countdown Timer */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Timer className="h-5 w-5" />
                زمان باقی‌مانده تا پایان آزمون
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 sm:gap-6 font-mono" dir="ltr">
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl font-bold">
                    <SlidingNumber value={days} padStart={true} />
                  </div>
                  <span className="font-sans text-xs mt-1 text-gray-600 dark:text-gray-300">روز</span>
                </div>
                <span className="text-zinc-500 text-2xl sm:text-3xl mb-2">:</span>
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl font-bold">
                    <SlidingNumber value={hours} padStart={true} />
                  </div>
                  <span className="font-sans text-xs mt-1 text-gray-600 dark:text-gray-300">ساعت</span>
                </div>
                <span className="text-zinc-500 text-2xl sm:text-3xl mb-2">:</span>
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl font-bold">
                    <SlidingNumber value={minutes} padStart={true} />
                  </div>
                  <span className="font-sans text-xs mt-1 text-gray-600 dark:text-gray-300">دقیقه</span>
                </div>
                <span className="text-zinc-500 text-2xl sm:text-3xl mb-2">:</span>
                <div className="flex flex-col items-center">
                  <div className="text-2xl sm:text-3xl font-bold">
                    <SlidingNumber value={seconds} padStart={true} />
                  </div>
                  <span className="font-sans text-xs mt-1 text-gray-600 dark:text-gray-300">ثانیه</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>{test.name}</CardTitle>
                <Badge variant={test.is_active ? "default" : "secondary"}>
                  {test.is_active ? "فعال" : "غیرفعال"}
                </Badge>
              </div>
              {test.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {test.description}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{test.questions_count}</p>
                    <p className="text-xs text-muted-foreground">سوال</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{test.time_limit}</p>
                    <p className="text-xs text-muted-foreground">دقیقه</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-2">مجموعه آزمون</h3>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{collection.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{collection.student_count} دانش‌آموز</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(test.created_at).toLocaleDateString('fa-IR')}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  ایجاد شده توسط: {collection.created_by_name}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Share Actions */}
          <div className="flex gap-3">
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 ml-2" />
              اشتراک‌گذاری
            </Button>
            <Button variant="outline" onClick={handleCopyUrl} className="flex-1">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 ml-2 text-green-500" />
                  کپی شد!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 ml-2" />
                  کپی لینک
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTestModal;
