import { toast } from "react-toastify";

// Configuration des toasts
export const toastConfig = {
  position: "top-right" as const,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

// Toasts de succès
export const showSuccess = (message: string) => {
  toast.success(message, toastConfig);
};

// Toasts d'erreur
export const showError = (message: string) => {
  toast.error(message, toastConfig);
};

// Toasts d'information
export const showInfo = (message: string) => {
  toast.info(message, toastConfig);
};

// Toasts d'avertissement
export const showWarning = (message: string) => {
  toast.warning(message, toastConfig);
};

// Toast de chargement
export const showLoading = (message: string) => {
  return toast.loading(message, toastConfig);
};

// Mettre à jour un toast de chargement
export const updateLoadingToast = (
  toastId: string,
  message: string,
  type: "success" | "error" | "info" = "success"
) => {
  toast.update(toastId, {
    render: message,
    type: type,
    isLoading: false,
    autoClose: 5000,
  });
};
