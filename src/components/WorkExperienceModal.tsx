import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WorkExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkExperienceFormData) => void;
  onDelete?: () => void;
  initialData?: WorkExperienceFormData;
  isEditing?: boolean;
}

export interface WorkExperienceFormData {
  id?: string;
  title: string;
  company: string;
  location: string;
  country: string;
  isCurrentRole: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  description: string;
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const years = Array.from({ length: 30 }, (_, i) => (new Date().getFullYear() - i).toString());

const countries = [
  "United States", "Canada", "United Kingdom", "Germany", "France", "Australia",
  "Japan", "China", "India", "Brazil", "Mexico", "Spain", "Italy", "Netherlands",
  "Switzerland", "Singapore", "Other"
];

export const WorkExperienceModal = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  isEditing = false
}: WorkExperienceModalProps) => {
  const [formData, setFormData] = useState<WorkExperienceFormData>({
    title: "",
    company: "",
    location: "",
    country: "",
    isCurrentRole: false,
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    description: "",
  });

  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setCharCount(initialData.description.length);
    }
  }, [initialData]);

  useEffect(() => {
    setCharCount(formData.description.length);
  }, [formData.description]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.company.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (charCount > 1000) {
      toast.error("Description must be less than 1,000 characters");
      return;
    }

    onSave(formData);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: "",
      company: "",
      location: "",
      country: "",
      isCurrentRole: false,
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      description: "",
    });
    setCharCount(0);
  };

  const handleClose = () => {
    onClose();
    if (!isEditing) {
      resetForm();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-semibold">
            {isEditing ? "Edit Work Experience" : "Add Work Experience"}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="title"
                placeholder="Director, Product Management & Operations"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="pr-8"
              />
              {formData.title && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, title: "" })}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Company Field */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium">
              Company <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="company"
                placeholder="Informatix Laboratories Corp."
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
                className="pr-8"
              />
              {formData.company && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData({ ...formData, company: "" })}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Location Fields */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Location</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Ex: London"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <Select
                value={formData.country}
                onValueChange={(value) => setFormData({ ...formData, country: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Role Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="currentRole"
              checked={formData.isCurrentRole}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, isCurrentRole: checked as boolean })
              }
            />
            <Label htmlFor="currentRole" className="text-sm font-medium">
              I am currently working in this role
            </Label>
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Start Date <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={formData.startMonth}
                  onValueChange={(value) => setFormData({ ...formData, startMonth: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="January" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.startYear}
                  onValueChange={(value) => setFormData({ ...formData, startYear: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="2010" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                End Date <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={formData.endMonth}
                  onValueChange={(value) => setFormData({ ...formData, endMonth: value })}
                  disabled={formData.isCurrentRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.isCurrentRole ? "Present" : "January"} />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month, index) => (
                      <SelectItem key={month} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={formData.endYear}
                  onValueChange={(value) => setFormData({ ...formData, endYear: value })}
                  disabled={formData.isCurrentRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.isCurrentRole ? "Present" : "2012"} />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Textarea
              id="description"
              placeholder="Led full lifecycle development of a flagship healthcare application, from ideation and requirements to launch and iteration, ensuring user-centric design and market readiness.

Defined and implemented a structured SDLC framework, accelerating time-to-market, improving delivery consistency, and enabling scalable agile practices.

Partnered with cross-functional stakeholders from product management..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={8}
              className="resize-none"
            />
            <div className="flex items-center justify-between text-sm">
              <div className={`${charCount > 1000 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {charCount > 1000 && (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive"></span>
                    Must be less than 1,000 characters.
                  </span>
                )}
              </div>
              <div className="text-muted-foreground">
                {charCount}/1,000
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            {isEditing && onDelete ? (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="px-6 bg-green-600 hover:bg-green-700 text-white"
              >
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};