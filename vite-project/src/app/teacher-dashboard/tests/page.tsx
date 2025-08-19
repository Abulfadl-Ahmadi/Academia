import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import FingerprintJS from "@fingerprintjs/fingerprintjs"
import { useNavigate } from "react-router-dom";
// @ts-ignore
import moment from 'moment-jalaali'

function convertToJalali(isoDate: string): string {
  return moment(isoDate).format('jYYYY/jMM/jDD HH:mm')
}


async function getDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
}

type Test = {
  id: number;
  name: string;
  description: string;
  duration: string;
  start_time: string;
  end_time: string;
  status: string;
};

const TestPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setSession] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    if (!id) return;

    axiosInstance
      .get(`/tests/${id}/`)
      .then((res) => {
        setTest(res.data); // مستقیم داده رو ست می‌کنیم
      })
      .catch((err) => {
        console.error("Error fetching test:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);


const handleStart = async () => {
  try {
    const res = await axiosInstance.post(`/enter-test/`, {
      test_id: id,
      device_id: await getDeviceId(),
    });

    setSession(res.data);
    console.log("Session started:", res.data);

    // بعد از ساخت سشن، ریدایرکت به صفحه آزمون
    navigate(`/test/${id}/`, { state: { session: res.data } });
  } catch (err) {
    console.error("Error starting session:", err);
  }}

  if (loading) return <div className="p-4">در حال بارگذاری...</div>;
  if (!test) return <div className="p-4">آزمونی پیدا نشد.</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">آزمون: {test.name}</h1>
      {test.description && <p className="mt-2">{test.description}</p>}
      <div>مدت آزمون: {test.duration}</div>
      <div>زمان شروع: {convertToJalali(test.start_time)}</div>
      <div>زمان پایان: {convertToJalali(test.end_time)}</div>
      <Button className="mt-4" onClick={handleStart}>
        شروع آزمون
      </Button>
    </div>
  );
};

export default TestPage;
