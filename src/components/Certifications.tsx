import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Award, Calendar, Building, Edit2, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { useCertifications } from "@/hooks/useCertifications";

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  doesNotExpire: boolean;
}

const Certifications = () => {
  const { certifications: resumeCertifications, setCertifications } = useResumeData();
  const { saveCertification, updateCertification: updateCertificationDb, deleteCertification, saving } = useCertifications();
  
  // Use resume data if available, otherwise show empty state
  const certificationsList = resumeCertifications || [];
  
  const updateCertifications = (newCertifications: Certification[]) => {
    setCertifications(newCertifications);
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: "",
    credentialUrl: "",
    doesNotExpire: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.issuer) {
      toast.error("Please fill in certification name and issuer");
      return;
    }

    // Prepare database format
    const certificationData = {
      name: formData.name,
      issuing_organization: formData.issuer,
      issue_date: formData.issueDate || null,
      expiration_date: formData.doesNotExpire ? null : formData.expiryDate || null,
      credential_id: formData.credentialId || null,
      credential_url: formData.credentialUrl || null,
    };

    try {
      if (editingId && !editingId.startsWith('parsed-cert-')) {
        // Update existing database record
        const result = await updateCertificationDb(editingId, certificationData);
        if (result) {
          // Update local state
          const updatedCertifications = certificationsList.map(cert => 
            cert.id === editingId ? {
              ...cert,
              name: formData.name,
              issuer: formData.issuer,
              issueDate: formData.issueDate,
              expiryDate: formData.doesNotExpire ? undefined : formData.expiryDate,
              credentialId: formData.credentialId,
              credentialUrl: formData.credentialUrl,
              doesNotExpire: formData.doesNotExpire
            } : cert
          );
          updateCertifications(updatedCertifications);
        }
      } else {
        // Create new database record
        const result = await saveCertification(certificationData);
        if (result) {
          // Create local format for UI
          const newCertification: Certification = {
            id: result.id,
            name: formData.name,
            issuer: formData.issuer,
            issueDate: formData.issueDate,
            expiryDate: formData.doesNotExpire ? undefined : formData.expiryDate,
            credentialId: formData.credentialId,
            credentialUrl: formData.credentialUrl,
            doesNotExpire: formData.doesNotExpire
          };
          
          const updatedCertifications = [newCertification, ...certificationsList];
          updateCertifications(updatedCertifications);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving certification:', error);
      toast.error('Failed to save certification');
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      credentialId: "",
      credentialUrl: "",
      doesNotExpire: false
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (certification: Certification) => {
    setFormData({
      name: certification.name,
      issuer: certification.issuer,
      issueDate: certification.issueDate,
      expiryDate: certification.expiryDate || "",
      credentialId: certification.credentialId || "",
      credentialUrl: certification.credentialUrl || "",
      doesNotExpire: certification.doesNotExpire
    });
    setEditingId(certification.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Only delete from database if it's not a local-only record
      if (!id.startsWith('parsed-cert-')) {
        const success = await deleteCertification(id);
        if (!success) {
          return; // Don't update local state if database deletion failed
        }
      }
      
      // Update local state
      const updatedCertifications = certificationsList.filter(cert => cert.id !== id);
      updateCertifications(updatedCertifications);
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast.error('Failed to delete certification');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry < threeMonthsFromNow && expiry > new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Certifications
          </CardTitle>
          <CardDescription>
            Track your professional certifications and credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowForm(true)}
            variant="primary"
            size="touch"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Certification
          </Button>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Certification</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Certification Name *</label>
                  <Input
                    placeholder="e.g., AWS Certified Solutions Architect"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issuing Organization *</label>
                  <Input
                    placeholder="e.g., Amazon Web Services, Microsoft"
                    value={formData.issuer}
                    onChange={(e) => setFormData({...formData, issuer: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Issue Date</label>
                  <Input
                    type="month"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry Date</label>
                  <Input
                    type="month"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
                    disabled={formData.doesNotExpire}
                    placeholder={formData.doesNotExpire ? "Never expires" : ""}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="doesNotExpire"
                  checked={formData.doesNotExpire}
                  onChange={(e) => setFormData({...formData, doesNotExpire: e.target.checked, expiryDate: e.target.checked ? "" : formData.expiryDate})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="doesNotExpire" className="text-sm font-medium">
                  This certification does not expire
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Credential ID</label>
                  <Input
                    placeholder="e.g., ABC-123-DEF"
                    value={formData.credentialId}
                    onChange={(e) => setFormData({...formData, credentialId: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Credential URL</label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={formData.credentialUrl}
                    onChange={(e) => setFormData({...formData, credentialUrl: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="touch" className="flex-1 md:flex-none" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    `${editingId ? "Update" : "Add"} Certification`
                  )}
                </Button>
                <Button type="button" variant="outline" size="touch" onClick={resetForm} className="flex-1 md:flex-none" disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Certifications List */}
      <div className="space-y-4">
        {certificationsList.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No certifications added yet</h3>
                <p className="text-slate-600 mb-4">
                  Upload a resume in Getting Started or manually add your certifications here.
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  variant="primary"
                  size="touch"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Certification
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          certificationsList.map((certification) => (
            <Card key={certification.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-slate-500" />
                      <h3 className="font-semibold text-lg">{certification.name}</h3>
                      {isExpired(certification.expiryDate) && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          Expired
                        </Badge>
                      )}
                      {!isExpired(certification.expiryDate) && isExpiringSoon(certification.expiryDate) && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Expiring Soon
                        </Badge>
                      )}
                      {certification.doesNotExpire && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Never Expires
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-slate-500" />
                      <p className="text-slate-600 font-medium">{certification.issuer}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(certification.issueDate)}
                        {certification.expiryDate && !certification.doesNotExpire && 
                          ` - ${formatDate(certification.expiryDate)}`
                        }
                        {certification.doesNotExpire && " - Never expires"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {certification.credentialId && (
                        <Badge variant="secondary" className="text-xs">
                          ID: {certification.credentialId}
                        </Badge>
                      )}
                      {certification.credentialUrl && (
                        <a 
                          href={certification.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Credential
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 md:ml-0 md:mt-4">
                    <Button
                      variant="ghost"
                      size="touch"
                      onClick={() => handleEdit(certification)}
                      className="flex-1 md:flex-none"
                    >
                      <Edit2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="touch"
                      onClick={() => handleDelete(certification.id)}
                      className="text-red-600 hover:text-red-700 flex-1 md:flex-none"
                    >
                      <Trash2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Certifications;