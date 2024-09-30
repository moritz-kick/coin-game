import axios from "axios";
import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const API = () => {
  const token = localStorage.getItem("token");
  if (token) {
    return axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
  });
};

export const showErrorToast = (error) => {
  if (error?.response) {
    const message = error?.response?.data?.message || error?.response?.data?.error || "An error occurred";
    toast.error(message);
  } else {
    toast.error(error?.message || "An unknown error occurred");
  }
};
