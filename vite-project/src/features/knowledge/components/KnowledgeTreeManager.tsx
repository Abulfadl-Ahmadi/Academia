import { useState, useEffect } from 'react';
import { 
  Plus,
  Edit,
  Folder,
  FolderOpen,
  Book,
  BookOpen,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { knowledgeApi } from '../api';
import type { 
  Subject,
  CreateChapterData,
  CreateSectionData,
  CreateTopicData
} from '../types';

export function KnowledgeTreeManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  
  // Form states
  const [isChapterDialogOpen, setIsChapterDialogOpen] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);

  const [chapterForm, setChapterForm] = useState<CreateChapterData>({
    subject: 0,
    name: '',
    order: 1,
    description: '',
  });

  const [sectionForm, setSectionForm] = useState<CreateSectionData>({
    chapter: 0,
    name: '',
    order: 1,
    description: '',
  });

  const [topicForm, setTopicForm] = useState<CreateTopicData>({
    section: 0,
    name: '',
    order: 1,
    description: '',
    difficulty: 'intermediate',
    tags: '',
    estimated_study_time: 30,
  });

  useEffect(() => {
    loadKnowledgeTree();
  }, []);

  const loadKnowledgeTree = async () => {
    try {
      const response = await knowledgeApi.getKnowledgeTree();
      setSubjects(response.data);
    } catch (error) {
      toast.error('خطا در بارگذاری درخت دانش');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubject = (subjectId: number) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const toggleChapter = (chapterId: number) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeApi.createChapter(chapterForm);
      toast.success('فصل جدید ایجاد شد');
      setIsChapterDialogOpen(false);
      loadKnowledgeTree();
      setChapterForm({ subject: 0, name: '', order: 1, description: '' });
    } catch (error) {
      toast.error('خطا در ایجاد فصل');
      console.error(error);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeApi.createSection(sectionForm);
      toast.success('زیربخش جدید ایجاد شد');
      setIsSectionDialogOpen(false);
      loadKnowledgeTree();
      setSectionForm({ chapter: 0, name: '', order: 1, description: '' });
    } catch (error) {
      toast.error('خطا در ایجاد زیربخش');
      console.error(error);
    }
  };

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await knowledgeApi.createTopic(topicForm);
      toast.success('مبحث جدید ایجاد شد');
      setIsTopicDialogOpen(false);
      loadKnowledgeTree();
      setTopicForm({
        section: 0,
        name: '',
        order: 1,
        description: '',
        difficulty: 'intermediate',
        tags: '',
        estimated_study_time: 30,
      });
    } catch (error) {
      toast.error('خطا در ایجاد مبحث');
      console.error(error);
    }
  };

  const openChapterDialog = (subjectId: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    setChapterForm({
      subject: subjectId,
      name: '',
      order: (subject?.chapters.length || 0) + 1,
      description: '',
    });
    setIsChapterDialogOpen(true);
  };

  const openSectionDialog = (chapterId: number) => {
    let section_count = 0;
    for (const subject of subjects) {
      const chapter = subject.chapters.find(c => c.id === chapterId);
      if (chapter) {
        section_count = chapter.sections.length;
        break;
      }
    }
    setSectionForm({
      chapter: chapterId,
      name: '',
      order: section_count + 1,
      description: '',
    });
    setIsSectionDialogOpen(true);
  };

  const openTopicDialog = (sectionId: number) => {
    let topic_count = 0;
    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const section = chapter.sections.find(s => s.id === sectionId);
        if (section) {
          topic_count = section.topics.length;
          break;
        }
      }
    }
    setTopicForm({
      section: sectionId,
      name: '',
      order: topic_count + 1,
      description: '',
      difficulty: 'intermediate',
      tags: '',
      estimated_study_time: 30,
    });
    setIsTopicDialogOpen(true);
  };

  const getDifficultyBadgeColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/5 text-green-600/90';
      case 'intermediate': return 'bg-yellow-500/5 text-yellow-600/90';
      case 'advanced': return 'bg-orange-500/5 text-orange-600/90';
      case 'expert': return 'bg-red-500/5 text-red-600/90';
      default: return 'bg-gray-500/5 text-gray-600/90';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'مبتدی';
      case 'intermediate': return 'متوسط';
      case 'advanced': return 'پیشرفته';
      case 'expert': return 'تخصصی';
      default: return difficulty;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">درخت دانش</h2>
          <p className="text-sm text-muted-foreground">ساختار سلسله‌مراتبی مباحث آموزشی</p>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4" dir="rtl">
        <div className="text-sm">
          {subjects.map((subject) => (
            <div key={subject.id} className="mb-2">
              {/* Subject Level */}
              <div 
                className="flex items-center gap-3 hover:bg-muted/50 rounded px-3 py-1 cursor-pointer group"
                onClick={() => toggleSubject(subject.id)}
              >
                {expandedSubjects.has(subject.id) ? 
                  <FolderOpen className="w-5 h-5" /> : 
                  <Folder className="w-5 h-5" />
                }
                <span className="font-semibold">{subject.name}</span>
                <span className="text-xs text-muted-foreground">({subject.grade} پایه)</span>
                <div className="flex items-center gap-1 mr-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge variant="secondary" className="text-xs">{subject.chapters.length}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      openChapterDialog(subject.id);
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Chapters */}
              {expandedSubjects.has(subject.id) && (
                <div className="mr-5 mt-1 space-y-1 border-r border-muted-foreground/20 pr-1">
                  {subject.chapters.map((chapter) => (
                    <div key={chapter.id}>
                      <div 
                        className="flex items-center gap-3 hover:bg-muted/30 rounded px-3 py-1 cursor-pointer group"
                        onClick={() => toggleChapter(chapter.id)}
                      >
                        {expandedChapters.has(chapter.id) ? 
                          <BookOpen className="w-4 h-4" /> : 
                          <Book className="w-4 h-4" />
                        }
                        <span className="font-medium">فصل {chapter.order}: {chapter.name}</span>
                        <div className="flex items-center gap-1 mr-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <Badge variant="outline" className="text-xs">{chapter.sections.length}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openSectionDialog(chapter.id);
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Sections */}
                      {expandedChapters.has(chapter.id) && (
                        <div className="mr-5 mt-1 space-y-1 border-r border-muted-foreground/15 pr-1">
                          {chapter.sections.map((section) => (
                            <div key={section.id}>
                              <div 
                                className="flex items-center gap-3 hover:bg-muted/20 rounded px-3 py-1 cursor-pointer group"
                                onClick={() => toggleSection(section.id)}
                              >
                                <FileText className="w-4 h-4" />
                                <span>{section.name}</span>
                                <div className="flex items-center gap-1 mr-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Badge variant="outline" className="text-xs">{section.topics.length}</Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openTopicDialog(section.id);
                                    }}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Topics */}
                              {expandedSections.has(section.id) && (
                                <div className="mr-5 mt-1 space-y-1 border-r border-muted-foreground/10 pr-1">
                                  {section.topics.map((topic) => (
                                    <div key={topic.id}>
                                      <div className="flex items-center gap-3 hover:bg-muted/10 rounded px-3 py-1 group">
                                        {/* <Target className="w-4 h-4" /> */}
                                        <span className="text-sm">{topic.name}</span>
                                        <Badge 
                                          className={`text-xs ml-2 ${getDifficultyBadgeColor(topic.difficulty)}`}
                                        >
                                          {getDifficultyLabel(topic.difficulty)}
                                        </Badge>
                                        <div className="flex items-center gap-1 mr-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                          <span className="text-xs text-muted-foreground">{topic.estimated_study_time}د</span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chapter Dialog */}
      <Dialog open={isChapterDialogOpen} onOpenChange={setIsChapterDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد فصل جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateChapter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chapter-name">نام فصل</Label>
              <Input
                id="chapter-name"
                value={chapterForm.name}
                onChange={(e) => setChapterForm({...chapterForm, name: e.target.value})}
                placeholder="مثال: مبانی هندسه"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chapter-order">شماره فصل</Label>
              <Input
                id="chapter-order"
                type="number"
                value={chapterForm.order}
                onChange={(e) => setChapterForm({...chapterForm, order: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="chapter-description">توضیحات</Label>
              <Textarea
                id="chapter-description"
                value={chapterForm.description}
                onChange={(e) => setChapterForm({...chapterForm, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsChapterDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">ایجاد فصل</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد زیربخش جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSection} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="section-name">نام زیربخش</Label>
              <Input
                id="section-name"
                value={sectionForm.name}
                onChange={(e) => setSectionForm({...sectionForm, name: e.target.value})}
                placeholder="مثال: مفاهیم پایه"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section-order">ترتیب</Label>
              <Input
                id="section-order"
                type="number"
                value={sectionForm.order}
                onChange={(e) => setSectionForm({...sectionForm, order: parseInt(e.target.value)})}
                min="1"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="section-description">توضیحات</Label>
              <Textarea
                id="section-description"
                value={sectionForm.description}
                onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">ایجاد زیربخش</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ایجاد مبحث جدید</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTopic} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic-name">نام مبحث</Label>
              <Input
                id="topic-name"
                value={topicForm.name}
                onChange={(e) => setTopicForm({...topicForm, name: e.target.value})}
                placeholder="مثال: قضیه تالس"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic-order">ترتیب</Label>
                <Input
                  id="topic-order"
                  type="number"
                  value={topicForm.order}
                  onChange={(e) => setTopicForm({...topicForm, order: parseInt(e.target.value)})}
                  min="1"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="topic-time">زمان مطالعه (دقیقه)</Label>
                <Input
                  id="topic-time"
                  type="number"
                  value={topicForm.estimated_study_time}
                  onChange={(e) => setTopicForm({...topicForm, estimated_study_time: parseInt(e.target.value)})}
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic-difficulty">سطح دشواری</Label>
              <Select 
                value={topicForm.difficulty} 
                onValueChange={(value: 'beginner' | 'intermediate' | 'advanced' | 'expert') => setTopicForm({...topicForm, difficulty: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">مبتدی</SelectItem>
                  <SelectItem value="intermediate">متوسط</SelectItem>
                  <SelectItem value="advanced">پیشرفته</SelectItem>
                  <SelectItem value="expert">تخصصی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic-tags">تگ‌ها (اختیاری)</Label>
              <Input
                id="topic-tags"
                value={topicForm.tags}
                onChange={(e) => setTopicForm({...topicForm, tags: e.target.value})}
                placeholder="مثال: قضیه,نسبت,مثلث"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="topic-description">توضیحات</Label>
              <Textarea
                id="topic-description"
                value={topicForm.description}
                onChange={(e) => setTopicForm({...topicForm, description: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTopicDialogOpen(false)}>
                انصراف
              </Button>
              <Button type="submit">ایجاد مبحث</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
