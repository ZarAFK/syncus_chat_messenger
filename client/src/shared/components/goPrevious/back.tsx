// BackPreviousAuth.tsx
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const BackPreviousAuth = () => {
  return (
    <Link 
      to="/" 
      className="flex items-center px-12 mt-6 mb-2 text-gray-600 hover:text-blue-700 transition-colors gap-2 w-fit"
    >
      <ChevronLeft size={18} />
      <h3 className="text-sm font-medium">Back to Home</h3>
    </Link>
  );
};

