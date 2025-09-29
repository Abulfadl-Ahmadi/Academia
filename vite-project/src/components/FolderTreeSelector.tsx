import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, Folder as FolderIcon } from 'lucide-react';
import { knowledgeApi } from '@/features/knowledge/api';
import type { Folder } from '@/features/knowledge/types';

// توسعه نوع Folder برای داشتن children اختیاری بدون استفاده از any
interface FolderWithChildren extends Folder { children?: FolderWithChildren[] }

const hasChildren = (f: Folder | FolderWithChildren): f is FolderWithChildren => Array.isArray((f as FolderWithChildren).children);

interface FolderTreeSelectorProps {
  selectedFolderIds: number[];
  onSelectionChange: (folderIds: number[]) => void;
  placeholder?: string;
  className?: string;
  maxHeight?: string;
  required?: boolean;
  showSelectedCount?: boolean;
}

export const FolderTreeSelector: React.FC<FolderTreeSelectorProps> = ({
  selectedFolderIds,
  onSelectionChange,
  placeholder = "انتخاب پوشه",
  className = "",
  maxHeight = "max-h-96",
  required = false,
  showSelectedCount = true
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

  // انتخاب پوشه
  const selectFolder = (folderId: number) => {
    const isSelected = selectedFolderIds.includes(folderId);
    if (isSelected) {
      onSelectionChange(selectedFolderIds.filter(id => id !== folderId));
    } else {
      onSelectionChange([...selectedFolderIds, folderId]);
    }
  };

  // رندر درخت پوشه‌ها به صورت تودرتو و تاشونده
  const renderFolders = (nodes: (Folder | FolderWithChildren)[], depth: number = 0) => (
    <ul className="space-y-1">
      {nodes.map(node => {
        const children = hasChildren(node) ? node.children : undefined;
        const childExists = !!children && children.length > 0;
        const expanded = childExists && expandedFolders.has(node.id);
        const selected = selectedFolderIds.includes(node.id);
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
              <button
                type="button"
                onClick={() => selectFolder(node.id)}
                className={`flex-1 flex items-center gap-2 p-2 rounded hover:bg-muted transition text-left ${
                  selected ? 'bg-primary/10 border border-primary/20' : ''
                }`}
              >
                <FolderIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate" title={node.name}>{node.name}</span>
                <span className="text-xs text-muted-foreground">#{node.id}</span>
              </button>
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

  const getSelectedFolderNames = () => {
    if (selectedFolderIds.length === 0 || !folderTree.length) return placeholder;

    const selectedNames = selectedFolderIds.map(id => {
      const findNode = (nodes: (Folder | FolderWithChildren)[]): Folder | null => {
        for (const node of nodes) {
          if (node.id === id) return node;
          if (hasChildren(node) && node.children) {
            const found = findNode(node.children);
            if (found) return found;
          }
        }
        return null;
      };
      const folder = findNode(folderTree);
      return folder ? folder.name : `ID: ${id}`;
    });

    return selectedNames.join(', ');
  };

  return (
    <div className={className}>
      <div className="text-xs text-muted-foreground mb-2">
        {required ? 'یک پوشه را انتخاب کنید.' : 'پوشه‌ها جایگزین ساختار قدیمی (کتاب، فصل، ... ) شده‌اند.'}
      </div>
      <div className={`${maxHeight} overflow-auto pr-2 border rounded p-3`}>
        {folderLoading && <p className="text-sm">در حال بارگذاری...</p>}
        {!folderLoading && folderTree.length === 0 && <p className="text-sm text-muted-foreground">هیچ پوشه‌ای ایجاد نشده است.</p>}
        {!folderLoading && folderTree.length > 0 && renderFolders(folderTree)}
      </div>
      {showSelectedCount && selectedFolderIds.length > 0 && (
        <div className="text-xs text-green-600 mt-2">
          {selectedFolderIds.length} پوشه انتخاب شد: {getSelectedFolderNames()}
        </div>
      )}
    </div>
  );
};