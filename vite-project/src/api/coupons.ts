import axiosInstance from "@/lib/axios";

export interface Course {
  id: number;
  title: string;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses: number;
  used_count: number;
  min_purchase_amount: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  courses: number[];
  course_details?: Course[];
  created_at: string;
  updated_at: string;
  is_expired: boolean;
  is_available: boolean;
}

export interface CouponPayload {
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_uses?: number;
  min_purchase_amount?: number;
  valid_from?: string;
  valid_until?: string | null;
  is_active?: boolean;
  courses?: number[];
}

export interface ValidateCouponPayload {
  code: string;
  course_id?: number;
  product_ids?: number[];
  total_amount?: number;
}

export interface ValidateCouponResponse {
  valid: boolean;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  final_total: number;
  coupon: Coupon;
  error?: string;
}

export const couponsApi = {
  getCoupons: async (): Promise<Coupon[]> => {
    const response = await axiosInstance.get("/shop/coupons/");
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    return [];
  },

  createCoupon: async (payload: CouponPayload): Promise<Coupon> => {
    const response = await axiosInstance.post("/shop/coupons/", payload);
    return response.data;
  },

  updateCoupon: async (id: number, payload: Partial<CouponPayload>): Promise<Coupon> => {
    const response = await axiosInstance.patch(`/shop/coupons/${id}/`, payload);
    return response.data;
  },

  deleteCoupon: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/shop/coupons/${id}/`);
  },

  validateCoupon: async (payload: ValidateCouponPayload): Promise<ValidateCouponResponse> => {
    const response = await axiosInstance.post("/shop/coupons/validate/", payload);
    return response.data;
  },
};
