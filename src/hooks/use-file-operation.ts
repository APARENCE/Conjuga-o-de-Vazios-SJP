import { useState, useCallback } from "react";
import { toast } from "sonner";

interface FileOperationOptions {
  loadingMessage: string;
  successMessage: string;
  errorMessage: string;
}

export function useFileOperation<T extends any[]>(
  operation: (...args: T) => Promise<void>,
  options: FileOperationOptions
) {
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(
    async (...args: T) => {
      setIsLoading(true);
      const loadingToastId = toast.loading(options.loadingMessage);

      try {
        await operation(...args);
        toast.success(options.successMessage, { id: loadingToastId });
      } catch (error) {
        console.error("File operation failed:", error);
        toast.error(options.errorMessage, { id: loadingToastId });
        throw error; // Re-throw para que o componente chamador possa lidar com o erro, se necessário
      } finally {
        setIsLoading(false);
      }
    },
    [operation, options.loadingMessage, options.successMessage, options.errorMessage]
  );

  return { execute, isLoading };
}