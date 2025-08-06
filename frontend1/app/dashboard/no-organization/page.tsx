'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NoOrganizationPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto rounded-full bg-yellow-100 p-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
          <CardTitle>No Organization Found</CardTitle>
          <CardDescription>
            You don't have access to any organization yet. Please contact your administrator or create a new organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4">
          <Button asChild>
            <Link href="/dashboard/organization/new">
              <Plus className="mr-2 h-4 w-4" />
              Create New Organization
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              Back to Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
