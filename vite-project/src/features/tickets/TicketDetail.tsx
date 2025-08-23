import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight, Upload, Paperclip } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Attachment {
  id: number;
  file: string;
  uploaded_at: string;
}

interface Response {
  id: number;
  user: User;
  content: string;
  created_at: string;
  attachments: Attachment[];
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  created_by: User;
  assigned_to: User | null;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  category: string;
  category_display: string;
  created_at: string;
  updated_at: string;
  responses: Response[];
  attachments: Attachment[];
}

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseContent, setResponseContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [priorityLoading, setPriorityLoading] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useUser();
  
  const isTeacherOrStaff = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await axiosInstance.get(`/support/tickets/${id}/`);
        setTicket(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        toast.error('خطا در دریافت اطلاعات تیکت');
        setLoading(false);
      }
    };

    if (id) {
      fetchTicket();
    }
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
    }
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!responseContent.trim()) return;

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('content', responseContent);
      
      files.forEach(file => {
        formDataToSend.append('uploaded_files', file);
      });

      const response = await axiosInstance.post(`/support/tickets/${id}/add_response/`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Refetch the ticket to get the updated responses
      const updatedTicketResponse = await axiosInstance.get(`/support/tickets/${id}/`);
      setTicket(updatedTicketResponse.data);
      
      // Reset form
      setResponseContent('');
      setFiles([]);
      
      toast.success('پاسخ با موفقیت ثبت شد');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast.error('خطا در ثبت پاسخ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!isTeacherOrStaff || !ticket) return;
    
    setStatusLoading(true);
    
    try {
      const response = await axiosInstance.post(`/support/tickets/${id}/change_status/`, {
        status
      });
      
      setTicket(response.data);
      toast.success('وضعیت تیکت با موفقیت تغییر کرد');
    } catch (error) {
      console.error('Error changing ticket status:', error);
      toast.error('خطا در تغییر وضعیت تیکت');
    } finally {
      setStatusLoading(false);
    }
  };
  
  const handlePriorityChange = async (priority: string) => {
    if (!isTeacherOrStaff || !ticket) return;
    
    setPriorityLoading(true);
    
    try {
      const response = await axiosInstance.patch(`/support/tickets/${id}/`, {
        priority
      });
      
      setTicket(response.data);
      toast.success('اولویت تیکت با موفقیت تغییر کرد');
    } catch (error) {
      console.error('Error changing ticket priority:', error);
      toast.error('خطا در تغییر اولویت تیکت');
    } finally {
      setPriorityLoading(false);
    }
  };
  
  const handleAssignToMe = async () => {
    if (!isTeacherOrStaff || !ticket || !user) return;
    
    setAssignLoading(true);
    
    try {
      const response = await axiosInstance.patch(`/support/tickets/${id}/`, {
        assigned_to_id: user.id,
        // اگر تیکت باز است، وضعیت آن را به در حال بررسی تغییر دهید
        status: ticket.status === 'open' ? 'in_progress' : ticket.status
      });
      
      setTicket(response.data);
      toast.success('تیکت با موفقیت به شما اختصاص داده شد');
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('خطا در اختصاص تیکت');
    } finally {
      setAssignLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-blue-400';
      case 'medium':
        return 'bg-yellow-400';
      case 'high':
        return 'bg-orange-500';
      case 'urgent':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getUserInitials = (user: User) => {
    if (user.first_name || user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const getFileName = (fileUrl: string) => {
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-2">تیکت یافت نشد</h2>
              <p className="text-muted-foreground mb-4">تیکت مورد نظر وجود ندارد یا شما دسترسی به آن ندارید</p>
              <Button onClick={() => navigate('/panel/support')}>
                بازگشت به لیست تیکت‌ها
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/panel/support')}>
                <ArrowRight size={16} />
              </Button>
              <div>
                <CardTitle className="text-xl">{ticket.title}</CardTitle>
                <CardDescription>
                  <span className="ml-2">شناسه: {ticket.id}</span> | 
                  <span className="mx-2">ایجاد کننده: {ticket.created_by.username}</span> | 
                  <span className="mr-2">تاریخ: {formatDate(ticket.created_at)}</span>
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityBadgeColor(ticket.priority)}>
                {ticket.priority_display}
              </Badge>
              <Badge className={getStatusBadgeColor(ticket.status)}>
                {ticket.status_display}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Ticket information */}
            <div>
              <div className="flex items-start gap-4">
                <Avatar className="mt-1">
                  <AvatarFallback>{getUserInitials(ticket.created_by)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-medium">{ticket.created_by.username}</span>
                      <span className="text-sm text-muted-foreground mr-2">دسته‌بندی: {ticket.category_display}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{formatDate(ticket.created_at)}</span>
                  </div>
                  <div className="mb-4 whitespace-pre-wrap">{ticket.description}</div>
                  
                  {ticket.attachments.length > 0 && (
                    <div className="mt-3 border rounded p-2 bg-gray-50">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                        <Paperclip size={14} />
                        <span>پیوست‌ها:</span>
                      </div>
                      <ul className="space-y-1">
                        {ticket.attachments.map(attachment => (
                          <li key={attachment.id}>
                            <a 
                              href={attachment.file} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Paperclip size={12} />
                              {getFileName(attachment.file)}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Responses */}
            {ticket.responses.length > 0 && (
              <div className="space-y-4">
                <Separator />
                <h3 className="text-lg font-medium">پاسخ‌ها</h3>
                
                <div className="space-y-6">
                  {ticket.responses.map(response => (
                    <div key={response.id} className="flex items-start gap-4">
                      <Avatar className="mt-1">
                        <AvatarFallback>{getUserInitials(response.user)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{response.user.username}</span>
                          <span className="text-sm text-muted-foreground">{formatDate(response.created_at)}</span>
                        </div>
                        <div className="mb-4 whitespace-pre-wrap">{response.content}</div>
                        
                        {response.attachments.length > 0 && (
                          <div className="mt-3 border rounded p-2 bg-gray-50">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                              <Paperclip size={14} />
                              <span>پیوست‌ها:</span>
                            </div>
                            <ul className="space-y-1">
                              {response.attachments.map(attachment => (
                                <li key={attachment.id}>
                                  <a 
                                    href={attachment.file} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                                  >
                                    <Paperclip size={12} />
                                    {getFileName(attachment.file)}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Management options for teachers/staff */}
            {isTeacherOrStaff && (
              <div className="mb-6">
                <Separator className="my-4" />
                <h3 className="text-lg font-medium mb-4">مدیریت تیکت</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="font-medium">وضعیت:</span>
                      <Select
                        value={ticket.status}
                        onValueChange={handleStatusChange}
                        disabled={statusLoading}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="وضعیت" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">باز</SelectItem>
                          <SelectItem value="in_progress">در حال بررسی</SelectItem>
                          <SelectItem value="resolved">حل شده</SelectItem>
                          <SelectItem value="closed">بسته شده</SelectItem>
                        </SelectContent>
                      </Select>
                      {statusLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="font-medium">اولویت:</span>
                      <Select
                        value={ticket.priority}
                        onValueChange={(value) => handlePriorityChange(value)}
                        disabled={priorityLoading}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="اولویت" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">کم</SelectItem>
                          <SelectItem value="medium">متوسط</SelectItem>
                          <SelectItem value="high">زیاد</SelectItem>
                          <SelectItem value="urgent">فوری</SelectItem>
                        </SelectContent>
                      </Select>
                      {priorityLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-2 font-medium">اختصاص تیکت به:</div>
                    <div className="flex gap-3">
                      <Button 
                        variant={ticket.assigned_to?.id === user?.id ? "default" : "outline"}
                        size="sm"
                        disabled={assignLoading}
                        onClick={() => handleAssignToMe()}
                      >
                        {assignLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                        اختصاص به من
                      </Button>
                      {ticket.assigned_to && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>مسئول رسیدگی:</span>
                          <span className="font-medium">
                            {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Reply form */}
            {ticket.status !== 'closed' && (
              <div>
                <Separator className="mb-4" />
                <h3 className="text-lg font-medium mb-4">ارسال پاسخ</h3>
                <form onSubmit={handleSubmitResponse} className="space-y-4">
                  <Textarea
                    value={responseContent}
                    onChange={(e) => setResponseContent(e.target.value)}
                    placeholder="پاسخ خود را بنویسید..."
                    className="min-h-28"
                    required
                  />

                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        id="response-files"
                        type="file"
                        onChange={handleFileChange}
                        multiple
                        className="hidden"
                      />
                      <label htmlFor="response-files" className="cursor-pointer">
                        <div className="flex items-center gap-2 py-2 px-4 rounded border border-dashed border-gray-300 hover:border-gray-400">
                          <Upload size={16} />
                          <span>انتخاب فایل</span>
                        </div>
                      </label>
                      {files.length > 0 && <span className="text-sm text-muted-foreground">{files.length} فایل انتخاب شده</span>}
                    </div>
                    
                    {files.length > 0 && (
                      <div className="mt-2">
                        <ul className="text-sm">
                          {files.map((file, index) => (
                            <li key={index} className="text-muted-foreground">{file.name}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Button type="submit" disabled={submitting || !responseContent.trim()}>
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        در حال ارسال...
                      </>
                    ) : (
                      'ارسال پاسخ'
                    )}
                  </Button>
                </form>
              </div>
            )}

            {ticket.status === 'closed' && (
              <div className="text-center py-4">
                <div className="text-muted-foreground">این تیکت بسته شده است و امکان ارسال پاسخ وجود ندارد</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
