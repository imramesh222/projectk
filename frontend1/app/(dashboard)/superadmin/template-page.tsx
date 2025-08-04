'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TemplatePageProps {
  title: string;
  description?: string;
}

export function TemplatePage({ title, description }: TemplatePageProps) {
  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <p>This page is under construction. Check back later for updates.</p>
        </CardContent>
      </Card>
    </div>
  );
}
