import axiosInstance from "@/lib/axios";

export interface SpotPlayerLicense {
  id: number;
  course: number;
  course_title: string;
  spotplayer_license_id: string | null;
  spotplayer_license_key: string | null;
  spotplayer_url: string | null;
  spotplayer_download_url: string | null;
  watermark_text: string | null;
  test_mode: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CourseLicenseResponse {
  license: SpotPlayerLicense;
  created: boolean;
}

export interface SpotPlayerLicenseAdmin {
  id: number;
  course: number;
  student_id: number;
  student_name: string;
  student_email: string | null;
  student_phone: string | null;
  spotplayer_license_id: string | null;
  spotplayer_license_key: string | null;
  spotplayer_url: string | null;
  watermark_text: string | null;
  test_mode: boolean;
  device_limit: string | Record<string, number>;
  created_at: string;
  updated_at: string;
}

export const spotPlayerApi = {
  /** Fetch (and lazily create) the current user's license for a course. */
  getCourseLicense: (courseId: number) =>
    axiosInstance.get<CourseLicenseResponse>(
      `/spotplayer/courses/${courseId}/license/`
    ),
  /** List all issued licenses for a course (teacher/admin only). */
  listCourseLicenses: (courseId: number) =>
    axiosInstance.get<{ licenses: SpotPlayerLicenseAdmin[] }>(
      `/spotplayer/courses/${courseId}/licenses/`
    ),
  /** Forcibly re-provision a fresh license (teacher/admin only). */
  regenerateLicense: (courseId: number, licenseId: number) =>
    axiosInstance.post<{ license: SpotPlayerLicenseAdmin }>(
      `/spotplayer/courses/${courseId}/licenses/${licenseId}/regenerate/`
    ),
  /** Server-side sync of the 'X' cookie required by the SpotPlayer web player. */
  syncCookie: () => axiosInstance.get("/spotplayer/spotx/"),
};
