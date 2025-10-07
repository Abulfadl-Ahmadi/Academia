import { useEffect, useState } from "react";
import { columns, type GalleryImage } from "@/app/teacher-dashboard/gallery/column";
import { DataTable } from "@/components/ui/data-table";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import GalleryCreateForm from "./GalleryCreateForm";

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await axiosInstance.get('/gallery-images/')
      
      // Handle both array and pagination format
      let imagesData = []
      if (Array.isArray(response.data)) {
        imagesData = response.data
      } else if (response.data && Array.isArray(response.data.results)) {
        imagesData = response.data.results
      } else {
        imagesData = []
      }
      
      setImages(imagesData)
      setError(null)
    } catch (err) {
      console.error('Error fetching gallery images:', err)
      setError('خطا در بارگیری تصاویر گالری')
      toast.error('خطا در بارگیری تصاویر گالری')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  if (loading) return <div className="p-4">در حال بارگیری تصاویر...</div>;

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={fetchImages}>تلاش مجدد</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">مدیریت گالری تصاویر</h2>
      
      {/* Mobile Drawer */}
      <div className="md:hidden">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button>اضافه کردن تصویر</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>اضافه کردن تصویر جدید</DrawerTitle>
              <DrawerDescription>
                تصویر جدیدی به گالری اضافه کنید.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <GalleryCreateForm
                onSuccess={(newImage) => {
                  setImages((prev) => [...prev, newImage])
                  fetchImages() // Refresh to get updated data
                }}
                onClose={() => setDrawerOpen(false)}
                context="drawer"
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop Dialog */}
      <div className="hidden md:block">
        <Dialog>
          <DialogTrigger asChild>
            <Button>اضافه کردن تصویر</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogTitle>فرم اضافه کردن تصویر</DialogTitle>
            <GalleryCreateForm
              onSuccess={(newImage) => {
                setImages((prev) => [...prev, newImage])
                fetchImages() // Refresh to get updated data
              }}
              onClose={() => {}}
              context="dialog"
            />
          </DialogContent>
        </Dialog>
      </div>

      <DataTable columns={columns} data={images} />
    </div>
  );
}