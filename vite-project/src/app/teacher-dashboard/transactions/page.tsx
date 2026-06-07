import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import CreateTransaction from "./CreateTransaction";
import TransactionsList from "./TransactionsList";

export default function TransactionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleTransactionCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">مدیریت مالی</h1>
          <p className="text-muted-foreground mt-1">
            مشاهده و مدیریت تراکنش‌های مالی
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              ثبت تراکنش جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ایجاد تراکنش جدید</DialogTitle>
            </DialogHeader>
            <CreateTransaction onTransactionCreated={handleTransactionCreated} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Transactions List */}
      <TransactionsList key={refreshKey} />
    </div>
  );
}
