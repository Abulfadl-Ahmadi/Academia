import React, { useState } from 'react';
import { Form, Input, Button, Select } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// This is an old version of the component that is no longer used
// The current version is in TestCollectionForm.tsx
const TestCollectionFormOld = ({ courses }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = values => {
    setLoading(true);
    axios.post('/api/test-collections/', values)
      .then(() => navigate('/test-collections'))
      .finally(() => setLoading(false));
  };

  return (
    <Form layout="vertical" onFinish={onFinish} style={{ maxWidth: 500, margin: 'auto' }}>
      <Form.Item name="name" label="عنوان مجموعه آزمون" rules={[{ required: true }]}> <Input /> </Form.Item>
      <Form.Item name="description" label="توضیحات"> <Input.TextArea rows={3} /> </Form.Item>
      <Form.Item name="courses" label="کلاس‌ها">
        <Select mode="multiple" options={courses && courses.map(c => ({ label: c.title, value: c.id }))} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading}>ثبت</Button>
    </Form>
  );
};

export default TestCollectionFormOld;
