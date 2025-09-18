import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { knowledgeApi } from '@/features/knowledge/api';
import type { Folder } from '@/features/knowledge/types';

// توسعه نوع Folder برای داشتن children اختیاری بدون استفاده از any
interface FolderWithChildren extends Folder { children?: FolderWithChildren[] }

const hasChildren = (f: Folder | FolderWithChildren): f is FolderWithChildren => Array.isArray((f as FolderWithChildren).children);

interface FolderSelectorProps {
  selectedFolderIds: number[];
  onSelectionChange: (folderIds: number[]) => void;
  className?: string;
  maxHeight?: string;
  showSelectedCount?: boolean;
  required?: boolean;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  selectedFolderIds,
  onSelectionChange,
  className = "",
  maxHeight = "max-h-96",
  showSelectedCount = true,
  required = false
}) => {
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [folderLoading, setFolderLoading] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());

  // Load folder tree
  useEffect(() => {
    const loadFolders = async () => {
      setFolderLoading(true);
      try {
        const fRes = await knowledgeApi.getFolderTree();
        const tree = fRes.data as FolderWithChildren[];
        setFolderTree(tree);
      } catch (error) {
        console.error('خطا در بارگذاری پوشه‌ها:', error);
      } finally {
        setFolderLoading(false);
      }
    };

    loadFolders();
  }, []);

  // مدیریت باز/بسته شدن نودها
  const toggleExpand = (id: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // رندر درخت پوشه‌ها به صورت تودرتو و تاشونده
  const renderFolders = (nodes: (Folder | FolderWithChildren)[], depth: number = 0) => (
    <ul className="space-y-1">
      {nodes.map(node => {
        const children = hasChildren(node) ? node.children : undefined;
        const childExists = !!children && children.length > 0;
        const expanded = childExists && expandedFolders.has(node.id);
        const checked = selectedFolderIds.includes(node.id);
        return (
          <li key={node.id}>
            <div className="flex items-center gap-2">
              {childExists ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.id)}
                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted transition"
                  aria-label={expanded ? 'Collapse' : 'Expand'}
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-5 h-5 inline-block" />
              )}
              <Checkbox
                checked={checked}
                onCheckedChange={(val) => {
                  onSelectionChange(val ? [...selectedFolderIds, node.id] : selectedFolderIds.filter(id => id !== node.id));
                }}
              />
              <FolderIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-[200px]" title={node.name}>{node.name}</span>
              <span className="text-xs text-muted-foreground">#{node.id}</span>
            </div>
            {childExists && expanded && (
              <div className="ms-6 border-s ps-3 mt-1">
                {children && renderFolders(children, depth + 1)}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground">
        پوشه‌ها جایگزین ساختار قدیمی (کتاب، فصل، ... ) شده‌اند. {required ? 'حداقل یک پوشه را انتخاب کنید.' : 'پوشه‌ها را انتخاب کنید.'}
      </div>
      <div className={`${maxHeight} overflow-auto pr-2 border rounded p-3 mt-2`}>
        {folderLoading && <p className="text-sm">در حال بارگذاری...</p>}
        {!folderLoading && folderTree.length === 0 && <p className="text-sm text-muted-foreground">هیچ پوشه‌ای ایجاد نشده است.</p>}
        {!folderLoading && folderTree.length > 0 && renderFolders(folderTree)}
      </div>
      {showSelectedCount && selectedFolderIds.length > 0 && (
        <div className="text-xs text-green-600 mt-2">{selectedFolderIds.length} پوشه انتخاب شد</div>
      )}
    </div>
  );
};