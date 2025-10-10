import axiosInstance from '@/lib/axios';
import type {
  Subject,
  Chapter,
  Section,
  Lesson,
  TopicCategory,
  Topic,
  TopicDetail,
  TopicTest,
  File,
  CreateSubjectData,
  CreateChapterData,
  CreateSectionData,
  CreateLessonData,
  CreateTopicCategoryData,
  CreateTopicData,
  CreateTopicTestData,
  Folder,
  QuestionStatistics
} from './types';

export const knowledgeApi = {
  // Book Files
  getBookFiles: () =>
    axiosInstance.get<File[]>('/knowledge/subjects/book_files/'),
  
  // Subjects
  getSubjects: () => 
    axiosInstance.get<Subject[]>('/knowledge/subjects/'),
  
  createSubject: (data: CreateSubjectData) =>
    axiosInstance.post<Subject>('/knowledge/subjects/', data),
  
  updateSubject: (id: number, data: Partial<CreateSubjectData>) =>
    axiosInstance.patch<Subject>(`/knowledge/subjects/${id}/`, data),
  
  deleteSubject: (id: number) =>
    axiosInstance.delete(`/knowledge/subjects/${id}/`),

  // Chapters
  getChapters: () =>
    axiosInstance.get<Chapter[]>('/knowledge/chapters/'),
  
  createChapter: (data: CreateChapterData) =>
    axiosInstance.post<Chapter>('/knowledge/chapters/', data),
  
  updateChapter: (id: number, data: Partial<CreateChapterData>) =>
    axiosInstance.patch<Chapter>(`/knowledge/chapters/${id}/`, data),
  
  deleteChapter: (id: number) =>
    axiosInstance.delete(`/knowledge/chapters/${id}/`),

  // Sections
  getSections: () =>
    axiosInstance.get<Section[]>('/knowledge/sections/'),
  
  createSection: (data: CreateSectionData) =>
    axiosInstance.post<Section>('/knowledge/sections/', data),
  
  updateSection: (id: number, data: Partial<CreateSectionData>) =>
    axiosInstance.patch<Section>(`/knowledge/sections/${id}/`, data),
  
  deleteSection: (id: number) =>
    axiosInstance.delete(`/knowledge/sections/${id}/`),

  // Lessons
  getLessons: () =>
    axiosInstance.get<Lesson[]>('/knowledge/lessons/'),
  
  createLesson: (data: CreateLessonData) =>
    axiosInstance.post<Lesson>('/knowledge/lessons/', data),
  
  updateLesson: (id: number, data: Partial<CreateLessonData>) =>
    axiosInstance.patch<Lesson>(`/knowledge/lessons/${id}/`, data),
  
  deleteLesson: (id: number) =>
    axiosInstance.delete(`/knowledge/lessons/${id}/`),

  // Topic Categories
  getTopicCategories: () =>
    axiosInstance.get<TopicCategory[]>('/knowledge/topic-categories/'),
  
  createTopicCategory: (data: CreateTopicCategoryData) =>
    axiosInstance.post<TopicCategory>('/knowledge/topic-categories/', data),
  
  updateTopicCategory: (id: number, data: Partial<CreateTopicCategoryData>) =>
    axiosInstance.patch<TopicCategory>(`/knowledge/topic-categories/${id}/`, data),
  
  deleteTopicCategory: (id: number) =>
    axiosInstance.delete(`/knowledge/topic-categories/${id}/`),

  // Topics
  getTopics: () =>
    axiosInstance.get<Topic[]>('/knowledge/topics/'),
  
  getTopicDetail: (id: number) =>
    axiosInstance.get<TopicDetail>(`/knowledge/topics/${id}/`),
  
  createTopic: (data: CreateTopicData) =>
    axiosInstance.post<Topic>('/knowledge/topics/', data),
  
  updateTopic: (id: number, data: Partial<CreateTopicData>) =>
    axiosInstance.patch<Topic>(`/knowledge/topics/${id}/`, data),
  
  deleteTopic: (id: number) =>
    axiosInstance.delete(`/knowledge/topics/${id}/`),

  // Folders (new infinite hierarchy)
  getFolders: (parent?: number | null) =>
    axiosInstance.get<Folder[]>(`/knowledge/folders/${parent ? `?parent=${parent}` : ''}`),
  getFolderTree: () =>
    axiosInstance.get<Folder[]>('/knowledge/folders/tree/'),
  createFolder: (data: Partial<Folder>) =>
    axiosInstance.post<Folder>('/knowledge/folders/', data),
  updateFolder: (id: number, data: Partial<Folder>) =>
    axiosInstance.patch<Folder>(`/knowledge/folders/${id}/`, data),
  deleteFolder: (id: number) =>
    axiosInstance.delete(`/knowledge/folders/${id}/`),
  getQuestionStatistics: () =>
    axiosInstance.get<QuestionStatistics>('/knowledge/folders/question_statistics/'),

  // Knowledge Tree
  getKnowledgeTree: () =>
    axiosInstance.get<Subject[]>('/knowledge/knowledge-tree/'),

  // Topic Tests
  getTopicTests: () =>
    axiosInstance.get<TopicTest[]>('/topic-tests/'),
  
  getTopicTestsByTopic: (topicId: number) =>
    axiosInstance.get<{topic: TopicDetail, tests: TopicTest[], total_tests: number}>(`/topic-tests/by_topic/?topic_id=${topicId}`),
  
  createTopicTest: (data: CreateTopicTestData) =>
    axiosInstance.post<TopicTest>('/topic-tests/', data),
  
  updateTopicTest: (id: number, data: Partial<CreateTopicTestData>) =>
    axiosInstance.patch<TopicTest>(`/topic-tests/${id}/`, data),
  
  deleteTopicTest: (id: number) =>
    axiosInstance.delete(`/topic-tests/${id}/`),
};
