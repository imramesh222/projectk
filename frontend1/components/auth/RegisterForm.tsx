"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/constant";
import { registerSchema, RegisterSchemaType } from "@/schemas/registerSchema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { fetchSubscriptionPlans, fetchPlanDurations } from "@/services/subscriptionService";
import type { SubscriptionPlan, PlanDuration } from "@/types/subscription";

const RegisterForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"account" | "organization">("account");
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [durations, setDurations] = useState<PlanDuration[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<string | null>(null);

  // Get plan and duration from URL params if available
  useEffect(() => {
    const planId = searchParams.get('plan');
    const durationId = searchParams.get('duration');
    let isMounted = true;
    
    // Load subscription plans
    const loadPlans = async () => {
      try {
        // Fetch subscription plans
        const response = await fetchSubscriptionPlans();
        
        if (!isMounted) return;
        
        if (response.error) {
          console.error('Error loading subscription plans:', response.error);
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
          return;
        }
        
        if (!response.data || response.data.length === 0) {
          console.error('No subscription plans available');
          toast({
            title: "No Plans Available",
            description: "No subscription plans are currently available. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        
        // Set the plans from the response data
        setPlans(response.data);
        
        // If we have a plan ID in the URL, load its durations
        if (planId) {
          const planIdNum = Number(planId);
          if (!isNaN(planIdNum)) {
            setSelectedPlan(planIdNum);
            
            // Load durations for the selected plan
            const durationsResponse = await fetchPlanDurations(planIdNum);
            
            if (!isMounted) return;
            
            if (durationsResponse.error) {
              console.error('Error loading plan durations:', durationsResponse.error);
              toast({
                title: 'Error',
                description: `Failed to load billing cycles: ${durationsResponse.error}`,
                variant: 'destructive',
              });
              return;
            }
            
            if (durationsResponse.data && Array.isArray(durationsResponse.data) && durationsResponse.data.length > 0) {
              const validDurations = durationsResponse.data.filter((d): d is PlanDuration => 
                d !== null && typeof d === 'object' && 'id' in d
              );
              
              setDurations(validDurations);
              
              // If we have a duration ID in the URL and it exists in the loaded durations
              if (durationId) {
                const selectedDurationObj = validDurations.find(d => String(d.id) === durationId);
                if (selectedDurationObj) {
                  setSelectedDuration(durationId);
                } else {
                  console.warn(`Duration ID ${durationId} not found in plan ${planId}`);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error loading subscription data:', error);
        if (!isMounted) return;
        
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading subscription information. Please try again later.",
          variant: "destructive",
        });
      }
    };

    loadPlans();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [searchParams, toast]);

  const form = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      accountType: "individual",
      email: "",
      firstName: "",
      lastName: "",
      username: "",
      password: "",
      confirmPassword: "",
      organizationName: "",
      phoneNumber: "",
      website: "",
      planId: "",
      planDurationId: "",
      autoRenew: true,
    },
  });

  const accountType = form.watch("accountType");
  
  // Update form values when plan or duration changes
  useEffect(() => {
    if (selectedPlan) {
      form.setValue("planId", selectedPlan.toString());
    }
    if (selectedDuration) {
      form.setValue("planDurationId", selectedDuration.toString());
    }
  }, [selectedPlan, selectedDuration, form]);

  // Handle plan selection
  const handlePlanSelect = async (planId: number) => {
    try {
      setSelectedPlan(planId);
      setSelectedDuration(null);
      
      // Load durations for the selected plan
      const durationsResponse = await fetchPlanDurations(planId);
      
      if (durationsResponse.error) {
        console.error('Error loading plan durations:', durationsResponse.error);
        toast({
          title: 'Error',
          description: `Failed to load billing cycles: ${durationsResponse.error}`,
          variant: 'destructive',
        });
        return;
      }
      
      if (durationsResponse.data && Array.isArray(durationsResponse.data) && durationsResponse.data.length > 0) {
        const validDurations = durationsResponse.data.filter((d): d is PlanDuration => 
          d !== null && typeof d === 'object' && 'id' in d
        );
        
        setDurations(validDurations);
        
        // Auto-select the first duration if available
        if (validDurations.length > 0) {
          const defaultDuration = validDurations.find(d => d.is_default) || validDurations[0];
          if (defaultDuration) {
            setSelectedDuration(String(defaultDuration.id));
          }
        }
      }
    } catch (error) {
      console.error('Error loading plan durations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plan durations. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = async (data: RegisterSchemaType) => {
    setIsSubmitting(true);
    try {
      // Prepare the data for submission
      const { confirmPassword, ...submitData } = data;
      
      // If it's an organization signup, include organization details
      if (data.accountType === "organization") {
        await axios.post(
          `${API_URL}/org/register/`,
          {
            ...submitData,
            first_name: submitData.firstName,
            last_name: submitData.lastName,
            organization_name: submitData.organizationName,
            plan_duration_id: submitData.planDurationId,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
      } else {
        // Individual signup
        await axios.post(
          `${API_URL}/users/register/`,
          {
            ...submitData,
            first_name: submitData.firstName,
            last_name: submitData.lastName,
            role: 'user',
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
      }

      toast({
        title: "Registration successful!",
        description: data.accountType === "organization" 
          ? "Your organization account has been created. You can now log in."
          : "Your account has been created. You can now log in.",
      });

      router.push("/login");
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";

      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          const errors = error.response.data;
          if (errors.email) {
            errorMessage = Array.isArray(errors.email) ? errors.email[0] : errors.email;
          } else if (errors.username) {
            errorMessage = Array.isArray(errors.username) ? errors.username[0] : errors.username;
          } else if (errors.organization_name) {
            errorMessage = Array.isArray(errors.organization_name) 
              ? errors.organization_name[0] 
              : errors.organization_name;
          } else if (errors.non_field_errors) {
            errorMessage = Array.isArray(errors.non_field_errors) 
              ? errors.non_field_errors[0] 
              : errors.non_field_errors;
          } else if (typeof errors === 'string') {
            errorMessage = errors;
          }
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = async () => {
    // Validate current step before proceeding
    const fields = step === "account" 
      ? ["firstName", "lastName", "email", "username", "password", "confirmPassword"]
      : ["organizationName"];
    
    const isValid = await form.trigger(fields as any);
    
    if (isValid) {
      if (step === "account" && accountType === "organization") {
        setStep("organization");
      } else {
        await form.handleSubmit(onSubmit)();
      }
    }
  };

  const prevStep = () => {
    setStep("account");
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Enter your information to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="John" 
                        {...field} 
                        disabled={isLoading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Doe" 
                        {...field} 
                        disabled={isLoading}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="johndoe" 
                      disabled={isLoading}
                      {...field} 
                    />
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
                  <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Enter your password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Confirm your password"
                      disabled={isLoading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full mt-6" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : 'Create Account'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
