import { useState, useEffect } from 'react';
import { Plus, Target, Filter, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { knowledgeApi } from '@/features/knowledge/api';
import { DataTable } from '@/components/ui/data-table-with-selection';
import { topicTestColumns, type TopicTestForTable } from './topic-tests-columns';
import type { TopicTest, Folder } from '@/features/knowledge/types';


export function TopicTestManager() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TopicTestForTable[]>([]);
  const [allTests, setAllTests] = useState<TopicTestForTable[]>([]); // کل آزمون‌ها برای فیلتر
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [folderFilterIds, setFolderFilterIds] = useState<number[]>([]);

  // هیچ فرم ویرایشی در این صفحه نیست

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testsResponse, folderTreeResponse] = await Promise.all([
        knowledgeApi.getTopicTests(),
        knowledgeApi.getFolderTree()
      ]);
      
      // Handle both array and pagination format for tests
  let testsData: TopicTestForTable[] = [];
      interface Paginated<T> { results: T[] }
      if (Array.isArray(testsResponse.data)) {
        testsData = testsResponse.data;
      } else if (testsResponse.data && typeof testsResponse.data === 'object') {
        const maybe = (testsResponse.data as Paginated<TopicTestForTable>).results;
        if (Array.isArray(maybe)) testsData = maybe; else testsData = [];
      }
      
  const folderTree: Folder[] = Array.isArray(folderTreeResponse.data) ? folderTreeResponse.data : [];
      setTests(testsData);
      setAllTests(testsData); // ذخیره کل آزمون‌ها برای فیلتر
  setFolders(folderTree);
      
  // فایل‌ها دیگر در این صفحه نیاز نیستند
    } catch (error) {
      toast.error('خطا در بارگذاری داده‌ها');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ویرایش در صفحه CreateTopicTestPage انجام می‌شود

  const handleEdit = (test: TopicTest) => {
    // هدایت به صفحه ویرایش یکپارچه (همان صفحه ساخت) به همراه testId
    navigate(`/panel/topic-tests/${test.id}/edit`);
  };

  const handleDelete = async (id: number) => {
    try {
      await knowledgeApi.deleteTopicTest(id);
      setTests(tests.filter(t => t.id !== id));
      toast.success('آزمون با موفقیت حذف شد');
    } catch (error) {
      toast.error('خطا در حذف آزمون');
      console.error(error);
    }
  };

  // Filter functions
  const applyFolderFilter = (selectedIds: number[]) => {
    setFolderFilterIds(selectedIds);
    if (selectedIds.length === 0) {
      setTests(allTests);
      return;
    }
  const filtered = allTests.filter((t: TopicTestForTable) => t.folders && t.folders.some((f: {id: number}) => selectedIds.includes(f.id)));
    setTests(filtered);
  };
  const resetFilters = () => {
    setFolderFilterIds([]);
    setTests(allTests);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:justify-between lg:items-center min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold truncate">مدیریت آزمون‌های مبحثی</h2>
          <p className="text-sm sm:text-base text-muted-foreground truncate">آزمون‌های مبحثی بر پایه پوشه‌ها</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2"
            size="sm"
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">فیلترها</span>
            <span className="sm:hidden">فیلتر</span>
          </Button>
          
          <Button onClick={() => navigate('/panel/topic-tests/create')} className="flex items-center justify-center gap-2" size="sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">آزمون جدید</span>
            <span className="sm:hidden">جدید</span>
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <Card className="w-full min-w-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="w-4 h-4" />
              فیلتر بر اساس پوشه‌ها
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="max-h-72 overflow-auto pr-2 border rounded p-3 space-y-1">
              {folders.length === 0 && <p className="text-sm text-muted-foreground">پوشه‌ای وجود ندارد</p>}
              {folders.length > 0 && (
                <FolderFilterTree tree={folders} selected={folderFilterIds} onChange={applyFolderFilter} />
              )}
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                پاک کردن فیلترها
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <div className="space-y-4 w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground gap-2 min-w-0">
          <span className="truncate">
            {tests.length === allTests.length 
              ? `نمایش ${tests.length} آزمون` 
              : `نمایش ${tests.length} از ${allTests.length} آزمون`
            }
          </span>
          {tests.length !== allTests.length && (
            <span className="text-primary whitespace-nowrap">فیلتر فعال</span>
          )}
        </div>
        
        <div className="w-full min-w-0">
          <DataTable 
            columns={topicTestColumns} 
            data={tests}
            searchPlaceholder="جستجو در آزمون‌ها..."
            meta={{
              handleEdit,
              handleDelete
            }}
          />
        </div>
      </div>

  {tests.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          {allTests.length === 0 ? (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ آزمونی وجود ندارد</h3>
              <p className="text-gray-600 mb-4">اولین آزمون مبحثی خود را ایجاد کنید</p>
              <Button onClick={() => navigate('/panel/topic-tests/create')}>
                <Plus className="w-4 h-4 mr-2" />
                ایجاد آزمون اول
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ آزمونی با این فیلتر یافت نشد</h3>
              <p className="text-gray-600 mb-4">لطفاً فیلترهای مختلفی را امتحان کنید</p>
              <Button variant="outline" onClick={resetFilters}>
                <RotateCcw className="w-4 h-4 mr-2" />
                پاک کردن فیلترها
              </Button>
            </>
          )}
        </div>
      )}

  {/* دیالوگ ویرایش حذف شد */}
    </div>
  );
}

// Simple recursive folder filter component (checkbox tree)
function FolderFilterTree({ tree, selected, onChange }: { tree: Folder[]; selected: number[]; onChange: (ids: number[]) => void }) {
  const toggle = (id: number, checked: boolean) => {
    if (checked) onChange([...selected, id]); else onChange(selected.filter(x => x !== id));
  };
  const render = (nodes: Folder[]): React.ReactElement => (
    <ul className="space-y-1">
      {nodes.map(n => (
        <li key={n.id}>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.includes(n.id)}
              onCheckedChange={(v) => toggle(n.id, !!v)}
            />
            <span className="text-sm font-iransans truncate max-w-[180px]" title={n.name}>{n.name}</span>
          </div>
      {Array.isArray((n as unknown as {children?: Folder[]}).children) && (n as unknown as {children?: Folder[]}).children!.length > 0 && (
            <div className="ms-4 border-s ps-3 mt-1">
        {render((n as unknown as {children?: Folder[]}).children as Folder[])}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
  return render(tree);
}
