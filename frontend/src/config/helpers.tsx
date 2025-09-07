import Toast from "@/components/common/toast";
import ReactDOM from "react-dom/client";

class Helpers {
  static localhost: string = "http://localhost:3000";
  static server: string = "https://backend-development-cf06.up.railway.app";
  
  // For local development, use localhost. For production, use server
  // Railway deployment update - force rebuild
  // Add fallback to prevent undefined errors
  static basePath: string = (() => {
    try {
      return import.meta.env?.DEV ? Helpers.localhost : Helpers.server;
    } catch (error) {
      // Fallback to localhost for development
      console.warn("Environment detection failed, defaulting to localhost");
      return Helpers.localhost;
    }
  })();
  
  static apiUrl: string = `${Helpers.basePath}/api/v1`;

  static authUser = (): Record<string, unknown> => {
    return JSON.parse(localStorage.getItem("user") ?? "{}");
  };

  static serverImage = (name: string): string => {
    return `${Helpers.basePath}/uploads/${name}`;
  };

  static getToken = (): string | null => {
    const token = localStorage.getItem("token");
    return token;
  };

  static getItem = (data: string, isJson: boolean = false): unknown => {
    if (isJson) {
      return JSON.parse(localStorage.getItem(data) ?? "null");
    } else {
      return localStorage.getItem(data);
    }
  };

  static authHeaders = () => ({
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Helpers.getToken()}`,
    },
  });

  static authFileHeaders = () => ({
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${Helpers.getToken()}`,
    },
  });

  static formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  static paginate<T>(data: T[]): T[][] {
    const pageSize = 10;
    const paginated: T[][] = [];
    let startIndex = 0;
    const totalPages = Math.ceil(data.length / pageSize);

    for (let i = 0; i < totalPages; i++) {
      const lastIndex = pageSize + startIndex;
      const pageData = data.slice(startIndex, lastIndex);
      paginated.push(pageData);
      startIndex += pageSize;
    }

    return paginated;
  }

  static setItem = (
    key: string,
    data: unknown,
    isJson: boolean = false
  ): void => {
    if (isJson) {
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      localStorage.setItem(key, String(data));
    }
  };

  static toast = (
    type: "success" | "error" | "info" = "info",
    message: string,
    duration: number = 5000
  ): void => {
    let toastContainer = document.getElementById("toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "toast-container";
      document.body.appendChild(toastContainer);
    }

    // Get current toasts
    const currentToasts = toastContainer.children;
    const toastIndex = currentToasts.length;

    const toastMount = document.createElement("div");
    toastContainer.appendChild(toastMount);

    const root = ReactDOM.createRoot(toastMount);
    root.render(
      <Toast
        message={message}
        variant={type}
        index={toastIndex}
        onClose={() => {
          root.unmount();
          toastMount.remove();
          // Reposition remaining toasts
          const remainingToasts = toastContainer.children;
          Array.from(remainingToasts).forEach((toast, index) => {
            const toastElement = toast.firstChild as HTMLElement;
            if (toastElement) {
              toastElement.style.top = `${4 + index * 80}px`;
            }
          });
        }}
      />
    );

    if (duration) {
      setTimeout(() => {
        root.unmount();
        toastMount.remove();
        // Reposition remaining toasts
        const remainingToasts = toastContainer.children;
        Array.from(remainingToasts).forEach((toast, index) => {
          const toastElement = toast.firstChild as HTMLElement;
          if (toastElement) {
            toastElement.style.top = `${4 + index * 80}px`;
          }
        });
      }, duration);
    }
  };
}

export default Helpers;
