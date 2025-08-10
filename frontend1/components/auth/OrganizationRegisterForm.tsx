"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import Link from "next/link";
import { 
  Loader2, 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Globe, 
  Phone, 
  CreditCard,
  Check,
  Star,
  Shield,
  Zap,
  Users,
  Eye,
  EyeOff
} from "lucide-react";

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
import { Label } from "@/components/ui/label";
import { 
  fetchSubscriptionPlans, 
  fetchPlanDurations,
  registerOrganization, 
  formatPrice, 
  type SubscriptionPlan, 
  type PlanDuration 
} from "@/services/subscriptionService";
import type { OrganizationRegistrationData } from "@/types/subscription";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Memoized toast implementation
const useToast = () => {
  const toast = React.useCallback((options: { title: string; description: string; variant?: string }) => {
    window.alert(`${options.title}: ${options.description}`);
  }, []);
  
  return { toast };
};

// Define form schema using Zod
const organizationRegisterSchema = z.object({
  // Organization fields
  organization_name: z.string().min(1, { message: "Organization name is required" }),
  website: z.string().url().optional().or(z.literal("")),
  phone_number: z.string().optional(),
  
  // Admin user fields
  first_name: z.string().min(1, { message: "First name is required" }),
  last_name: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirm_password: z.string().min(8, { message: "Please confirm your password" }),
  
  // Subscription fields
  plan_duration_id: z.number({
    required_error: "Please select a billing cycle",
    invalid_type_error: "Invalid billing cycle selection"
  }),
  auto_renew: z.boolean().default(true),
  username: z.string().optional() // Will be auto-generated from email
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type OrganizationRegisterFormValues = z.infer<typeof organizationRegisterSchema>;

const OrganizationRegisterForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [durations, setDurations] = useState<PlanDuration[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  
  // Helper functions to get selected plan and duration details
  const getSelectedPlanDetails = () => {
    return selectedPlan ? plans.find(plan => plan.id === selectedPlan) : null;
  };

  const getSelectedDurationDetails = () => {
    const durationId = form.watch("plan_duration_id");
    return durations.find(duration => duration.id === durationId) || null;
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Generate a URL-friendly username from email or name
  const generateUsername = (email: string, firstName: string, lastName: string): string => {
    // Try to get username from email first
    if (email && email.includes('@')) {
      return email.split('@')[0].toLowerCase()
        .replace(/[^a-z0-9]/g, '')  // Remove special characters
        .substring(0, 30);           // Limit length
    }
    
    // If no email or can't extract username, use firstname_lastname
    const namePart = `${firstName || ''}${lastName ? `_${lastName}` : ''}`
      .toLowerCase()
      .replace(/\s+/g, '_')         // Replace spaces with underscores
      .replace(/[^a-z0-9_]/g, '')   // Remove special characters
      .replace(/_+/g, '_')          // Replace multiple underscores with one
      .replace(/^_+|_+$/g, '')      // Remove leading/trailing underscores
      .substring(0, 30);            // Limit length
    
    // If we have a name part, use it with a random number
    if (namePart) {
      return `${namePart}${Math.floor(100 + Math.random() * 900)}`; // Add random 3-digit number
    }
    
    // Fallback to a random string if nothing else works
    return `user${Math.floor(10000 + Math.random() * 90000)}`;
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<OrganizationRegisterFormValues>({
    resolver: zodResolver(organizationRegisterSchema),
    defaultValues: {
      organization_name: "",
      website: "",
      phone_number: "",
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      confirm_password: "",
      plan_duration_id: undefined as unknown as number, // Using undefined with type assertion for number
      auto_renew: true,
    },
  });

  // Fetch subscription plans on component mount
  useEffect(() => {
    let isMounted = true;
    
    const loadPlans = async () => {
      try {
        const { data: plansData, error: plansError } = await fetchSubscriptionPlans();
        
        if (!isMounted) return;
        
        if (plansError) {
          console.error('Error loading subscription plans:', plansError);
          toast({
            title: "Error",
            description: plansError,
            variant: "destructive",
          });
          return;
        }
        
        if (!plansData || plansData.length === 0) {
          console.error('No subscription plans available');
          toast({
            title: "No Plans Available",
            description: "No subscription plans are currently available. Please contact support.",
            variant: "destructive",
          });
          return;
        }
        
        setPlans(plansData);
        
        // Set the first plan as selected by default if available
        const firstPlanId = plansData[0].id;
        setSelectedPlan(firstPlanId);
        // Also trigger loading durations for the first plan
        handlePlanSelect(firstPlanId);
      } catch (error) {
        console.error('Unexpected error loading subscription plans:', error);
        if (!isMounted) return;
        
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading subscription plans. Please try again later.",
          variant: "destructive",
        });
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadPlans();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, []); // Removed toast from dependencies to prevent infinite loop

  // Handle plan selection
  const handlePlanSelect = (planId: number) => {
    setSelectedPlan(planId);
    setSelectedDuration(null);
    
    // Clear the form field with consistent type
    form.setValue('plan_duration_id', undefined as unknown as number);
    
    // Load durations for the selected plan
    console.log('Plan selected:', planId);
    loadDurations(planId);
  };

  // Load durations for a given plan
  const loadDurations = async (planId: number) => {
    try {
      const { data: planDurations, error: durationsError } = await fetchPlanDurations(planId);
      if (!planDurations) throw new Error('No durations data received');
      
      if (durationsError) {
        console.error('Error loading plan durations:', durationsError);
        toast({
          title: 'Error',
          description: `Failed to load billing cycles: ${durationsError}`,
          variant: 'destructive',
        });
        return;
      }
      
      if (!planDurations || planDurations.length === 0) {
        console.error('No durations available for plan:', planId);
        toast({
          title: 'No Billing Cycles',
          description: 'No billing cycles are available for the selected plan. Please try another plan or contact support.',
          variant: 'destructive',
        });
        return;
      }
      
      // Log each duration's details for debugging
      console.log(`Found ${planDurations.length} durations for plan ${planId}:`, 
        planDurations.map(d => ({
          id: d.id,
          months: d.duration_months,
          price: d.price,
          discount: d.discount_percentage,
          isDefault: d.is_default
        }))
      );
      
      setDurations(planDurations);
      
      // Auto-select the first duration if available
      if (planDurations.length > 0) {
        const defaultDuration = planDurations.find(d => d.is_default) || planDurations[0];
        if (defaultDuration) {
          console.log('Auto-selecting default duration:', defaultDuration.id);
          setSelectedDuration(defaultDuration.id);
          form.setValue('plan_duration_id', defaultDuration.id);
        }
      }
    } catch (error) {
      console.error('Error in handlePlanSelect:', error);
      toast({
        title: 'Error',
        description: 'Failed to load plan details. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle duration selection
  const handleDurationSelect = (durationId: number) => {
    setSelectedDuration(durationId);
    form.setValue('plan_duration_id', durationId, { shouldValidate: true });
  };

  // Format price with currency
  const formatPrice = (price: number | string | null | undefined): string => {
    if (price === null || price === undefined) return '$0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : Number(price);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numPrice);
  };
  
  // Helper function to safely convert to number
  const toNumber = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    return typeof value === 'string' ? parseFloat(value) : Number(value);
  };
  
  // Helper function to compare values with type safety
  const compareValues = (a: any, b: any): boolean => {
    if (typeof a === 'number' && typeof b === 'string') {
      return a === parseFloat(b);
    }
    if (typeof a === 'string' && typeof b === 'number') {
      return parseFloat(a) === b;
    }
    return a === b;
  };

  // Handle form submission
  const onSubmit = async (data: OrganizationRegisterFormValues) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Form submitted with data:', data);
      
      // Make sure a plan and duration are selected
      if (selectedPlan === null || selectedDuration === null) {
        toast({
          title: "Selection Required",
          description: "Please select a plan and billing cycle",
          variant: "destructive"
        });
        return;
      }
      
      // Generate a username from email or name
      const generatedUsername = generateUsername(
        data.email,
        data.first_name,
        data.last_name
      );
      
      // Get the selected duration object to ensure we have the correct ID
      const selectedDurationObj = durations.find(d => d.id === selectedDuration);
      if (!selectedDurationObj) {
        throw new Error('Selected duration not found');
      }
      
      // Get the plan duration ID from the backend response
      const planDurationId = selectedDurationObj.id;
      console.log('Using plan_duration_id:', planDurationId, 'Type:', typeof planDurationId);
      
      // Prepare the registration data
      const registrationData = {
        // Organization fields
        organization_name: data.organization_name,
        website: data.website || undefined,
        phone_number: data.phone_number || '',
        
        // User fields
        username: generatedUsername,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        confirm_password: data.confirm_password,
        
        // Subscription fields - ensure plan_duration_id is a string (UUID)
        plan_duration_id: planDurationId,
        auto_renew: data.auto_renew || false
      };
      
      console.log('Sending registration data to API:', registrationData);
      
      // Call the registration API
      const response = await registerOrganization(registrationData);
      console.log('Registration API response:', response);
      
      // Show success message
      toast({
        title: "Registration Successful!",
        description: "Please check your email to verify your account.",
      });
      
      // Redirect to login page
      console.log('Redirecting to login page...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Extract error messages from the response
      let errorMessage = 'Registration failed. Please check your information and try again.';
      
      // Log full error for debugging
      console.log('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      if (error.response?.data) {
        // Format validation errors from the backend
        const errorData = error.response.data;
        console.log('Error data from server:', errorData);
        
        const errorDetails = [];
        
        // Handle different error formats
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.map(err => err.message || JSON.stringify(err)).join('\n');
        } else if (typeof errorData === 'object') {
          for (const [field, errors] of Object.entries(errorData)) {
            if (Array.isArray(errors)) {
              errorDetails.push(`${field}: ${errors.join(', ')}`);
            } else if (typeof errors === 'string') {
              errorDetails.push(errors);
            } else if (errors && typeof errors === 'object' && 'message' in errors) {
              errorDetails.push((errors as any).message);
            }
            errorDetails.push(`${field}: ${errors}`);
          }
        }
        
        if (errorDetails.length > 0) {
          errorMessage = errorDetails.join('\n');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, title: "Organization", icon: Building2 },
    { id: 2, title: "Admin Details", icon: User },
    { id: 3, title: "Subscription", icon: CreditCard },
  ];

  if (!mounted) {
    return (
      <div className="flex flex-col space-y-4 animate-pulse max-w-2xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mx-auto"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4 animate-in fade-in-50 duration-500">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl">
          <Building2 className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          Create Your Organization
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Join thousands of organizations already using our platform to streamline their operations
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center animate-in fade-in-50 duration-500 delay-100">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <React.Fragment key={step.id}>
                <div className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300",
                  isActive && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                  isCompleted && "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive && "bg-blue-500 text-white",
                    isCompleted && "bg-green-500 text-white",
                    !isActive && !isCompleted && "bg-gray-200 dark:bg-gray-700"
                  )}>
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <span className="font-medium text-sm">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 h-0.5 transition-all duration-300",
                    currentStep > step.id ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Form Card */}
      <Card className="animate-in fade-in-50 duration-500 delay-200 shadow-xl border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <CardContent className="p-8">
              {/* Step 1: Organization Information */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                      <Building2 className="w-6 h-6 text-blue-500" />
                      Organization Details
                    </h2>
                    <p className="text-muted-foreground">Tell us about your organization</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="organization_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Organization Name
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            disabled={isSubmitting}
                            className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Enter your organization name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Globe className="w-4 h-4" />
                            Website
                          </FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="https://yourwebsite.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="tel" 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="+1 (555) 123-4567"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Admin Information */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                      <User className="w-6 h-6 text-blue-500" />
                      Admin Account
                    </h2>
                    <p className="text-muted-foreground">Create your administrator account</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">First Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="John"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium">Last Name</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={isSubmitting}
                              className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                              placeholder="Doe"
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
                        <FormLabel className="text-base font-medium flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            disabled={isSubmitting}
                            className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                            placeholder="admin@yourorganization.com"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                {...field} 
                                disabled={isSubmitting}
                                className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 pr-12"
                                placeholder="Create a secure password"
                                autoComplete="new-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute inset-y-0 right-0 px-3 py-0 h-full hover:bg-transparent"
                                onClick={toggleShowPassword}
                                disabled={isSubmitting}
                              >
                                {showPassword ? (
                                  <EyeOff className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            <Lock className="w-4 h-4" />
                            Confirm Password
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"}
                                {...field} 
                                disabled={isSubmitting}
                                className="h-12 text-base border-2 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 pr-12"
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute inset-y-0 right-0 px-3 py-0 h-full hover:bg-transparent"
                                onClick={() => toggleShowConfirmPassword()}
                                disabled={isSubmitting}
                              >
                                {showConfirmPassword ? (
                                  <EyeOff className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <Eye className="w-4 h-4 text-gray-500" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Subscription Plan */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in-50 duration-300">
                  <div className="text-center space-y-2 mb-8">
                    <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                      Choose Your Plan
                    </h2>
                    <p className="text-muted-foreground">Select the perfect plan for your organization</p>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-3 text-lg">Loading subscription plans...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Plan Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map((plan) => (
                          <div
                            key={plan.id}
                            className={cn(
                              "relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg",
                              selectedPlan === plan.id
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                            )}
                            onClick={() => handlePlanSelect(plan.id)}
                          >
                            {plan.name.toLowerCase().includes('pro') && (
                              <Badge className="absolute -top-2 left-4 bg-gradient-to-r from-blue-500 to-purple-500">
                                Most Popular
                              </Badge>
                            )}
                            <div className="text-center space-y-3">
                              <div className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                {plan.name.toLowerCase().includes('basic') && <Shield className="w-6 h-6 text-white" />}
                                {plan.name.toLowerCase().includes('pro') && <Zap className="w-6 h-6 text-white" />}
                                {plan.name.toLowerCase().includes('enterprise') && <Users className="w-6 h-6 text-white" />}
                              </div>
                              <h3 className="text-xl font-semibold">{plan.name}</h3>
                              <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Duration Selection */}
                      {selectedPlan && durations.length > 0 && (
                        <FormField
                          control={form.control}
                          name="plan_duration_id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-lg font-medium">Billing Cycle</FormLabel>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {durations.map((duration) => (
                                  <div
                                    key={duration.id}
                                    className={cn(
                                      "relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300",
                                      field.value === duration.id
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
                                    )}
                                    onClick={() => field.onChange(duration.id)}
                                  >
                                    {toNumber(duration.discount_percentage) > 0 && (
                                      <Badge className="absolute -top-2 -right-2 bg-green-500">
                                        Save {duration.discount_percentage}%
                                      </Badge>
                                    )}
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-semibold">
                                          {duration.duration_months} {toNumber(duration.duration_months) === 1 ? 'Month' : 'Months'}
                                        </h4>
                                        <p className="text-2xl font-bold text-blue-600">
                                          {formatPrice(duration.price)}
                                        </p>
                                        {toNumber(duration.discount_percentage) > 0 && (
                                          <p className="text-sm text-green-600">
                                            Save ${(toNumber(duration.price) * toNumber(duration.duration_months) * toNumber(duration.discount_percentage) / 100).toFixed(2)}
                                          </p>
                                        )}
                                      </div>
                                      <div className={cn(
                                        "w-5 h-5 rounded-full border-2 transition-all duration-200",
                                        field.value === duration.id
                                          ? "border-blue-500 bg-blue-500"
                                          : "border-gray-300"
                                      )}>
                                        {field.value === duration.id && (
                                          <Check className="w-3 h-3 text-white m-0.5" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {/* Plan Summary */}
                      {getSelectedPlanDetails() && getSelectedDurationDetails() && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-xl border">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            Plan Summary
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Plan:</span>
                              <span className="font-medium">{getSelectedPlanDetails()?.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Billing:</span>
                              <span className="font-medium">
                                {getSelectedDurationDetails()?.duration_months} {getSelectedDurationDetails()?.duration_months === 1 ? 'Month' : 'Months'}
                              </span>
                            </div>
                            <div className="flex justify-between text-lg font-semibold">
                              <span>Total:</span>
                              <span className="text-blue-600">
                                {formatPrice(getSelectedDurationDetails()?.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          14-day free trial • Cancel anytime • No setup fees
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="p-8 pt-0">
              <div className="flex justify-between w-full">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentStep(currentStep - 1);
                    }}
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    Back
                  </Button>
                )}
                
                <div className="ml-auto">
                  {currentStep < 3 ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        // Validate current step before proceeding
                        if (currentStep === 1) {
                          form.trigger('organization_name').then(isValid => {
                            if (isValid) {
                              setCurrentStep(currentStep + 1);
                            }
                          });
                        } else if (currentStep === 2) {
                          form.trigger(['first_name', 'last_name', 'email', 'password', 'confirm_password'] as const).then(isValid => {
                            if (isValid) {
                              setCurrentStep(currentStep + 1);
                            }
                          });
                        }
                      }}
                      disabled={isSubmitting}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || isLoading}
                      className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Creating Account...
                        </div>
                      ) : (
                        "Create Organization Account"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* Footer */}
      <div className="text-center animate-in fade-in-50 duration-500 delay-300">
        <p className="text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

// Export the component as default
export default OrganizationRegisterForm;