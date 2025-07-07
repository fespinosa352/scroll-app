import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Star } from "lucide-react";

const SocialProof = () => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
      <CardContent className="p-6 md:p-8">
        <div className="text-center space-y-6">
          <h3 className="text-lg md:text-xl font-semibold text-slate-900">
            Join thousands of professionals who've improved their careers
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-600">15,000+</div>
              <div className="text-sm text-slate-600">Professionals using Chameleon</div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-600">+23</div>
              <div className="text-sm text-slate-600">Average ATS score improvement</div>
            </div>
            
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl md:text-3xl font-bold text-purple-600">4.9/5</div>
              <div className="text-sm text-slate-600">User satisfaction rating</div>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="outline" className="bg-white/50">Microsoft employees</Badge>
            <Badge variant="outline" className="bg-white/50">Google professionals</Badge>
            <Badge variant="outline" className="bg-white/50">Airbnb team members</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialProof;