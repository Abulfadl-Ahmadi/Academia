import React from "react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Button } from "@/components/ui/button";
import { CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface AnswerSheetProps {
  answers: Record<number, string>;
  maxQuestions: number;
  onAnswer: (questionNumber: number, value: string) => void;
  onFinish: () => void;
  currentPage: number;
  timeLeft: number;
}

const AnswerSheet: React.FC<AnswerSheetProps> = ({
  answers,
  maxQuestions,
  onAnswer,
  onFinish,
  currentPage,
  timeLeft,
}) => {
  const answeredCount = Object.keys(answers).length;
  const options = [
    { value: "1", label: "۱" },
    { value: "2", label: "۲" },
    { value: "3", label: "۳" },
    { value: "4", label: "۴" },
  ];

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours > 0 ? `${hours}:` : ''}${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft < 300) return "text-red-500";
    if (timeLeft < 600) return "text-orange-500";
    return "text-green-500";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b dark:border-gray-700 bg-primary/5 dark:bg-primary/10">
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">پیشرفت شما</span>
            <Badge variant="secondary" className="font-mono bg-white dark:bg-gray-800 shadow-sm">
              {answeredCount}/{maxQuestions}
            </Badge>
          </div>
          <Progress 
            value={(answeredCount / maxQuestions) * 100} 
            className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" 
          />
        </div>
        
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">زمان باقی‌مانده</span>
          <span className={`font-mono font-bold text-lg ${getTimeColor()}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5">
        <h3 className="text-xl font-bold mb-5 text-gray-800 dark:text-gray-200">پاسخ‌برگ</h3>
        
        <div className="space-y-5">
          {Array.from({ length: maxQuestions }).map((_, index) => {
            const questionNumber = index + 1;
            const isCurrentQuestion = questionNumber === currentPage + 1;
            const isAnswered = !!answers[questionNumber];
            
            return (
              <div
                key={questionNumber}
                className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md ${
                  isCurrentQuestion 
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : isAnswered
                    ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <span className={`font-medium text-lg ${
                    isCurrentQuestion ? "text-primary dark:text-primary" : 
                    isAnswered ? "text-green-600 dark:text-green-400" : ""
                  }`}>
                    سوال {questionNumber}
                  </span>
                  {isAnswered && (
                    <Badge variant="secondary" className="bg-white dark:bg-gray-800 shadow-sm px-3 py-1">
                      پاسخ: {answers[questionNumber]}
                    </Badge>
                  )}
                </div>
                
                <RadioGroup.Root
                  value={answers[questionNumber] || ""}
                  className="grid grid-cols-4 gap-3"
                  onValueChange={(value) => onAnswer(questionNumber, value)}
                >
                  {options.map((option) => (
                    <RadioGroup.Item
                      key={option.value}
                      value={option.value}
                      className="flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow
                      data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                    >
                      {option.label}
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-5 border-t dark:border-gray-700 bg-primary/5 dark:bg-primary/10">
        <Button 
          onClick={onFinish}
          variant="default"
          className="w-full h-12 text-base font-bold bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all"
        >
          <CheckSquare className="w-5 h-5 mr-2" />
          پایان آزمون
        </Button>
      </div>
    </div>
  );
};

export default AnswerSheet;
