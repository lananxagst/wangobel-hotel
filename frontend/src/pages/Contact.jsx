import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Open default email client with pre-filled recipient
    window.location.href = 'mailto:wghoteljimbaran@gmail.com?subject=Contact WG Hotel&body=Hello WG Hotel Jimbaran,';
    
    // Navigate back to home after a short delay
    const timeout = setTimeout(() => {
      navigate('/');
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [navigate]);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Opening Email Client...</h1>
        <p>If your email client doesn&apos;t open automatically, please email us at:</p>
        <a 
          href="mailto:wghoteljimbaran@gmail.com" 
          className="text-secondary hover:underline font-medium"
        >
          wghoteljimbaran@gmail.com
        </a>
      </div>
    </div>
  );
};

export default Contact;
