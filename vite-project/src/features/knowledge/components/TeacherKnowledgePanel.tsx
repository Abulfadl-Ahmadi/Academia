import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, TreePine, BarChart3 } from 'lucide-react';
import { SubjectManager } from './SubjectManager';
import { KnowledgeTreeManager } from './KnowledgeTreeManager';

export function TeacherKnowledgePanel() {
  const [activeTab, setActiveTab] = useState('subjects');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">مدیریت درخت دانش</h1>
        <p className="text-gray-600">مدیریت کتاب‌ها، فصل‌ها، زیربخش‌ها و مباحث درسی</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <Book className="w-4 h-4" />
            کتاب‌ها
          </TabsTrigger>
          <TabsTrigger value="tree" className="flex items-center gap-2">
            <TreePine className="w-4 h-4" />
            درخت دانش
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            آمار و گزارش
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="w-5 h-5 text-blue-600" />
                مدیریت کتاب‌های درسی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SubjectManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tree" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TreePine className="w-5 h-5 text-green-600" />
                مدیریت درخت دانش
                <Badge variant="outline" className="ml-2">
                  کتاب → فصل → زیربخش → مبحث
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KnowledgeTreeManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-600" />
                آمار و گزارش‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">آمار درخت دانش</h3>
                <p className="text-gray-600">آمار و گزارش‌های مربوط به محتوای درسی</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  <Card className="p-4">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900">کل کتاب‌ها</h4>
                      <p className="text-2xl font-bold text-blue-600 mt-2">--</p>
                      <p className="text-sm text-gray-600 mt-1">کتاب‌های درسی موجود</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900">کل فصل‌ها</h4>
                      <p className="text-2xl font-bold text-green-600 mt-2">--</p>
                      <p className="text-sm text-gray-600 mt-1">فصل‌های آموزشی</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900">کل زیربخش‌ها</h4>
                      <p className="text-2xl font-bold text-orange-600 mt-2">--</p>
                      <p className="text-sm text-gray-600 mt-1">زیربخش‌های درسی</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-center">
                      <h4 className="font-medium text-gray-900">کل مباحث</h4>
                      <p className="text-2xl font-bold text-purple-600 mt-2">--</p>
                      <p className="text-sm text-gray-600 mt-1">مباحث آموزشی</p>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
