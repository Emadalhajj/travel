import { toast } from "react-toastify";

export const notify = {
  success: (msg = "تمت العملية بنجاح") => toast.success(msg),
  error: (msg = "حدث خطأ") => toast.error(msg),
  warning: (msg) => toast.warning(msg),
  info: (msg) => toast.info(msg),
};
