import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { FolderTreeSelector } from '@/components/FolderTreeSelector';

interface FilterOptions {
  search: string;
  publicIdSearch: string;
  difficulty: string;
  folders: number[];
  questionCollections: number[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  isActive: string;
  source: string;
  hasSolution: string;
  hasImages: string;
  dateFrom: string;
  dateTo: string;
  hasNoCollection: boolean;
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
    by_status: {
      active: number;
      inactive: number;
    };
    by_content: {
      with_solution: number;
      without_solution: number;
      with_images: number;
      without_images: number;
    };
    folders: Array<{id: string; name: string; parent__name?: string}>;
    question_collections: Array<{id: number; name: string; total_questions: number}>;
  };
}

export function QuestionFilters({ onFiltersChange, stats }: QuestionFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    publicIdSearch: '',
    difficulty: '',
    folders: [],
    questionCollections: [],
    sortBy: 'created_at',
    sortOrder: 'desc',
    isActive: '',
    source: '',
    hasSolution: '',
    hasImages: '',
    dateFrom: '',
    dateTo: '',
    hasNoCollection: false,
  });
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchDebounce, setSearchDebounce] = useState('');
  const [publicIdSearchDebounce, setPublicIdSearchDebounce] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchDebounce }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchDebounce]);

  // Debounce public ID search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, publicIdSearch: publicIdSearchDebounce }));
    }, 500);

    return () => clearTimeout(timer);
  }, [publicIdSearchDebounce]);

  // Notify parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterOptions, value: string | number[] | boolean) => {
    // Convert "all" to empty string for API compatibility
    const actualValue = value === 'all' ? '' : value;
    setFilters(prev => ({ ...prev, [key]: actualValue }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      publicIdSearch: '',
      difficulty: '',
      folders: [],
      questionCollections: [],
      sortBy: 'created_at',
      sortOrder: 'desc',
      isActive: '',
      source: '',
      hasSolution: '',
      hasImages: '',
      dateFrom: '',
      dateTo: '',
      hasNoCollection: false,
    });
    setSearchDebounce('');
    setPublicIdSearchDebounce('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.publicIdSearch) count++;
    if (filters.difficulty) count++;
    if (filters.folders.length > 0) count++;
    if (filters.questionCollections.length > 0) count++;
    if (filters.isActive) count++;
    if (filters.source) count++;
    if (filters.hasSolution) count++;
    if (filters.hasImages) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.hasNoCollection) count++;
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

  const getSelectedFolderNames = () => {
    if (filters.folders.length === 0) return '';
    // Since FolderTreeSelector handles its own folder tree, we'll just return the folder IDs for now
    // The component will display the proper names
    return `${filters.folders.length} پوشه انتخاب شده`;
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Search Bars */}
        <div className="space-y-3 mb-4 flex flex-row gap-2">
          {/* General Search */}
          <div className="flex flex-col sm:flex-row gap-3 grow">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="جستجو در متن سوالات و پاسخ تشریحی..."
                value={searchDebounce}
                onChange={(e) => setSearchDebounce(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          
          {/* Public ID Search */}
          <div className="flex flex-col sm:flex-row gap-3 w-20">
              <Input
                placeholder="شناسه"
                value={publicIdSearchDebounce}
                onChange={(e) => setPublicIdSearchDebounce(e.target.value)}
                maxLength={6}
              />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mb-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
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
                  <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium">پوشه</label>
                    <FolderTreeSelector
                      selectedFolderIds={filters.folders}
                      onSelectionChange={(folderIds) => setFilters(prev => ({ ...prev, folders: folderIds }))}
                      placeholder="همه پوشه‌ها"
                      maxHeight="max-h-64"
                      showSelectedCount={false}
                    />
                  </div>

                  {/* Question Collections Filter */}
                  <div className="space-y-2 col-span-1 md:col-span-2 lg:col-span-3">
                    <label className="text-sm font-medium">مجموعه‌های سوال</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id="hasNoCollection"
                          checked={filters.hasNoCollection}
                          onCheckedChange={(checked) => handleFilterChange('hasNoCollection', checked as boolean)}
                        />
                        <label htmlFor="hasNoCollection" className="text-sm font-medium">
                          سوالات بدون مجموعه
                        </label>
                      </div>
                      
                      {stats?.question_collections && stats.question_collections.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                          {stats.question_collections.map((collection) => (
                            <div key={collection.id} className="flex items-center space-x-2 space-x-reverse">
                              <Checkbox
                                id={`collection-${collection.id}`}
                                checked={filters.questionCollections.includes(collection.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setFilters(prev => ({
                                      ...prev,
                                      questionCollections: [...prev.questionCollections, collection.id]
                                    }));
                                  } else {
                                    setFilters(prev => ({
                                      ...prev,
                                      questionCollections: prev.questionCollections.filter(id => id !== collection.id)
                                    }));
                                  }
                                }}
                              />
                              <label htmlFor={`collection-${collection.id}`} className="text-sm">
                                {collection.name} ({collection.total_questions})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Active Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">وضعیت</label>
                    <Select 
                      value={filters.isActive || 'all'} 
                      onValueChange={(value) => handleFilterChange('isActive', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="همه وضعیت‌ها" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                        <SelectItem value="true">
                          فعال {stats?.by_status && `(${stats.by_status.active})`}
                        </SelectItem>
                        <SelectItem value="false">
                          غیرفعال {stats?.by_status && `(${stats.by_status.inactive})`}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>                  {/* Source Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">منبع</label>
                    <Input
                      placeholder="منبع سوال..."
                      value={filters.source}
                      onChange={(e) => handleFilterChange('source', e.target.value)}
                    />
                  </div>

                  {/* Has Solution Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">راه‌حل</label>
                    <Select
                      value={filters.hasSolution || 'all'}
                      onValueChange={(value) => handleFilterChange('hasSolution', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="همه سوالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه سوالات</SelectItem>
                        <SelectItem value="true">
                          دارای راه‌حل {stats?.by_content && `(${stats.by_content.with_solution})`}
                        </SelectItem>
                        <SelectItem value="false">
                          بدون راه‌حل {stats?.by_content && `(${stats.by_content.without_solution})`}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Has Images Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تصاویر</label>
                    <Select
                      value={filters.hasImages || 'all'}
                      onValueChange={(value) => handleFilterChange('hasImages', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="همه سوالات" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه سوالات</SelectItem>
                        <SelectItem value="true">
                          دارای تصویر {stats?.by_content && `(${stats.by_content.with_images})`}
                        </SelectItem>
                        <SelectItem value="false">
                          بدون تصویر {stats?.by_content && `(${stats.by_content.without_images})`}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date From */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">از تاریخ</label>
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>

                  {/* Date To */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">تا تاریخ</label>
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
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
            
            {filters.folders.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                پوشه: {getSelectedFolderNames()}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('folders', [])}
                />
              </Badge>
            )}

            {filters.questionCollections.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                مجموعه‌ها: {filters.questionCollections.length} انتخاب شده
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('questionCollections', [])}
                />
              </Badge>
            )}

            {filters.hasNoCollection && (
              <Badge variant="secondary" className="gap-1">
                بدون مجموعه
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('hasNoCollection', false)}
                />
              </Badge>
            )}

            {filters.isActive && (
              <Badge variant="secondary" className="gap-1">
                وضعیت: {filters.isActive === 'true' ? 'فعال' : 'غیرفعال'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('isActive', '')}
                />
              </Badge>
            )}

            {filters.source && (
              <Badge variant="secondary" className="gap-1">
                منبع: {filters.source}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('source', '')}
                />
              </Badge>
            )}

            {filters.hasSolution && (
              <Badge variant="secondary" className="gap-1">
                راه‌حل: {filters.hasSolution === 'true' ? 'دارد' : 'ندارد'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('hasSolution', '')}
                />
              </Badge>
            )}

            {filters.hasImages && (
              <Badge variant="secondary" className="gap-1">
                تصویر: {filters.hasImages === 'true' ? 'دارد' : 'ندارد'}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('hasImages', '')}
                />
              </Badge>
            )}

            {filters.dateFrom && (
              <Badge variant="secondary" className="gap-1">
                از تاریخ: {filters.dateFrom}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('dateFrom', '')}
                />
              </Badge>
            )}

            {filters.dateTo && (
              <Badge variant="secondary" className="gap-1">
                تا تاریخ: {filters.dateTo}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleFilterChange('dateTo', '')}
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