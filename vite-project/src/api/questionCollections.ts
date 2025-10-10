import axiosInstance from '@/lib/axios';

export interface QuestionCollection {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_questions: number;
  created_by_name?: string;
}

export interface QuestionCollectionDetail extends QuestionCollection {
  questions: Array<{
    id: number;
    public_id: string;
    question_text: string;
    difficulty_level: string;
    folders_names: string[];
  }>;
}

export interface CreateQuestionCollectionData {
  name: string;
  description?: string;
  is_active: boolean;
  question_ids?: number[];
}

export interface UpdateQuestionCollectionData {
  name?: string;
  description?: string;
  is_active?: boolean;
  question_ids?: number[];
  add_question_ids?: number[];
  remove_question_ids?: number[];
}

// Get all question collections
export const getQuestionCollections = async (): Promise<QuestionCollection[]> => {
  const response = await axiosInstance.get('/question-collections/');
  
  // Handle both paginated and non-paginated responses
  if (response.data.results && Array.isArray(response.data.results)) {
    return response.data.results;
  } else if (Array.isArray(response.data)) {
    return response.data;
  } else {
    console.warn('Unexpected API response structure:', response.data);
    return [];
  }
};

// Get question collection by ID
export const getQuestionCollection = async (id: number): Promise<QuestionCollectionDetail> => {
  const response = await axiosInstance.get(`/question-collections/${id}/`);
  return response.data;
};

// Create new question collection
export const createQuestionCollection = async (data: CreateQuestionCollectionData): Promise<QuestionCollection> => {
  const response = await axiosInstance.post('/question-collections/', data);
  return response.data;
};

// Update question collection
export const updateQuestionCollection = async (
  id: number, 
  data: UpdateQuestionCollectionData
): Promise<QuestionCollection> => {
  const response = await axiosInstance.put(`/question-collections/${id}/`, data);
  return response.data;
};

// Delete question collection
export const deleteQuestionCollection = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/question-collections/${id}/`);
};

// Add questions to collection
export const addQuestionsToCollection = async (
  id: number, 
  questionIds: number[]
): Promise<{ message: string; total_questions: number }> => {
  const response = await axiosInstance.post(`/question-collections/${id}/add_questions/`, {
    question_ids: questionIds
  });
  return response.data;
};

// Remove questions from collection
export const removeQuestionsFromCollection = async (
  id: number, 
  questionIds: number[]
): Promise<{ message: string; total_questions: number }> => {
  const response = await axiosInstance.post(`/question-collections/${id}/remove_questions/`, {
    question_ids: questionIds
  });
  return response.data;
};

// Get questions in collection (with pagination)
export const getCollectionQuestions = async (
  id: number,
  page: number = 1,
  pageSize: number = 10
): Promise<{
  results: Array<{
    id: number;
    public_id: string;
    question_text: string;
    difficulty_level: string;
    folders_names: string[];
  }>;
  count: number;
  next: string | null;
  previous: string | null;
}> => {
  const response = await axiosInstance.get(`/question-collections/${id}/questions/`, {
    params: { page, page_size: pageSize }
  });
  return response.data;
};