import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarInset,
} from "@/components/ui/sidebar";
import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { BookKey } from "lucide-react";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { PDFViewer } from "./PDFViewer"
import {
  Viewer,
} from "@react-pdf-viewer/core";
import {
  defaultLayoutPlugin,
  type ToolbarProps,
} from "@react-pdf-viewer/default-layout";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
// import '@react-pdf-viewer/zoom/lib/styles/index.css'
import "@react-pdf-viewer/core/lib/styles/index.css";
import CountdownTimer from "./CountdownTimer";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axiosInstance from "@/lib/axios";
import { Button } from "@/components/ui/button";
import FingerprintJS from "@fingerprintjs/fingerprintjs"


async function getDeviceId() {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
}

const TestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const session = location.state?.session;
  console.log(session);

  const logoutSession = async () => {
    try {
      const response = await axiosInstance.post("/exit-test/", {
        device_id: await getDeviceId()
      });
      const data = await response.data;
      alert(data.detail);
      navigate(`/panel/tests/`);
    } catch (error) {
      alert("Error logging out session.");
    }
  };

  const options = [
    { value: "1", label: "۱" },
    { value: "2", label: "۲" },
    { value: "3", label: "۳" },
    { value: "4", label: "۴" },
  ];

  const [answers, setAnswers] = useState({});

  // const handleValueChange = (questionNumber: number, newValue: string) => {
  //   setAnswers((prev) => {
  //     const currentValue = prev[questionNumber as keyof typeof prev];
  //     if (currentValue === newValue) {
  //       const updated = { ...prev };
  //       delete (updated as { [key: number]: string })[questionNumber];
  //       return updated;
  //     } else {
  //       return { ...prev, [questionNumber]: newValue };
  //     }
  //   });
  // };

  useEffect(() => {
    if (session?.session_id) {
      axiosInstance
        .get("/get-answer/", { params: { session_id: session.session_id } })
        .then((res) => {
          const parsedAnswers = {};
          for (const key in res.data) {
            (parsedAnswers as { [key: number]: string })[Number(key)] = String(res.data[key]);
          }
          setAnswers(parsedAnswers);
        })
        .catch((err) => {
          console.error("Failed to fetch answers:", err);
        });
    }
  }, [session?.session_id]);

  const sendAnswersToBackend = async () => {
    const entries = Object.entries(answers);
    for (const [question, answer] of entries) {
      console.log(
        JSON.stringify({
          question_number: Number(question),
          answer: Number(answer),
        })
      );
    }
    console.log("All answers sent!");
  };

  const handleAnswer = async (questionNumber: number, selectedValue: string) => {
    // Toggle behavior
    setAnswers((prev) => {
      const current = prev[questionNumber as keyof typeof prev];
      const newAnswers = { ...prev };

      if (current === selectedValue) {
delete (newAnswers as { [key: number]: string })[questionNumber];
        // ارسال حذف پاسخ به سرور
        saveAnswerToBackend(questionNumber, null);
      } else {
(newAnswers as { [key: number]: string })[questionNumber] = selectedValue;
        // ارسال پاسخ به سرور
        saveAnswerToBackend(questionNumber, Number(selectedValue));
      }

      return newAnswers;
    });
  };

  const saveAnswerToBackend = async (questionNumber: number, answerValue: number | null) => {
    try {
      await axiosInstance.post("/submit-answer/", {
        session_id: session.session_id,
        answers: [{ question_number: questionNumber, answer: answerValue }],
      });
      console.log(
        JSON.stringify({
          question_number: Number(questionNumber),
          answer: Number(answerValue),
        })
      );

      // if (!res.ok) {
      //   console.error(`❌ ارسال پاسخ سوال ${questionNumber} با خطا مواجه شد`);
      // }
    } catch (error) {
      console.error(
        `❌ ارسال پاسخ سوال ${questionNumber} با خطا مواجه شد`,
        error
      );
    }
  };

  const renderToolbar = (Toolbar: (props: ToolbarProps) => React.ReactElement) => (
    <Toolbar>
      {(slots: any) => {
        const { GoToNextPage, GoToPreviousPage, Zoom, ZoomIn, ZoomOut } = slots;
        return (
          <div className="">
            <div className="mr-auto">
              <ZoomOut />
            </div>
            <div style={{ padding: "0px 2px", marginLeft: "auto" }}>
              <Zoom />
            </div>
            <div>
              <ZoomIn />
            </div>
            <div>
              <GoToPreviousPage />
            </div>
            <div>
              <GoToNextPage />
            </div>
          </div>
        );
      }}
    </Toolbar>
  );

  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    renderToolbar,
    sidebarTabs: () => [],
  });

  const zoomPluginInstance = zoomPlugin();
  const { ZoomInButton, ZoomOutButton } = zoomPluginInstance;

  const handleTimeUp = () => {
    alert("زمان آزمون به پایان رسید!");
    navigate(`/tests/${session.test_id}/detail/`);
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenuButton
            size="lg"
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              <BookKey size={20} />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-lg text-right">
                پاسخ‌برگ
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarHeader>

        {/* <SidebarContent className="p-3 overflow-y-auto space-y-3">
          {Array.from({ length: 20 }).map((_, index) => {
            const questionNumber = index + 1;
            return (
              <div
                key={index}
                className="flex flex-row-reverse items-center gap-2"
              >
                <div className="w-10 pr-4">{questionNumber}</div>
                <RadioGroup.Root
                  value={answers[questionNumber] || null}
                  className="max-w-sm w-full grid grid-cols-4 gap-3"
                >
                  {options.map((option) => (
                    <RadioGroup.Item
                      key={option.value}
                      value={option.value}
                      onMouseDown={() =>
                        handleAnswer(questionNumber, option.value)
                      }
                      className="ring-[2px] ring-border rounded-lg px-1 data-[state=checked]:ring-2 data-[state=checked]:bg-black data-[state=checked]:text-white"
                    >
                      <span className="text-sm tracking-tight">
                        {option.label}
                      </span>
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
              </div>
            );
          })}
        </SidebarContent> */}

        <SidebarContent className="p-3 overflow-y-auto space-y-3">
          {Array.from({ length: 20 }).map((_, index) => {
            const questionNumber = index + 1;
            return (
              <div
                key={index}
                className="flex flex-row-reverse items-center gap-2"
              >
                <div className="w-10 pr-4">{questionNumber}</div>
                <RadioGroup.Root
                  value={(answers as { [key: number]: string })[questionNumber] || null} // اینجا مقدار رو می‌گیریم
                  className="max-w-sm w-full grid grid-cols-4 gap-3"
                >
                  {options.map((option) => (
                    <RadioGroup.Item
                      key={option.value}
                      value={option.value}
                      onMouseDown={() =>
                        handleAnswer(questionNumber, option.value)
                      }
                      className="ring-[2px] ring-border rounded-lg px-1 data-[state=checked]:ring-2 data-[state=checked]:bg-black data-[state=checked]:text-white"
                    >
                      <span className="text-sm tracking-tight">
                        {option.label}
                      </span>
                    </RadioGroup.Item>
                  ))}
                </RadioGroup.Root>
              </div>
            );
          })}
        </SidebarContent>

        <SidebarFooter>
          <button
            onClick={sendAnswersToBackend}
            className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm"
          >
            ارسال پاسخ‌ها
          </button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="w-full bg-white fixed z-2 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <div>دفترچه آزمون {id}</div>
            <ZoomOutButton />
            <ZoomInButton />
            <CountdownTimer
              endTime={session.end_time}
              onTimeUp={handleTimeUp}
            />
            <Button onClick={logoutSession}>خروج موقت از آزمون</Button>
            {/* <p>session {session}</p> */}
          </div>
        </header>

        {/* PDF here */}
        <div className="mt-17">
          <Viewer
            fileUrl={session.pdf_file_url}
            // plugins={[zoomPluginInstance]}
            plugins={[defaultLayoutPluginInstance]}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default TestDetailPage;
