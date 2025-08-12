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
import { useState } from "react"
import axiosInstance from "@/lib/axios";
import { z } from "zod"
import { type Session } from "./columns"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"


interface CreateSessionFormProps<number> {
  courseId: number
}

export default function CreateSessionForm<number>({
  courseId
}: CreateSessionFormProps<number>) {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [, setSessions] = useState<Session[]>([])
    
      const FormSchema = z.object({
        session_number: z.string().min(1, "sessionnumber title required"),
        // course: z.string().min(1, "course title required"),
      });
      const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        defaultValues: { session_number: ""}
      });


    const handleCreateSession = async (data: z.infer<typeof FormSchema>) => {
    console.log(data)
    setLoading(true)
    try {
      const res = await axiosInstance.post("/sessions/", {
        session_number: data.session_number,
        course: courseId,
      })
      setSessions(prev => [...prev, res.data])
      form.reset()
      setDrawerOpen(false)
    } catch (error) {
      console.error("Error creating Session:", error)
    } finally {
      setLoading(false)
    }
  }
    
    return (
        <>
              <div className="md:hidden">
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerTrigger asChild>
                  <Button>ایجاد جلسه</Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>ایجاد جلسه جدید</DrawerTitle>
                    <DrawerDescription>
                      جلسه‌ای جدید برای دانش آموزان این کلاس ایجاد کنید.
                    </DrawerDescription>
                  </DrawerHeader>
                  <form
                    className="p-4 space-y-4"
                    onSubmit={form.handleSubmit(handleCreateSession)}
                  >
                    <Input
                      placeholder="شماره جلسه"
                      {...form.register("session_number")}
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
                              <CommandSession>
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
                              </CommandSession>
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
                  <Button>ایجاد جلسه</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <form
                    className="space-y-4"
                    onSubmit={form.handleSubmit(handleCreateSession)}
                  >          <DialogHeader>
                    <DialogTitle>ایجاد کلاس جدید</DialogTitle>
                    <DialogDescription>
                      جلسه‌ای جدید برای دانش آموزان این کلاس ایجاد کنید.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      {/* <Label htmlFor="name-1">نام کلاس</Label> */}
                      <Input
                      placeholder="شماره جلسه"
                      {...form.register("session_number")}
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
                              <CommandSession>
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
                              </CommandSession>
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
              </>
    )
}