export interface Question {
  id: number;
  question_text: string;
  folders: number[];
  folders_names?: string[];
  created_at: string;
  updated_at: string;
  created_by: number | null;
  created_by_name?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  points?: number;
  estimated_time?: string;
  is_active: boolean;
  topic?: number;
  correct_option?: number;
  options: Option[];
  images: QuestionImage[];
  detailed_solution?: string;
}

export interface Option {
  id: number;
  question: number;
  option_text: string;
  order: number;
  option_image?: string;
  is_correct?: boolean;
}

export interface QuestionImage {
  id: number;
  question: number;
  image: string;
  alt_text?: string;
  order: number;
}

export interface Folder {
  id: number;
  name: string;
  parent?: number;
  children?: Folder[];
}