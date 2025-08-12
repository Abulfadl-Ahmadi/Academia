import { useEffect, useState } from "react"
import axios from "axios"
import { columns, type StudentGroup } from "@/app/teacher-dashboard/groups/column"
import { DataTable } from "@/components/ui/data-table"
import axiosInstance from "@/lib/axios";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerFooter,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import type { title } from "process";

export default function StudentGroupListPage() {
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const token = localStorage.getItem("access_token")
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [teachers, setTeachers] = useState<{ id: number; full_name: string }[]>([]);

  // Combobox form setup
  const FormSchema = z.object({
    title: z.string().min(1, "course title required"),
  });
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { title: ""}
  });


  useEffect(() => {
    axiosInstance
      .get(baseURL + "/courses/")
      .then((res) => {
        const data = res.data.map((group: any) => ({
          id: group.id,
          title: group.title,
          // teacher_username: group.teacher_username || "",
          // teacher_name: group.teacher_fullname || "—",
          student_count: group.students?.length || 0,
        }))
        setGroups(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreateGroup = async (data: z.infer<typeof FormSchema>) => {
    console.log(data)
    setLoading(true)
    try {
      const res = await axiosInstance.post("/courses/", {
        title: data.title,
      })
      setGroups(prev => [...prev, res.data])
      form.reset()
      setDrawerOpen(false)
    } catch (error) {
      console.error("Error creating group:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-4">Loading...</div>

  // Prepare teacher options for combobox
  // const teacherOptions = teachers.map(t => ({ label: t.full_name, value: t.id.toString() }));

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold mb-4">کلاس‌های دانش‌آموزان</h2>
      <div className="md:hidden">
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerTrigger asChild>
          <Button>ایجاد کلاس</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>ایجاد کلاس جدید</DrawerTitle>
            <DrawerDescription>
              گروهی جدید برای دانش آموزان ایجاد کنید.
            </DrawerDescription>
          </DrawerHeader>
          <form
            className="p-4 space-y-4"
            onSubmit={form.handleSubmit(handleCreateGroup)}
          >
            <Input
              placeholder="نام کلاس"
              {...form.register("title")}
            />
            {/* <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {form.watch("teacher")
                      ? teacherOptions.find(opt => opt.value === form.watch("teacher"))?.label
                      : "انتخاب استاد"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search teacher..." className="h-9" />
                    <CommandList>
                      <CommandEmpty>استاد یافت نشد.</CommandEmpty>
                      <CommandGroup>
                        {teacherOptions.map((teacher) => (
                          <CommandItem
                            value={teacher.label}
                            key={teacher.value}
                            onSelect={() => {
                              form.setValue("teacher", teacher.value);
                            }}
                          >
                            {teacher.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div> */}
            <DrawerFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "در حال ایجاد" : "ایجاد"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">لغو</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
      </div>
      <div className="hidden md:block">
    <Dialog>
        <DialogTrigger asChild>
          <Button>ایجاد کلاس</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleCreateGroup)}
          >          <DialogHeader>
            <DialogTitle>ایجاد کلاس جدید</DialogTitle>
            <DialogDescription>
              گروهی جدید برای دانش آموزان ایجاد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              {/* <Label htmlFor="name-1">نام کلاس</Label> */}
              <Input
              placeholder="نام کلاس"
              {...form.register("title")}
            />
            </div>
            {/* <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {form.watch("teacher")
                      ? teacherOptions.find(opt => opt.value === form.watch("teacher"))?.label
                      : "انتخاب استاد"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="جستوجوی استاد" className="h-9" />
                    <CommandList>
                      <CommandEmpty>استاد یافت نشد.</CommandEmpty>
                      <CommandGroup>
                        {teacherOptions.map((teacher) => (
                          <CommandItem
                            value={teacher.label}
                            key={teacher.value}
                            onSelect={() => {
                              form.setValue("teacher", teacher.value);
                            }}
                          >
                            {teacher.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div> */}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">لغو</Button>
            </DialogClose>
              <Button type="submit" disabled={loading}>
                {loading ? "در حال ایجاد" : "ایجاد"}
              </Button>
          </DialogFooter>
      </form>
        </DialogContent>
    </Dialog>
      </div>

      <DataTable columns={columns} data={groups} />
    </div>
  )
}
