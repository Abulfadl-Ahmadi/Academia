import { Routes, Route } from 'react-router-dom';
import { TeacherKnowledgePanel } from '@/features/knowledge';

export function TeacherRoutes() {
  return (
    <Routes>
      <Route path="/knowledge" element={<TeacherKnowledgePanel />} />
      <Route path="/" element={<TeacherKnowledgePanel />} />
    </Routes>
  );
}
