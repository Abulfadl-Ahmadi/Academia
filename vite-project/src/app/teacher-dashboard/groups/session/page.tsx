import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { columns, type Session } from "./columns"
import { DataTable } from "./data-table"
import axiosInstance from "@/lib/axios";
import CreateSessionForm from "./create-form";

export default function SessionsPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    axiosInstance(`courses/${id}/sessions/`)
      .then((res) => {
        if (!res) throw new Error('Failed to fetch sessions');
        return res.data;
      })
      .then((sessions) => {
        setData(sessions);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto py-10">
      <CreateSessionForm courseId={id} />
      <DataTable columns={columns} data={data} />
    </div>
  );
}