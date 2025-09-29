import React, { useState, useEffect } from 'react';
import { Folder as FolderIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { knowledgeApi } from '@/features/knowledge/api';
import type { Folder } from '@/features/knowledge/types';

// توسعه نوع Folder برای داشتن children اختیاری بدون استفاده از any
interface FolderWithChildren extends Folder { children?: FolderWithChildren[] }

const hasChildren = (f: Folder | FolderWithChildren): f is FolderWithChildren => Array.isArray((f as FolderWithChildren).children);

interface FolderTreeSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const FolderTreeSelect: React.FC<FolderTreeSelectProps> = ({
  value,
  onValueChange,
  placeholder = "همه پوشه‌ها",
  className = ""
}) => {
  const [folderTree, setFolderTree] = useState<Folder[]>([]);
  const [folderLoading, setFolderLoading] = useState<boolean>(false);

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

  // رندر درخت پوشه‌ها به صورت تودرتو برای SelectContent
  const renderFolderOptions = (nodes: (Folder | FolderWithChildren)[], depth: number = 0): React.ReactNode[] => {
    return nodes.flatMap(node => {
      const children = hasChildren(node) ? node.children : undefined;
      const childExists = !!children && children.length > 0;
      const indent = '  '.repeat(depth);
      const prefix = depth > 0 ? '└─ ' : '';
      const displayName = indent + prefix + node.name;

      const currentOption = (
        <SelectItem key={node.id} value={node.id.toString()}>
          <div className="flex items-center gap-2">
            <FolderIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="font-mono text-sm truncate">{displayName}</span>
          </div>
        </SelectItem>
      );

      if (childExists) {
        return [currentOption, ...renderFolderOptions(children, depth + 1)];
      }

      return [currentOption];
    });
  };

  const getSelectedFolderName = () => {
    if (!value || !folderTree.length) return placeholder;

    const findFolderName = (nodes: (Folder | FolderWithChildren)[]): string | null => {
      for (const node of nodes) {
        if (node.id.toString() === value) {
          return node.name;
        }
        const children = hasChildren(node) ? node.children : undefined;
        if (children) {
          const childName = findFolderName(children);
          if (childName) return childName;
        }
      }
      return null;
    };

    return findFolderName(folderTree) || placeholder;
  };

  return (
    <Select value={value || 'all'} onValueChange={(val) => onValueChange(val === 'all' ? '' : val)}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder}>
          <div className="flex items-center gap-2">
            <FolderIcon className="w-4 h-4 text-muted-foreground" />
            <span>{getSelectedFolderName()}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-96">
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <FolderIcon className="w-4 h-4 text-muted-foreground" />
            <span>{placeholder}</span>
          </div>
        </SelectItem>
        {folderLoading && (
          <div className="p-2 text-sm text-muted-foreground">در حال بارگذاری...</div>
        )}
        {!folderLoading && folderTree.length === 0 && (
          <div className="p-2 text-sm text-muted-foreground">هیچ پوشه‌ای ایجاد نشده است.</div>
        )}
        {!folderLoading && folderTree.length > 0 && renderFolderOptions(folderTree)}
      </SelectContent>
    </Select>
  );
};