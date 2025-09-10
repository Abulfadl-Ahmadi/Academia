export interface File {
  id: number;
  title: string;
  file_type: string;
  content_type: string;
  arvan_url?: string;
  created_at: string;
}

export interface Subject {
  id: number;
  name: string;
  grade: number;
  description?: string;
  cover_image?: string;
  book_file?: number;
  book_file_title?: string;
  book_file_url?: string;
  total_topics: number;
  chapters: Chapter[];
}

export interface Chapter {
  id: number;
  name: string;
  order: number;
  description?: string;
  total_topics: number;
  sections: Section[];
}

export interface Section {
  id: number;
  name: string;
  order: number;
  description?: string;
  topics_count: number;
  topics: Topic[];
}

export interface Topic {
  id: number;
  name: string;
  order: number;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags?: string;
  estimated_study_time: number;
  available_tests_count: number;
}

export interface TopicDetail extends Topic {
  section_name: string;
  chapter_name: string;
  subject_name: string;
  prerequisites: Topic[];
}

export interface TopicTest {
  id: number;
  name: string;
  description?: string;
  test_type: string;
  topic: number;
  topic_name: string;
  topic_detail: {
    id: number;
    name: string;
    section: string;
    chapter: string;
    subject: string;
    difficulty: string;
  };
  duration_minutes: number;
  total_questions: number;
  participants_count: number;
  is_active: boolean;
  created_at: string;
  keys?: Array<{
    question_number: number;
    answer: number;
  }>;
}

export interface CreateSubjectData {
  name: string;
  grade: number;
  description?: string;
  book_file?: number;
}

export interface CreateChapterData {
  subject: number;
  name: string;
  order: number;
  description?: string;
}

export interface CreateSectionData {
  chapter: number;
  name: string;
  order: number;
  description?: string;
}

export interface CreateTopicData {
  section: number;
  name: string;
  order: number;
  description?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  tags?: string;
  estimated_study_time: number;
}

export interface CreateTopicTestData {
  name: string;
  description?: string;
  topic: number;
  pdf_file: number;
  answers_file?: number;
  duration: string; // ISO duration format "PT30M"
  is_active: boolean;
  keys?: Array<{
    question_number: number;
    answer: number;
  }>;
}
