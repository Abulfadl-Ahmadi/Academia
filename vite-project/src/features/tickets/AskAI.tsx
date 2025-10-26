import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, Send, Bot, UserRound, MessageSquareWarning } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AskAI() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('لطفاً سوال خود را وارد کنید');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axiosInstance.post('/support/ai/answer/', {
        question: question.trim()
      });
      
      setAnswer(response.data.answer);
      setRemainingQuestions(response.data.remaining_questions);
      setTotalQuestions(response.data.total_questions);
      
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      const errorMessage = error.response?.data?.error || 'خطا در دریافت پاسخ از هوش مصنوعی';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const createSupportTicket = () => {
    // انتقال به صفحه ایجاد تیکت با اطلاعات پیش‌فرض
    navigate('/panel/support/new', { 
      state: { 
        title: question.length > 50 ? `${question.substring(0, 47)}...` : question,
        description: `سوال اصلی:\n${question}\n\nپاسخ هوش مصنوعی:\n${answer}`,
        aiQuestion: true
      } 
    });
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <div>
                <CardTitle className="text-2xl">پرسش از هوش مصنوعی</CardTitle>
                <CardDescription>
                  سوال خود را بپرسید و پاسخ فوری دریافت کنید
                  {remainingQuestions !== null && totalQuestions !== null && (
                    <div className="mt-1 text-sm">
                      سوالات باقی مانده: {remainingQuestions} / {totalQuestions}
                    </div>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/panel/support/ask-ai')}>
              مشاهده تاریخچه گفتگوها
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium mb-1">
                سوال شما
              </label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="سوال خود را اینجا بنویسید..."
                className="min-h-28"
                disabled={loading}
              />
            </div>
            
            <Button type="submit" className="flex items-center gap-2" disabled={loading || !question.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال دریافت پاسخ...
                </>
              ) : (
                <>
                  <Send size={16} />
                  دریافت پاسخ
                </>
              )}
            </Button>
          </form>
          
          {answer && (
            <div className="mt-8">
              <Separator className="my-4" />
              
              <div className="flex items-center gap-2 mb-2">
                <Bot size={18} />
                <h3 className="text-lg font-medium">پاسخ هوش مصنوعی</h3>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg overflow-auto prose prose-slate dark:prose-invert max-w-none">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // تنظیم سایر المان‌ها
                    code: ({inline, ...props}) => 
                      inline ? 
                        <code className="bg-muted/70 px-1 py-0.5 rounded text-sm" {...props} /> : 
                        <code className="block bg-muted/70 p-2 rounded-md my-2 text-sm overflow-x-auto" {...props} />,
                    p: (props) => <p className="mb-4" {...props} />,
                    pre: (props) => <pre className="bg-muted/70 p-3 rounded-md my-3 overflow-x-auto" {...props} />,
                    h1: (props) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                    h2: (props) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
                    h3: (props) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                    ul: (props) => <ul className="list-disc list-inside mb-4 pr-5" {...props} />,
                    ol: (props) => <ol className="list-decimal list-inside mb-4 pr-5" {...props} />,
                    // به جای تعریف مستقیم li، از عبارت lambda استفاده می‌کنیم که درون لیست استفاده شود
                    a: (props) => <a className="text-primary hover:underline" {...props} />,
                    blockquote: (props) => <blockquote className="border-r-4 border-primary/30 pr-3 py-1 my-3 italic" {...props} />,
                  }}
                >
                  {answer}
                </ReactMarkdown>
              </div>
              
              <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <MessageSquareWarning className="mt-0.5 text-yellow-600" size={18} />
                  <div>
                    <h4 className="font-medium text-yellow-800">آیا این پاسخ به شما کمک کرد؟</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      اگر پاسخ هوش مصنوعی کافی نبود، می‌توانید این سوال را به عنوان یک تیکت پشتیبانی ثبت کنید تا توسط کارشناسان ما پاسخ داده شود.
                    </p>
                    
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Button variant="outline" onClick={() => navigate('/panel/support')}>
                        بله، سوالم پاسخ داده شد
                      </Button>
                      <Button onClick={createSupportTicket} className="flex items-center gap-2">
                        <UserRound size={16} />
                        نیاز به پشتیبانی دارم
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={async () => {
                          try {
                            const response = await axiosInstance.post('/support/ai/conversations/', {
                              title: question.substring(0, 50)
                            });
                            const conversationId = response.data.id;
                            
                            // Add the current Q&A as first messages in the conversation
                            await axiosInstance.post(`/support/ai/conversations/${conversationId}/add_message/`, {
                              content: question
                            });
                            
                            navigate(`/panel/support/ask-ai/${conversationId}`);
                          } catch (error) {
                            console.error('خطا در ایجاد گفتگو:', error);
                            toast.error('خطا در ایجاد گفتگو');
                          }
                        }}
                      >
                        ادامه گفتگو با هوش مصنوعی
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
