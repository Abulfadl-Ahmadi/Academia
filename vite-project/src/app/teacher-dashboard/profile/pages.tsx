import { useEffect, useState } from "react"
import axiosInstance from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import TeacherProfileEdit from "./TeacherProfileEdit"
import { useUser } from "@/context/UserContext"
export default function TeacherProfilePage() {
  const [teacher, setTeacher] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const { user } = useUser()
  if (!user) return <div>در حال بارگذاری اطلاعات کاربر...</div>
  // useEffect(() => {
  //   if (user && user.username) {
  //     axiosInstance.get(`/teachers/${user.username}/`, { withCredentials: true })
  //       .then(res => setTeacher(res.data))
  //       .catch(() => setTeacher(null))
  //   }
  // }, [user.username, open])

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">پروفایل</h2>
      {teacher ? (
        <div className="sm:max-w-[650px] space-y-2 rounded-xl p-4 border">
          <div className="flex space-x-4">
            <div className="flex flex-col space-y-2">
              <span className="font-semibold">نام:</span>
              <span>{teacher.first_name}</span>
            </div>
            <div className="flex flex-col space-y-2">
              <span className="font-semibold">نام خانوادگی:</span>
              <span>{teacher.last_name}</span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="font-semibold">کد ملی:</span>
            <span>{teacher.national_id}</span>
          </div>
          <div className="flex flex-col space-y-2">
            <span className="font-semibold">شماره تلفن:</span>
            <span>{teacher.phone_number}</span>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">ویرایش پروفایل</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>ویرایش پروفایل</DialogTitle>
              </DialogHeader>
              <TeacherProfileEdit
                teacherId={user.username as string}
                initialData={teacher}
                onUpdated={data => { setTeacher(data); setOpen(false); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div>در حال بارگذاری اطلاعات...</div>
      )}
    </div>
  )
}
