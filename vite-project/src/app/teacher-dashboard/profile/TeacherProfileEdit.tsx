import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axios"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"

const schema = z.object({
  first_name: z.string().min(2, "نام الزامی است"),
  last_name: z.string().min(2, "نام خانوادگی الزامی است"),
  national_id: z.string().min(8, "کد ملی معتبر نیست"),
  phone_number: z.string().min(10, "شماره تلفن معتبر نیست"),
})

type FormData = z.infer<typeof schema>

export default function TeacherProfileEdit({ teacherId, initialData, onUpdated }: {
  teacherId: number,
  initialData: Partial<FormData>,
  onUpdated?: (data: any) => void
}) {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData,
  })

  useEffect(() => {
    reset(initialData)
  }, [initialData, reset])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await axiosInstance.put(`/teachers/${teacherId}/`, data, {
        withCredentials: true,
      })
      if (onUpdated) onUpdated(res.data)
      alert("اطلاعات با موفقیت بروزرسانی شد.")
    } catch (err: any) {
        // console.error("Error updating teacher profile:", err)
        console.log(data)
      alert("خطا در بروزرسانی اطلاعات")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex flex-col space-y-2">
          <Label>نام</Label>
          <Input {...register("first_name")} />
          {errors.first_name && <span className="text-red-500 text-xs">{errors.first_name.message}</span>}
        </div>
        <div className="flex flex-col space-y-2">
          <Label>نام خانوادگی</Label>
          <Input {...register("last_name")} />
          {errors.last_name && <span className="text-red-500 text-xs">{errors.last_name.message}</span>}
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <Label>کد ملی</Label>
        <Input {...register("national_id")} />
        {errors.national_id && <span className="text-red-500 text-xs">{errors.national_id.message}</span>}
      </div>
      <div className="flex flex-col space-y-2">
        <Label>شماره تلفن</Label>
        <Input {...register("phone_number")} />
        {errors.phone_number && <span className="text-red-500 text-xs">{errors.phone_number.message}</span>}
      </div>
      <Button type="submit" disabled={loading}>{loading ? "در حال بروزرسانی..." : "ذخیره تغییرات"}</Button>
    </form>
  )
}
