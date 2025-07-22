import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export interface AboutYouForm {
  name: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  professionalSummary: string;
}

interface AboutYouStepProps {
  form: AboutYouForm;
  onChange: (form: AboutYouForm) => void;
  onContinue: () => void;
}

const AboutYouStep: React.FC<AboutYouStepProps> = ({ form, onChange, onContinue }) => {
  const handleInputChange = (field: keyof AboutYouForm, value: string) => {
    onChange({ ...form, [field]: value });
  };

  const validateAndContinue = () => {
    // Basic validation
    if (!form.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    if (!form.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Basic LinkedIn URL validation (if provided)
    if (form.linkedinUrl.trim() && !form.linkedinUrl.includes('linkedin.com')) {
      toast.error("Please enter a valid LinkedIn profile URL");
      return;
    }

    onContinue();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          About You
        </CardTitle>
        <CardDescription>
          Tell us about yourself. This information will be used across your resume and profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="john.doe@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <Label htmlFor="linkedinUrl">LinkedIn Profile URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={form.linkedinUrl}
              onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/johndoe"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="professionalSummary">Professional Summary</Label>
          <Textarea
            id="professionalSummary"
            value={form.professionalSummary}
            onChange={(e) => handleInputChange('professionalSummary', e.target.value)}
            placeholder="Brief overview of your professional background, key skills, and career objectives..."
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-slate-500 mt-1">
            Write a compelling summary that highlights your expertise and career goals (2-3 sentences recommended).
          </p>
        </div>

        <Button onClick={validateAndContinue} className="w-full">
          Continue to Work Experience
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default AboutYouStep;