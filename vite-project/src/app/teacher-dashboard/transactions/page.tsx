import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateTransaction from "./CreateTransaction";
import TransactionsList from "./TransactionsList";

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTransactionCreated = () => {
    // Refresh the transactions list
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">مدیریت تراکنش‌ها</h1>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">ایجاد تراکنش جدید</TabsTrigger>
          <TabsTrigger value="list">لیست تراکنش‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <CreateTransaction onTransactionCreated={handleTransactionCreated} />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <TransactionsList key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
