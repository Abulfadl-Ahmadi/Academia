import { useEffect, useState } from 'react';
import { knowledgeApi } from '@/features/knowledge/api';
import type { Folder } from '@/features/knowledge/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, RefreshCw, Trash2, Pencil, Save, X } from 'lucide-react';

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

  useEffect(() => { loadTree(); }, []);

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
    } catch (e) { console.error(e); toast.error('حذف ناموفق بود'); }
    finally { setDeletingId(null); }
  };

  const renderTree = (nodes: Folder[], depth = 0) => (
    <ul className={depth === 0 ? 'space-y-1' : 'space-y-1 mt-1'}>
      {nodes.map(n => {
        const isEditing = !!editing[n.id];
        return (
          <li key={n.id}>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{n.path_ids.join(' / ')}</span>
              {isEditing ? (
                <Input
                  value={editing[n.id].name}
                  onChange={e => setEditing(prev => ({ ...prev, [n.id]: { name: e.target.value } }))}
                  className="h-7 w-40"
                />
              ) : (
                <span className="text-sm font-medium">{n.name}</span>
              )}
              {!isEditing && (
                <Button size="sm" variant="ghost" onClick={() => startEdit(n)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
              )}
              {isEditing && (
                <>
                  <Button size="sm" variant="ghost" disabled={saving} onClick={() => commitEdit(n.id)}>
                    <Save className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => cancelEdit(n.id)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                disabled={deletingId === n.id}
                onClick={() => handleDelete(n.id)}
              >
                {deletingId === n.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            </div>
            {n.children && n.children.length > 0 && (
              <div className="ms-4 border-s ps-3">
                {renderTree(n.children, depth + 1)}
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
                    <SelectItem key={f.id} value={String(f.id)}>{'— '.repeat(f.depth)}{f.name}</SelectItem>
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
          <CardTitle>ساختار پوشه‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> در حال بارگذاری...</div>
          ) : tree.length === 0 ? (
            <p className="text-sm text-muted-foreground">هیچ پوشه‌ای هنوز ایجاد نشده است.</p>
          ) : (
            <div className="max-h-[600px] overflow-auto pr-2">
              {renderTree(tree)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
