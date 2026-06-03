import { useParams } from "react-router-dom";
import CreateTestPage from "@/pages/teacher/CreateTestPage";

export default function CreateTestInCollection() {
  const { id } = useParams<{ id: string }>();
  return <CreateTestPage collectionId={id ? parseInt(id, 10) : undefined} />;
}
