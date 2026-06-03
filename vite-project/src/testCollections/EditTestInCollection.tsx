import { useParams } from "react-router-dom";
import CreateTestPage from "@/pages/teacher/CreateTestPage";

export default function EditTestInCollection() {
  const { id } = useParams<{ id: string }>();
  return <CreateTestPage mode="edit" collectionId={id ? parseInt(id, 10) : undefined} />;
}
