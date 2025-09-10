import { api } from '@/lib/api';
import type {
  Subject,
  Chapter,
  Section,
  Topic,
  TopicDetail,
  TopicTest,
  CreateSubjectData,
  CreateChapterData,
  CreateSectionData,
  CreateTopicData,
  CreateTopicTestData
} from './types';

export const knowledgeApi = {
  // Subjects
  getSubjects: () => 
    api.get<Subject[]>('/knowledge/subjects/'),
  
  createSubject: (data: CreateSubjectData) =>
    api.post<Subject>('/knowledge/subjects/', data),
  
  updateSubject: (id: number, data: Partial<CreateSubjectData>) =>
    api.patch<Subject>(`/knowledge/subjects/${id}/`, data),
  
  deleteSubject: (id: number) =>
    api.delete(`/knowledge/subjects/${id}/`),

  // Chapters
  getChapters: () =>
    api.get<Chapter[]>('/knowledge/chapters/'),
  
  createChapter: (data: CreateChapterData) =>
    api.post<Chapter>('/knowledge/chapters/', data),
  
  updateChapter: (id: number, data: Partial<CreateChapterData>) =>
    api.patch<Chapter>(`/knowledge/chapters/${id}/`, data),
  
  deleteChapter: (id: number) =>
    api.delete(`/knowledge/chapters/${id}/`),

  // Sections
  getSections: () =>
    api.get<Section[]>('/knowledge/sections/'),
  
  createSection: (data: CreateSectionData) =>
    api.post<Section>('/knowledge/sections/', data),
  
  updateSection: (id: number, data: Partial<CreateSectionData>) =>
    api.patch<Section>(`/knowledge/sections/${id}/`, data),
  
  deleteSection: (id: number) =>
    api.delete(`/knowledge/sections/${id}/`),

  // Topics
  getTopics: () =>
    api.get<Topic[]>('/knowledge/topics/'),
  
  getTopicDetail: (id: number) =>
    api.get<TopicDetail>(`/knowledge/topics/${id}/`),
  
  createTopic: (data: CreateTopicData) =>
    api.post<Topic>('/knowledge/topics/', data),
  
  updateTopic: (id: number, data: Partial<CreateTopicData>) =>
    api.patch<Topic>(`/knowledge/topics/${id}/`, data),
  
  deleteTopic: (id: number) =>
    api.delete(`/knowledge/topics/${id}/`),

  // Knowledge Tree
  getKnowledgeTree: () =>
    api.get<Subject[]>('/knowledge/knowledge-tree/'),

  // Topic Tests
  getTopicTests: () =>
    api.get<TopicTest[]>('/topic-tests/'),
  
  getTopicTestsByTopic: (topicId: number) =>
    api.get<{topic: TopicDetail, tests: TopicTest[], total_tests: number}>(`/topic-tests/by_topic/?topic_id=${topicId}`),
  
  createTopicTest: (data: CreateTopicTestData) =>
    api.post<TopicTest>('/topic-tests/', data),
  
  updateTopicTest: (id: number, data: Partial<CreateTopicTestData>) =>
    api.patch<TopicTest>(`/topic-tests/${id}/`, data),
  
  deleteTopicTest: (id: number) =>
    api.delete(`/topic-tests/${id}/`),
};
