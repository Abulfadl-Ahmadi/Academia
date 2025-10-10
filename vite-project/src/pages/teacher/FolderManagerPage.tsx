import { useEffect, useState } from 'react';
import { knowledgeApi } from '@/features/knowledge/api';
import type { Folder, QuestionStatistics } from '@/features/knowledge/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, RefreshCw, Trash2, Pencil, Save, X, ChevronRight, ChevronDown, FolderPlus, MoreVertical, Merge } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface EditingState { [id: number]: { name: string } }

export default function FolderManagerPage() {
  const [tree, setTree] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [parentId, setParentId] = useState<number | 'root'>('root');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditingState>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [inlineCreate, setInlineCreate] = useState<{[parentId:number]: string}>({});
  const [questionStats, setQuestionStats] = useState<QuestionStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Bulk selection states
  const [selectedFolders, setSelectedFolders] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Drag and drop states
  const [draggedFolder, setDraggedFolder] = useState<Folder | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<number | null>(null);
  const [moving, setMoving] = useState(false);

  // Merge folders states
  const [mergeMode, setMergeMode] = useState(false);
  const [sourceFolderId, setSourceFolderId] = useState<number | null>(null);
  const [destinationFolderId, setDestinationFolderId] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);

  const loadTree = async () => {
    try {
      setLoading(true);
      const res = await knowledgeApi.getFolderTree();
      setTree(res.data as Folder[]);
    } catch (e) {
      console.error(e);
      toast.error('خطا در بارگذاری پوشه‌ها');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionStats = async () => {
    try {
      setStatsLoading(true);
      const res = await knowledgeApi.getQuestionStatistics();
      setQuestionStats(res.data);
    } catch (e) {
      console.error(e);
      toast.error('خطا در بارگذاری آمار سوالات');
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => { 
    loadTree(); 
    loadQuestionStats();
  }, []);

  const flatten = (nodes: Folder[], acc: Folder[] = []) => {
    for (const n of nodes) {
      acc.push(n);
      if (n.children && n.children.length) flatten(n.children, acc);
    }
    return acc;
  };
  const allFolders = flatten(tree);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('نام پوشه را وارد کنید'); return; }
    setCreating(true);
    try {
      await knowledgeApi.createFolder({ name: newName.trim(), parent: parentId === 'root' ? null : parentId });
      setNewName('');
      setParentId('root');
      toast.success('پوشه ایجاد شد');
      loadTree();
      loadQuestionStats(); // Refresh stats after creating folder
    } catch (e) {
      console.error(e);
      toast.error('ایجاد پوشه ناموفق بود');
    } finally { setCreating(false); }
  };

  const startEdit = (f: Folder) => setEditing(prev => ({ ...prev, [f.id]: { name: f.name } }));
  const cancelEdit = (id: number) => setEditing(prev => { const cp = { ...prev }; delete cp[id]; return cp; });
  const commitEdit = async (id: number) => {
    const data = editing[id];
    if (!data || !data.name.trim()) { toast.error('نام معتبر نیست'); return; }
    setSaving(true);
    try {
      await knowledgeApi.updateFolder(id, { name: data.name.trim() });
      toast.success('ویرایش شد');
      cancelEdit(id);
      loadTree();
    } catch (e) { console.error(e); toast.error('ویرایش ناموفق بود'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف این پوشه و تمام زیرپوشه‌هایش؟')) return;
    setDeletingId(id);
    try {
      await knowledgeApi.deleteFolder(id);
      toast.success('حذف شد');
      loadTree();
      loadQuestionStats(); // Refresh stats after deleting folder
    } catch (e) { console.error(e); toast.error('حذف ناموفق بود'); }
    finally { setDeletingId(null); }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const quickCreate = async (parent: Folder) => {
    const name = inlineCreate[parent.id];
    if (!name || !name.trim()) { toast.error('نام را وارد کنید'); return; }
    try {
      setCreating(true);
      await knowledgeApi.createFolder({ name: name.trim(), parent: parent.id });
      setInlineCreate(prev => { const cp = { ...prev }; delete cp[parent.id]; return cp; });
      toast.success('زیرپوشه ایجاد شد');
      await loadTree();
      setExpanded(prev => new Set(prev).add(parent.id));
    } catch (e) { console.error(e); toast.error('ایجاد ناموفق'); }
    finally { setCreating(false); }
  };

  // Bulk selection functions
  const toggleBulkMode = () => {
    setBulkMode(!bulkMode);
    setSelectedFolders(new Set());
  };

  const toggleFolderSelection = (id: number) => {
    setSelectedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllFolders = () => {
    setSelectedFolders(new Set(allFolders.map(f => f.id)));
  };

  const clearSelection = () => {
    setSelectedFolders(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedFolders.size === 0) {
      toast.error('هیچ پوشه‌ای انتخاب نشده است');
      return;
    }

    const folderNames = allFolders
      .filter(f => selectedFolders.has(f.id))
      .map(f => `${f.name} (${f.questions_count} سوال)`)
      .join('، ');

    if (!confirm(`آیا مطمئن هستید که می‌خواهید این پوشه‌ها و تمام زیرپوشه‌هایشان را حذف کنید؟\n\n${folderNames}`)) {
      return;
    }

    setBulkDeleting(true);
    try {
      // Delete folders one by one
      for (const id of selectedFolders) {
        await knowledgeApi.deleteFolder(id);
      }
      toast.success(`${selectedFolders.size} پوشه با موفقیت حذف شد`);
      setSelectedFolders(new Set());
      setBulkMode(false);
      loadTree();
      loadQuestionStats(); // Refresh stats after bulk delete
    } catch (e) {
      console.error(e);
      toast.error('خطا در حذف برخی پوشه‌ها');
    } finally {
      setBulkDeleting(false);
    }
  };

  // Drag and drop functions
  const handleDragStart = (e: React.DragEvent, folder: Folder) => {
    if (bulkMode) return; // Disable drag in bulk mode
    setDraggedFolder(folder);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', folder.id.toString());
  };

  const handleDragOver = (e: React.DragEvent, targetFolder: Folder) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolder(targetFolder.id);
  };

  const handleDragLeave = () => {
    setDragOverFolder(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: Folder) => {
    e.preventDefault();
    setDragOverFolder(null);
    
    if (!draggedFolder || draggedFolder.id === targetFolder.id) {
      setDraggedFolder(null);
      return;
    }

    // Check if trying to move a folder into its own descendant
    const isDescendant = (folder: Folder, potentialAncestor: Folder): boolean => {
      if (!folder.children) return false;
      return folder.children.some(child => 
        child.id === potentialAncestor.id || isDescendant(child, potentialAncestor)
      );
    };

    if (isDescendant(draggedFolder, targetFolder)) {
      toast.error('نمی‌توان پوشه را به زیرپوشه خودش منتقل کرد');
      setDraggedFolder(null);
      return;
    }

    // Move the folder
    setMoving(true);
    try {
      await knowledgeApi.updateFolder(draggedFolder.id, { 
        name: draggedFolder.name,
        parent: targetFolder.id 
      });
      toast.success(`پوشه "${draggedFolder.name}" به زیرپوشه "${targetFolder.name}" منتقل شد`);
      loadTree();
      // Expand the target folder to show the moved folder
      setExpanded(prev => new Set(prev).add(targetFolder.id));
    } catch (e) {
      console.error(e);
      toast.error('انتقال پوشه ناموفق بود');
    } finally {
      setMoving(false);
      setDraggedFolder(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedFolder(null);
    setDragOverFolder(null);
  };

  const handleDropToRoot = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFolder || draggedFolder.parent === null) {
      setDraggedFolder(null);
      return;
    }

    setMoving(true);
    try {
      await knowledgeApi.updateFolder(draggedFolder.id, { 
        name: draggedFolder.name,
        parent: null 
      });
      toast.success(`پوشه "${draggedFolder.name}" به ریشه منتقل شد`);
      loadTree();
    } catch (e) {
      console.error(e);
      toast.error('انتقال پوشه ناموفق بود');
    } finally {
      setMoving(false);
      setDraggedFolder(null);
    }
  };

  // Merge folders function
  const handleMergeFolders = async () => {
    if (!sourceFolderId || !destinationFolderId) {
      toast.error('لطفاً هر دو پوشه را انتخاب کنید');
      return;
    }

    if (sourceFolderId === destinationFolderId) {
      toast.error('پوشه مبدا و مقصد نمی‌توانند یکسان باشند');
      return;
    }

    const sourceFolder = allFolders.find(f => f.id === sourceFolderId);
    const destinationFolder = allFolders.find(f => f.id === destinationFolderId);

    if (!sourceFolder || !destinationFolder) {
      toast.error('یکی از پوشه‌ها پیدا نشد');
      return;
    }

    const confirmMessage = `آیا مطمئن هستید که می‌خواهید تمام سوالات از پوشه "${sourceFolder.name}" (${sourceFolder.questions_count} سوال) به پوشه "${destinationFolder.name}" منتقل شوند؟

این عمل تمام سوالات را از پوشه مبدا حذف کرده و به پوشه مقصد اضافه می‌کند.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setMerging(true);
    try {
      const response = await knowledgeApi.mergeFolders(sourceFolderId, destinationFolderId);
      toast.success(response.data.message || 'ادغام با موفقیت انجام شد');
      
      // Reset merge mode and reload data
      setMergeMode(false);
      setSourceFolderId(null);
      setDestinationFolderId(null);
      loadTree();
      loadQuestionStats();
    } catch (e) {
      console.error(e);
      let errorMessage = 'خطا در ادغام پوشه‌ها';
      if (e && typeof e === 'object' && 'response' in e) {
        const response = (e as { response?: { data?: { error?: string } } }).response;
        if (response?.data?.error) {
          errorMessage = response.data.error;
        }
      }
      toast.error(errorMessage);
    } finally {
      setMerging(false);
    }
  };

  const renderTree = (nodes: Folder[], depth = 0) => (
    <ul className={depth === 0 ? 'space-y-1' : 'space-y-1 mt-1'}>
      {nodes.map(n => {
        const isEditing = !!editing[n.id];
        const hasChildren = !!n.children && n.children.length > 0;
        const isExpanded = expanded.has(n.id);
        return (
          <li key={n.id}>
            <div 
              className={`flex items-start gap-2 p-1 rounded transition-colors group ${
                dragOverFolder === n.id ? 'bg-primary/10 border-2 border-primary/30' : ''
              } ${draggedFolder?.id === n.id ? 'opacity-50' : ''} ${
                !bulkMode && !isEditing ? 'cursor-move hover:bg-muted/50' : ''
              }`}
              draggable={!bulkMode && !isEditing}
              onDragStart={(e) => handleDragStart(e, n)}
              onDragOver={(e) => handleDragOver(e, n)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, n)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center gap-1 min-h-7 flex-1">
                {/* Checkbox for bulk selection */}
                {bulkMode && (
                  <Checkbox
                    checked={selectedFolders.has(n.id)}
                    onCheckedChange={() => toggleFolderSelection(n.id)}
                    className="mr-1"
                  />
                )}
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(n.id)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <span className="w-5 h-5 inline-block" />
                )}
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editing[n.id].name}
                      onChange={e => setEditing(prev => ({ ...prev, [n.id]: { name: e.target.value } }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitEdit(n.id);
                        } else if (e.key === 'Escape') {
                          cancelEdit(n.id);
                        }
                      }}
                      className="h-7 flex-1"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span 
                        className="text-sm font-medium truncate cursor-help" 
                        title={n.name.length > 30 ? n.name : undefined}
                      >
                        {n.name}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm whitespace-nowrap">
                        {n.questions_count} سوال
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Action buttons */}
                {!bulkMode && isEditing && (
                  <div className="flex items-center gap-1 opacity-100">
                    <Button size="sm" variant="ghost" disabled={saving} onClick={() => commitEdit(n.id)}>
                      <Save className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => cancelEdit(n.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
                
                {!bulkMode && !isEditing && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => startEdit(n)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        ویرایش نام
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setInlineCreate(prev => ({ ...prev, [n.id]: prev[n.id] ?? '' }))}
                      >
                        <FolderPlus className="w-4 h-4 mr-2" />
                        افزودن زیرپوشه
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(n.id)}
                        disabled={deletingId === n.id}
                        className="text-destructive focus:text-destructive"
                      >
                        {deletingId === n.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4 mr-2" />
                        )}
                        حذف پوشه
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            {/* فرم ایجاد سریع زیرپوشه */}
            {!bulkMode && inlineCreate[n.id] !== undefined && (
              <div className="flex items-center gap-2 ms-6 mt-1">
                <Input
                  value={inlineCreate[n.id]}
                  onChange={e => setInlineCreate(prev => ({ ...prev, [n.id]: e.target.value }))}
                  placeholder="نام زیرپوشه"
                  className="h-7 w-48"
                />
                <Button size="sm" disabled={creating} onClick={() => quickCreate(n)}>
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setInlineCreate(prev => { const cp = { ...prev }; delete cp[n.id]; return cp; })}>
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
            {hasChildren && isExpanded && (
              <div className="ms-4 border-s ps-3 mt-1">
                {renderTree(n.children!, depth + 1)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">مدیریت پوشه‌ها (مباحث)</h1>
        <Button variant="outline" size="sm" onClick={loadTree} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Question Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            آمار کلی سوالات
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadQuestionStats} 
              disabled={statsLoading}
            >
              <RefreshCw className={`w-3 h-3 ${statsLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              در حال بارگذاری آمار...
            </div>
          ) : questionStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-lg border">
                <div className="text-2xl font-bold text-primary">
                  {questionStats.total_questions.toLocaleString('fa-IR')}
                </div>
                <div className="text-sm text-muted-foreground">تعداد کل سوالات</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {questionStats.questions_without_folders.toLocaleString('fa-IR')}
                </div>
                <div className="text-sm text-red-600/70 dark:text-red-400/70">
                  سوالات بدون پوشه ({questionStats.percentage_without_folders}%)
                </div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {questionStats.questions_with_folders.toLocaleString('fa-IR')}
                </div>
                <div className="text-sm text-green-600/70 dark:text-green-400/70">سوالات دارای پوشه</div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              خطا در بارگذاری آمار سوالات
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Folders Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="w-5 h-5" />
            ادغام پوشه‌ها
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              تمام سوالات از پوشه مبدا به پوشه مقصد منتقل می‌شوند. پوشه مبدا خالی خواهد شد.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs font-medium">پوشه مبدا (سوالات از اینجا منتقل می‌شوند)</label>
                <Select value={sourceFolderId?.toString() || ''} onValueChange={(v) => setSourceFolderId(v ? parseInt(v) : null)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="انتخاب پوشه مبدا" />
                  </SelectTrigger>
                  <SelectContent>
                    {allFolders.filter(f => f.questions_count > 0).map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {'— '.repeat(f.depth)}{f.name} ({f.questions_count} سوال)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">پوشه مقصد (سوالات به اینجا اضافه می‌شوند)</label>
                <Select value={destinationFolderId?.toString() || ''} onValueChange={(v) => setDestinationFolderId(v ? parseInt(v) : null)}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="انتخاب پوشه مقصد" />
                  </SelectTrigger>
                  <SelectContent>
                    {allFolders.map(f => (
                      <SelectItem key={f.id} value={String(f.id)}>
                        {'— '.repeat(f.depth)}{f.name} ({f.questions_count} سوال)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleMergeFolders} 
                  disabled={!sourceFolderId || !destinationFolderId || merging}
                  variant="destructive"
                >
                  {merging ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      در حال ادغام...
                    </>
                  ) : (
                    <>
                      <Merge className="w-4 h-4 mr-2" />
                      ادغام پوشه‌ها
                    </>
                  )}
                </Button>
              </div>
            </div>

            {sourceFolderId && destinationFolderId && sourceFolderId !== destinationFolderId && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>هشدار:</strong> تمام {allFolders.find(f => f.id === sourceFolderId)?.questions_count} سوال از پوشه "{allFolders.find(f => f.id === sourceFolderId)?.name}" 
                  به پوشه "{allFolders.find(f => f.id === destinationFolderId)?.name}" منتقل خواهد شد.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>ایجاد پوشه جدید</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium">نام</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="مثال: هندسه دهم" className="w-56" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">والد</label>
              <Select value={parentId.toString()} onValueChange={(v) => setParentId(v === 'root' ? 'root' : parseInt(v))}>
                <SelectTrigger className="w-56 h-9 text-sm">
                  <SelectValue placeholder="والد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">[ریشه]</SelectItem>
                  {allFolders.map(f => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {'— '.repeat(f.depth)}{f.name} ({f.questions_count} سوال)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}ایجاد
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ساختار پوشه‌ها</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={bulkMode ? "default" : "outline"}
                size="sm"
                onClick={toggleBulkMode}
              >
                {bulkMode ? "لغو انتخاب گروهی" : "انتخاب گروهی"}
              </Button>
              {bulkMode && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllFolders}
                    disabled={selectedFolders.size === allFolders.length}
                  >
                    انتخاب همه
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSelection}
                    disabled={selectedFolders.size === 0}
                  >
                    لغو انتخاب
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={selectedFolders.size === 0 || bulkDeleting}
                  >
                    {bulkDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        در حال حذف...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-1" />
                        حذف انتخاب شده‌ها ({selectedFolders.size})
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> در حال بارگذاری...</div>
          ) : tree.length === 0 ? (
            <p className="text-sm text-muted-foreground">هیچ پوشه‌ای هنوز ایجاد نشده است.</p>
          ) : (
            <div className="relative">
              {moving && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded">
                  <div className="flex items-center gap-2 text-sm bg-background px-3 py-2 rounded-lg shadow-lg border">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    در حال انتقال پوشه...
                  </div>
                </div>
              )}
              <div className="max-h-[600px] overflow-auto pr-2">
                {!bulkMode && (
                  <div className="text-xs text-muted-foreground mb-2 p-2 bg-primary/5 rounded border-l-4 border-primary/30">
                    💡 برای انتقال پوشه، آن را بگیرید و روی پوشه مقصد رها کنید. برای انتقال به ریشه، روی فضای خالی رها کنید.
                  </div>
                )}
                <div 
                  className="min-h-[400px]"
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                  onDrop={handleDropToRoot}
                >
                  {renderTree(tree)}
                  {draggedFolder && (
                    <div className="mt-4 p-2 border-2 border-dashed border-muted-foreground/30 rounded text-center text-sm text-muted-foreground">
                      اینجا رها کنید تا به ریشه منتقل شود
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
