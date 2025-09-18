import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FilterOptions {
  search: string;
  difficulty: string;
  folder: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface QuestionFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  stats?: {
    total_questions: number;
    by_difficulty: {
      easy: number;
      medium: number;
      hard: number;
    };
    folders: Array<{id: string; name: string; parent__name?: string}>;
  };
}

export function QuestionFilters({ onFiltersChange, stats }: QuestionFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    difficulty: '',
    folder: '',
    sortBy: 'created_at',
    sortOrder: 'desc'
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchDebounce }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchDebounce]);

  // Notify parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    // Convert "all" to empty string for API compatibility
    const actualValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: actualValue }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      difficulty: '',
      folder: '',
      sortBy: 'created_at',
      sortOrder: 'desc'
    });
    setSearchDebounce('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.difficulty) count++;
    if (filters.folder) count++;
    return count;
  };

  const getDifficultyLabel = (level: string) => {
    const labels = {
      easy: 'ساده',
      medium: 'متوسط',
      hard: 'دشوار'
    };
    return labels[level as keyof typeof labels] || level;
  };

  const getSelectedFolderName = () => {
    if (!filters.folder || !stats?.folders) return '';
    const folder = stats.folders.find(f => f.id === filters.folder);
    return folder ? (folder.parent__name ? `${folder.parent__name} > ${folder.name}` : folder.name) : '';
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="جستجو در متن سوالات..."
              value={searchDebounce}
              onChange={(e) => setSearchDebounce(e.target.value)}
              className="pr-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4 ml-2" />
                  فیلترها
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -left-2 h-5 w-5 rounded-full p-0 text-xs">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="mt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
                  {/* Difficulty Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">سطح دشواری</label>
                    <Select 
                      value={filters.difficulty || 'all'} 
                      onValueChange={(value) => handleFilterChange('difficulty', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="همه سطوح" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه سطوح</SelectItem>
                        <SelectItem value="easy">
                          ساده {stats && stats.by_difficulty && `(${stats.by_difficulty.easy})`}
                        </SelectItem>
                        <SelectItem value="medium">
                          متوسط {stats && stats.by_difficulty && `(${stats.by_difficulty.medium})`}
                        </SelectItem>
                        <SelectItem value="hard">
                          دشوار {stats && stats.by_difficulty && `(${stats.by_difficulty.hard})`}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Folder Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">پوشه</label>
                    <Select 
                      value={filters.folder || 'all'} 
                      onValueChange={(value) => handleFilterChange('folder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="همه پوشه‌ها" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه پوشه‌ها</SelectItem>
                        {stats?.folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id.toString()}>
                            {folder.parent__name ? `${folder.parent__name} > ${folder.name}` : folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort Options */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">مرتب‌سازی</label>
                    <div className="flex gap-2">
                      <Select 
                        value={filters.sortBy} 
                        onValueChange={(value) => handleFilterChange('sortBy', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">تاریخ ایجاد</SelectItem>
                          <SelectItem value="updated_at">آخرین بروزرسانی</SelectItem>
                          <SelectItem value="difficulty_level">سطح دشواری</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Select 
                        value={filters.sortOrder} 
                        onValueChange={(value: 'asc' | 'desc') => handleFilterChange('sortOrder', value)}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="desc">نزولی</SelectItem>
                          <SelectItem value="asc">صعودی</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {getActiveFiltersCount() > 0 && (
                  <div className="mt-3 flex justify-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="h-4 w-4 ml-1" />
                      پاک کردن فیلترها
                    </Button>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">فیلترهای فعال:</span>
            
            {filters.search && (
              <Badge variant="secondary" className="gap-1">
                جستجو: {filters.search}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => {
                    setSearchDebounce('');
                    handleFilterChange('search', '');
                  }}
                />
              </Badge>
            )}
            
            {filters.difficulty && (
              <Badge variant="secondary" className="gap-1">
                سطح: {getDifficultyLabel(filters.difficulty)}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('difficulty', '')}
                />
              </Badge>
            )}
            
            {filters.folder && (
              <Badge variant="secondary" className="gap-1">
                پوشه: {getSelectedFolderName()}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => handleFilterChange('folder', '')}
                />
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        {stats && (
          <div className="text-sm text-muted-foreground mt-2">
            مجموع {stats.total_questions} سوال یافت شد
          </div>
        )}
      </CardContent>
    </Card>
  );
}