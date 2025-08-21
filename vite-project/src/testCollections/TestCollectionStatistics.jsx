import React, { useEffect, useState } from 'react';
import { Card, Table, Statistic, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const TestCollectionStatistics = () => {
  const { id } = useParams();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/test-collections/${id}/statistics/`)
      .then(res => setStats(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin />;
  if (!stats) return <div>آمار یافت نشد</div>;

  const columns = [
    { title: 'عنوان آزمون', dataIndex: 'test_title', key: 'test_title' },
    { title: 'تعداد شرکت‌کننده', dataIndex: 'participated_students', key: 'participated_students' },
    { title: 'تعداد تکمیل‌کننده', dataIndex: 'completed_students', key: 'completed_students' },
    { title: 'درصد تکمیل', dataIndex: 'completion_rate', key: 'completion_rate', render: v => `${v}%` },
    { title: 'میانگین نمره', dataIndex: 'average_score', key: 'average_score' },
  ];

  return (
    <Card title="آمار مجموعه آزمون">
      <Statistic title="میانگین پیشرفت" value={stats.overall_stats.average_progress} suffix="%" />
      <Statistic title="درصد تکمیل" value={stats.overall_stats.completion_rate} suffix="%" />
      <Table columns={columns} dataSource={stats.test_statistics} rowKey="test_id" style={{ marginTop: 16 }} />
    </Card>
  );
};

export default TestCollectionStatistics;
