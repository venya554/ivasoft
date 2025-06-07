import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

// Схема для формы входа
const loginSchema = z.object({
  username: z.string().min(3, {
    message: "Имя пользователя должно содержать минимум 3 символа",
  }),
  password: z.string().min(6, {
    message: "Пароль должен содержать минимум 6 символов",
  }),
});

// Схема для формы регистрации
const registerSchema = z.object({
  username: z.string().min(3, {
    message: "Имя пользователя должно содержать минимум 3 символа",
  }),
  password: z.string().min(6, {
    message: "Пароль должен содержать минимум 6 символов",
  }),
  passwordConfirm: z.string().min(6, {
    message: "Пожалуйста, подтвердите пароль",
  }),
  email: z.string().email({
    message: "Пожалуйста, введите корректный email",
  }),
  fullName: z.string().min(2, {
    message: "Имя должно содержать минимум 2 символа",
  }),
  company: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Пароли не совпадают",
  path: ["passwordConfirm"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [location, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();

  // Перенаправляем на главную, если пользователь уже авторизован
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Форма входа
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Форма регистрации
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      passwordConfirm: "",
      email: "",
      fullName: "",
      company: "",
      phone: "",
    },
  });

  // Отправка формы входа
  function onLoginSubmit(values: LoginFormValues) {
    loginMutation.mutate(values);
  }

  // Отправка формы регистрации
  function onRegisterSubmit(values: RegisterFormValues) {
    // Удаляем поле passwordConfirm, которое не нужно отправлять на сервер
    const { passwordConfirm, ...registerData } = values;
    registerMutation.mutate(registerData);
  }

  // Если пользователь уже загружается, показываем спиннер
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Левая панель с формами */}
      <div className="flex flex-1 items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight">IvASoft</h1>
            <p className="mt-2 text-muted-foreground">
              Войдите в систему или создайте новый аккаунт
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            {/* Форма входа */}
            <TabsContent value="login">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Вход в систему</CardTitle>
                  <CardDescription>
                    Введите ваши учётные данные для входа
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Вход...
                          </>
                        ) : (
                          "Войти"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    Нет аккаунта?{" "}
                    <Button variant="link" className="px-1" onClick={() => setActiveTab("register")}>
                      Зарегистрироваться
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Форма регистрации */}
            <TabsContent value="register">
              <Card>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Создать аккаунт</CardTitle>
                  <CardDescription>
                    Заполните форму для создания нового аккаунта
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Имя пользователя</FormLabel>
                            <FormControl>
                              <Input placeholder="username" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="mail@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Полное имя</FormLabel>
                            <FormControl>
                              <Input placeholder="Иван Иванов" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="company"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Компания</FormLabel>
                              <FormControl>
                                <Input placeholder="ООО «Компания»" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Телефон</FormLabel>
                              <FormControl>
                                <Input placeholder="+7 (999) 123-45-67" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <Separator />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Пароль</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="passwordConfirm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Подтвердите пароль</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Регистрация...
                          </>
                        ) : (
                          "Зарегистрироваться"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
                <CardFooter className="flex flex-col">
                  <div className="mt-2 text-center text-sm text-muted-foreground">
                    Уже есть аккаунт?{" "}
                    <Button variant="link" className="px-1" onClick={() => setActiveTab("login")}>
                      Войти
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Правая панель с информацией */}
      <div className="hidden lg:block lg:w-1/2 bg-gray-900 text-white p-10">
        <div className="h-full flex flex-col justify-center max-w-lg mx-auto">
          <h2 className="text-4xl font-bold mb-6">Личный кабинет клиента</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Управление проектами</h3>
              <p>Контролируйте статус ваших проектов, отслеживайте прогресс и взаимодействуйте с нашей командой разработчиков.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Файловое хранилище</h3>
              <p>Храните и передавайте документы, связанные с вашими проектами, в безопасном пространстве личного кабинета.</p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Прямое общение</h3>
              <p>Оставляйте комментарии, задавайте вопросы и получайте оперативные ответы от специалистов, работающих над вашим проектом.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}