import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Laptop,
  Loader2,
  Monitor,
  Play,
  Smartphone,
  Tablet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { spotPlayerApi, type SpotPlayerLicense } from "@/api/spotplayer";

const PLAYER_DL_BASE = "https://dl.spotplayer.ir";
const PLAYERS_SCRIPT = `${PLAYER_DL_BASE}/players/?f=js`;
const APP_API_SCRIPT = "https://app.spotplayer.ir/assets/js/app-api.js";

interface SpotPlayerPlayer {
  name?: string;
  file?: string;
  version?: string;
  code?: number;
  image?: string;
}

const FALLBACK_PLAYERS: SpotPlayerPlayer[] = [
  { code: 1, name: "Windows", file: "/player/spotplayer-win.exe", version: "5.0.4.14" },
  { code: 4, name: "Android", file: "/player/spotplayer-android.apk", version: "1.7.8" },
  { code: 2, name: "macOS", file: "/player/spotplayer-mac.dmg", version: "5.0.4" },
  { code: 5, name: "iOS", file: "/player/spotplayer-ios.ipa", version: "1.7.8" },
];

const PLATFORM_ICONS: Record<string, LucideIcon> = {
  "1": Monitor, // Windows
  "2": Laptop, // macOS
  "3": Laptop, // Ubuntu / Linux
  "4": Smartphone, // Android
  "5": Tablet, // iOS
};

type LoadState = "loading" | "error" | "success";

interface SpotPlayerLicenseCardProps {
  courseId: number;
  /** Enable the in-browser (Web App) player. Requires /api/spotplayer/spotx/. */
  enableWebPlayer?: boolean;
  /** Server endpoint used by the player to refresh the 'X' cookie. */
  cookieUrl?: string;
}

/** Simple <script> loader that resolves once the script has executed. */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function SpotPlayerLicenseCard({
  courseId,
  enableWebPlayer = false,
  cookieUrl = "/api/spotplayer/spotx/",
}: SpotPlayerLicenseCardProps) {
  const [state, setState] = useState<LoadState>("loading");
  const [license, setLicense] = useState<SpotPlayerLicense | null>(null);
  const [players, setPlayers] = useState<SpotPlayerPlayer[]>(FALLBACK_PLAYERS);
  const [copied, setCopied] = useState(false);
  const [webError, setWebError] = useState<string | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  // ------------------------------------------------------------------ //
  // Live player download list (best-effort; falls back to defaults)
  // ------------------------------------------------------------------ //
  const loadPlayers = useCallback(async () => {
    try {
      await loadScript(PLAYERS_SCRIPT);
      const fetched = (window as unknown as { spotplayer_players?: SpotPlayerPlayer[] })
        .spotplayer_players;
      if (fetched?.length) {
        setPlayers(fetched);
      }
    } catch {
      /* keep defaults */
    }
  }, []);

  const fetchLicense = useCallback(() => {
    setState("loading");
    return spotPlayerApi
      .getCourseLicense(courseId)
      .then((res) => {
        setLicense(res.data.license);
        setState("success");
      })
      .catch(() => setState("error"));
  }, [courseId]);

  useEffect(() => {
    void fetchLicense();
    void loadPlayers();
    if (enableWebPlayer) {
      // Warm the web player script so the first "Play" is instant.
      loadScript(APP_API_SCRIPT).catch(() => setWebError("پلیر وب بارگذاری نشد"));
    }
  }, [fetchLicense, loadPlayers, enableWebPlayer]);

  // ------------------------------------------------------------------ //
  // Copy license key
  // ------------------------------------------------------------------ //
  const handleCopy = useCallback(async () => {
    const key = license?.spotplayer_license_key;
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      toast.success("کلید لایسنس کپی شد");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("کپی ناموفق بود");
    }
  }, [license]);

  // ------------------------------------------------------------------ //
  // In-browser SpotPlayer web player
  // ------------------------------------------------------------------ //
  const handleWebPlay = useCallback(async () => {
    const key = license?.spotplayer_license_key;
    if (!key) return;
    setWebError(null);
    const win = window as unknown as {
      SpotPlayer?: new (
        el: HTMLElement,
        cookieUrl?: string,
        side?: boolean,
        cookieName?: string
      ) => { Open: (k: string, c?: string, i?: string) => Promise<void> };
    };

    try {
      if (!win.SpotPlayer) {
        await loadScript(APP_API_SCRIPT);
      }
      const container = playerContainerRef.current;
      if (!win.SpotPlayer || !container) {
        setWebError("پلیر وب آماده نیست");
        return;
      }
      const metadata = (license.metadata ?? {}) as {
        course_id?: string;
        item_id?: string;
      };
      const player = new win.SpotPlayer(container, cookieUrl, false, "X");
      await player.Open(key, metadata.course_id, metadata.item_id);
    } catch (ex) {
      setWebError(ex instanceof Error ? ex.message : "خطا در پخش ویدیو");
    }
  }, [license, cookieUrl]);


  // ------------------------------------------------------------------ //
  // Render
  // ------------------------------------------------------------------ //
  if (state === "loading") {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center gap-3 p-6">
          <Loader2 className="h-5 w-5 animate-spin" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>دسترسی به لایسنس</CardTitle>
          <CardDescription>
            امکان دریافت کلید لایسنس این دوره وجود ندارد.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" onClick={() => void fetchLicense()}>
            تلاش مجدد
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>کلید لایسنس دوره</CardTitle>
          {license?.test_mode && <Badge variant="secondary">لایسنس تستی</Badge>}
        </div>
        <CardDescription>
          کد زیر مخصوص شماست؛ از اشتراک‌گذاری آن خودداری کنید یا لایسنس شما باطل می‌شود.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* License key */}
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">کلید لایسنس</span>
            <Button size="sm" variant="ghost" onClick={() => void handleCopy()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "کپی شد" : "کپی"}
            </Button>
          </div>
          <code
            dir="ltr"
            className="block break-all rounded-md bg-background p-3 text-xs leading-relaxed text-foreground"
          >
            {license?.spotplayer_license_key ?? "—"}
          </code>
          {license?.watermark_text && (
            <p className="mt-2 text-xs text-muted-foreground">
              واترمارک: <span dir="ltr">{license.watermark_text}</span>
            </p>
          )}
        </div>

        {/* Optional web player */}
        {enableWebPlayer && (
          <div className="space-y-3">
            {!license?.spotplayer_license_key ? null : (
              <Button onClick={() => void handleWebPlay()}>
                <Play className="h-4 w-4" />
                پخش در مرورگر
              </Button>
            )}
            {webError && <p className="text-sm text-destructive">{webError}</p>}
            <div ref={playerContainerRef} className="aspect-video w-full" />
          </div>
        )}

        {/* Player downloads */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Download className="h-4 w-4" />
            دانلود پخش‌کننده
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {players.map((p) => {
              const Icon = PLATFORM_ICONS[String(p.code)] ?? Download;
              const href = p.file ? `${PLAYER_DL_BASE}${p.file}` : undefined;
              return (
                <a
                  key={p.code ?? p.name}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition-colors hover:bg-muted"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{p.name ?? "دانلود"}</span>
                  {p.version && (
                    <span className="text-xs text-muted-foreground">
                      نسخه {p.version}
                    </span>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

