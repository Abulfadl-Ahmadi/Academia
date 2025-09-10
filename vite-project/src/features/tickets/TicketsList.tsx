import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '@/lib/axios';
import { toast } from 'sonner';
import { useUser } from '@/context/UserContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, ChevronLeft, Bot } from 'lucide-react';

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  status_display: string;
  priority: string;
  priority_display: string;
  category: string;
  category_display: string;
  created_at: string;
  updated_at: string;
  created_by?: User;
}

export default function TicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useUser();
  const navigate = useNavigate();

  const isTeacher = user?.role === 'teacher';
  
  // تابع اختصاص تیکت به معلم
  const assignTicket = async (ticketId: number) => {
    if (!user) return;
    
    setLoadingAction(ticketId);
    try {
      await axiosInstance.patch(`/support/tickets/${ticketId}/`, {
        assigned_to_id: user.id,
        status: 'in_progress'
      });
      
      // بروزرسانی وضعیت تیکت در استیت محلی
      setTickets(prevTickets => prevTickets.map(ticket => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status: 'in_progress',
            status_display: 'در حال بررسی'
          };
        }
        return ticket;
      }));
      
      toast.success('تیکت با موفقیت به شما اختصاص داده شد');
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('خطا در اختصاص تیکت');
    } finally {
      setLoadingAction(null);
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        console.log('Fetching tickets, user role:', user?.role);
        console.log('Is teacher?', isTeacher);
        
        // The baseURL already includes '/api/', so we don't need to add it here
        const response = await axiosInstance.get('/support/tickets/');
        console.log('Tickets response data:', response.data);
        setTickets(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast.error('خطا در دریافت تیکت‌ها');
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user?.role, isTeacher]);

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

  // فیلتر کردن تیکت‌ها بر اساس جستجو و فیلترهای انتخاب شده
  const filteredTickets = tickets.filter(ticket => {
    // جستجو در عنوان و توضیحات
    const matchesSearch = searchTerm === '' || 
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // فیلتر بر اساس وضعیت
    const matchesStatus = !statusFilter || ticket.status === statusFilter;
    
    // فیلتر بر اساس اولویت
    const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">{isTeacher ? 'مدیریت تیکت‌های دانش‌آموزان' : 'تیکت‌های پشتیبانی'}</CardTitle>
              <CardDescription>
                {isTeacher ? 'پاسخگویی و رسیدگی به تیکت‌های دانش‌آموزان' : 'درخواست‌ها و سؤالات خود را مطرح کنید'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/panel/support/ask-ai')} variant="outline" className="flex items-center gap-2">
                <Bot size={16} />
                پرسش از هوش مصنوعی
              </Button>
              {!isTeacher && (
                <Button onClick={() => navigate('/panel/support/new')} className="flex items-center gap-2">
                  <Plus size={16} />
                  تیکت جدید
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* بخش فیلترها - فقط برای معلمان نمایش داده می‌شود */}
          {isTeacher && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-4 border-b">
              <div>
                <label className="text-sm font-medium mb-1 block">جستجو</label>
                <Input 
                  placeholder="جستجو در عنوان و توضیحات..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">وضعیت</label>
                <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه وضعیت‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="open">باز</SelectItem>
                    <SelectItem value="in_progress">در حال بررسی</SelectItem>
                    <SelectItem value="resolved">حل شده</SelectItem>
                    <SelectItem value="closed">بسته شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اولویت</label>
                <Select value={priorityFilter || 'all'} onValueChange={(value) => setPriorityFilter(value === 'all' ? null : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="همه اولویت‌ها" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه اولویت‌ها</SelectItem>
                    <SelectItem value="low">کم</SelectItem>
                    <SelectItem value="medium">متوسط</SelectItem>
                    <SelectItem value="high">زیاد</SelectItem>
                    <SelectItem value="urgent">فوری</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">هیچ تیکتی ثبت نشده است</p>
              <Button onClick={() => navigate('/panel/support/new')} variant="outline" className="mt-4">
                ثبت اولین تیکت
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>عنوان</TableHead>
                    {isTeacher && <TableHead>ایجاد کننده</TableHead>}
                    <TableHead>وضعیت</TableHead>
                    <TableHead>اولویت</TableHead>
                    <TableHead>دسته‌بندی</TableHead>
                    <TableHead>تاریخ ایجاد</TableHead>
                    <TableHead>آخرین بروزرسانی</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isTeacher ? 8 : 7} className="text-center py-10">
                        <p className="text-muted-foreground">هیچ تیکتی با این معیارها یافت نشد</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTickets.map((ticket) => (
                      <TableRow key={ticket.id} className="cursor-pointer hover:bg-gray-500/7" onClick={() => navigate(`/panel/support/${ticket.id}`)}>
                        <TableCell className="font-medium">{ticket.title}</TableCell>
                        {isTeacher && (
                          <TableCell>
                            {ticket.created_by ? (
                              <span className="text-sm">
                                {ticket.created_by.first_name} {ticket.created_by.last_name || ''}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">دانش‌آموز</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Badge className={getStatusBadgeColor(ticket.status)}>
                            {ticket.status_display}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityBadgeColor(ticket.priority)}>
                            {ticket.priority_display}
                          </Badge>
                        </TableCell>
                        <TableCell>{ticket.category_display}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(ticket.created_at)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(ticket.updated_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {isTeacher && ticket.status === 'open' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  assignTicket(ticket.id);
                                }}
                                disabled={loadingAction === ticket.id}
                              >
                                {loadingAction === ticket.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : null}
                                اختصاص به من
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/panel/support/${ticket.id}`);
                            }}>
                              <ChevronLeft size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {/* نمایش آمار تیکت‌ها */}
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                <div>
                  تعداد کل تیکت‌ها: {filteredTickets.length}
                </div>
                {isTeacher && (
                  <div className="flex gap-4">
                    <div>
                      باز: {tickets.filter(t => t.status === 'open').length}
                    </div>
                    <div>
                      در حال بررسی: {tickets.filter(t => t.status === 'in_progress').length}
                    </div>
                    <div>
                      حل شده: {tickets.filter(t => t.status === 'resolved').length}
                    </div>
                    <div>
                      بسته شده: {tickets.filter(t => t.status === 'closed').length}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
