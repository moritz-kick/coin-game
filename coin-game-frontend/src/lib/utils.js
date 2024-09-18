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
      baseURL: "http://localhost:5001",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return axios.create({
    baseURL: "http://localhost:5001",
  });
};

export const showErrorToast = (error) => {
  console.error(error?.response?.data);
  toast.error(error?.response?.data?.message || "An error occurred");
};
