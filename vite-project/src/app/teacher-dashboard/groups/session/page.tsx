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
        
        // Handle both array and pagination format
        let sessionsData = [];
        if (Array.isArray(res.data)) {
          sessionsData = res.data;
        } else if (res.data && Array.isArray(res.data.results)) {
          sessionsData = res.data.results;
        } else {
          console.warn("Sessions data is not an array:", res.data);
          sessionsData = [];
        }
        
        return sessionsData;
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
      <CreateSessionForm courseId={Number(id)} />
      <DataTable columns={columns} data={data} />
    </div>
  );
}