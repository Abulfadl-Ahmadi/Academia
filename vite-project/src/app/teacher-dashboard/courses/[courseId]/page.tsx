import CourseDetail from "./CourseDetail"
import { useParams } from "react-router-dom"

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();

  if (!courseId) {
    return <div>Course ID not found</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <CourseDetail courseId={parseInt(courseId)} />
    </div>
  )
}
