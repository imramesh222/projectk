"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { isAuthenticated, getCurrentUserWithFallback } from "@/lib/auth";
import { API_URL } from "@/constant";
import { loginSchema, LoginSchemaType } from "@/schemas/loginSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const LoginForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/users/token/`,
        {
          username: data.username,
          password: data.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const { access, refresh, user } = response.data;
      
      // Debug log the complete response
      console.log('=== LOGIN RESPONSE ===');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
      console.log('User object:', JSON.stringify(user, null, 2));
      console.log('User role:', user?.role);
      
      // Store tokens and user data
      try {
        localStorage.setItem("access_token", access);
        localStorage.setItem("refresh_token", refresh);
        localStorage.setItem("user", JSON.stringify(user));
        console.log('Tokens and user data stored successfully');
      } catch (error) {
        console.error('Error storing auth data:', error);
        throw new Error('Failed to store authentication data');
      }

      // Show success message
      toast({
        title: "Login successful",
        description: "Redirecting to your dashboard...",
      });
      
      // Test authentication state
      const testAuth = () => ({
        isAuthenticated: isAuthenticated(),
        currentUser: getCurrentUserWithFallback(),
        accessToken: localStorage.getItem('access_token'),
        user: localStorage.getItem('user')
      });
      
      console.log('Auth state after login:', testAuth());
      console.log('User object from response:', user);
      
      // Get user role or default to 'user'
      const userRole = user?.role || 'user';
      
      // Map role to dashboard path
      const getDashboardPath = (role: string): string => {
        const paths: Record<string, string> = {
          'superadmin': '/superadmin',
          'admin': '/admin',
          'manager': '/manager',
          'developer': '/developer',
          'sales': '/sales',
          'support': '/support',
          'verifier': '/verifier',
          'user': '/dashboard'
        };
        return paths[role.toLowerCase()] || '/dashboard';
      };
      
      const dashboardPath = getDashboardPath(userRole);
      console.log('=== REDIRECTION DEBUG ===');
      console.log('User role from response:', userRole);
      console.log('Dashboard path from role mapping:', dashboardPath);
      
      // Ensure we have a valid path
      if (!dashboardPath) {
        const errorMsg = `Invalid dashboard path for role: ${userRole}`;
        console.error(errorMsg);
        toast({
          title: "Error",
          description: "Could not determine dashboard path",
          type: "destructive"
        });
        return;
      }
      
      // Ensure the path starts with a slash
      const normalizedPath = dashboardPath.startsWith('/') ? dashboardPath : `/${dashboardPath}`;
      
      console.log('Final normalized path:', normalizedPath);
      console.log('Current window location before redirect:', window.location.href);
      
      // Store the intended path for debugging
      localStorage.setItem('debug_dashboard_path', normalizedPath);
      localStorage.setItem('debug_redirect_attempt', new Date().toISOString());
      
      // Log the full URL we're trying to navigate to
      const fullUrl = new URL(normalizedPath, window.location.origin);
      console.log('Full URL to navigate to:', fullUrl.toString());
      
      // Try a simple redirect first
      console.log('Attempting to redirect to:', normalizedPath);
      window.location.href = normalizedPath;
      
      // Fallback in case the above doesn't work
      console.log('If you see this, the redirect might have failed');
      setTimeout(() => {
        console.log('Fallback redirect attempt');
        window.location.replace(normalizedPath);
      }, 100);
      
      return; // Exit the function after redirect

    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = "Invalid username or password";
        } else if (error.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        type: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your credentials to sign in to your account
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </Form>

      <p className="px-8 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
