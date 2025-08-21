import React, { useEffect, useState } from 'react';
import { Table, Spin } from 'antd';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const StudentProgressList = () => {
  const { id } = useParams();
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/test-collections/${id}/student_progress/`)
      .then(res => setProgress(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const columns = [
    { title: 'دانش‌آموز', dataIndex: 'student_name', key: 'student_name' },
    { title: 'تعداد آزمون تکمیل‌شده', dataIndex: 'completed_tests', key: 'completed_tests' },
    { title: 'امتیاز کل', dataIndex: 'total_score', key: 'total_score' },
    { title: 'درصد پیشرفت', dataIndex: 'progress_percentage', key: 'progress_percentage', render: v => `${v}%` },
    { title: 'میانگین نمره', dataIndex: 'average_score', key: 'average_score' },
    { title: 'تکمیل شده', dataIndex: 'is_completed', key: 'is_completed', render: v => v ? 'بله' : 'خیر' },
  ];

  return (
    <Spin spinning={loading}>
      <Table columns={columns} dataSource={progress} rowKey="id" />
    </Spin>
  );
};

export default StudentProgressList;
