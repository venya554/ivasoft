import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Имя должно содержать минимум 2 символа" }),
  email: z.string().email({ message: "Введите корректный email адрес" }),
  subject: z.string().min(3, { message: "Тема должна содержать минимум 3 символа" }),
  message: z.string().min(10, { message: "Сообщение должно содержать минимум 10 символов" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function ContactForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const response = await apiRequest("POST", "/api/contact", values);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Сообщение отправлено",
        description: "Мы свяжемся с вами в ближайшее время.",
        variant: "default",
      });
      form.reset();
      setSubmitted(true);
    },
    onError: (error) => {
      toast({
        title: "Ошибка при отправке",
        description: error.message || "Пожалуйста, попробуйте снова позже.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(values: ContactFormValues) {
    mutate(values);
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="text-5xl text-primary mb-4">✓</div>
        <h3 className="text-2xl font-bold mb-2">Спасибо за обращение!</h3>
        <p className="text-gray-600 mb-6">
          Ваше сообщение успешно отправлено. Мы свяжемся с вами в ближайшее время.
        </p>
        <Button 
          type="button" 
          onClick={() => setSubmitted(false)}
          className="btn-hover"
        >
          Отправить еще сообщение
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Имя *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ваше имя" 
                    {...field} 
                    className="px-4 py-3 h-auto" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ваш email" 
                    type="email" 
                    {...field} 
                    className="px-4 py-3 h-auto" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тема *</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Тема сообщения" 
                  {...field} 
                  className="px-4 py-3 h-auto" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Сообщение *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Ваше сообщение" 
                  rows={5} 
                  {...field} 
                  className="px-4 py-3 resize-none" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isPending}
          className="w-full btn-hover bg-primary text-white hover:bg-primary/90 py-3 h-auto"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Отправка...
            </>
          ) : (
            "Отправить сообщение"
          )}
        </Button>
      </form>
    </Form>
  );
}
