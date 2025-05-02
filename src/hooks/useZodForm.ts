import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, DefaultValues } from "react-hook-form";
import { z } from "zod";

// Create a generic hook that accepts a dynamic schema typetext-[#9D9D9D]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useZodForm = <T extends z.ZodType>(
  schema: T,
  defaultValues?: DefaultValues<z.infer<T>>
) => {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return {
    register: form.register,
    handleSubmit: form.handleSubmit,
    watch: form.watch,
    errors: form.formState.errors,
    reset: form.reset,
    setValue: form.setValue,
  };
};
