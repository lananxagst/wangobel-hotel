import { useState } from 'react'
import { FaDribbble, FaFacebookF, FaInstagram } from 'react-icons/fa6'
import { toast } from 'react-toastify'
import axios from 'axios'

const NewsLetter = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic email validation
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setLoading(true);
    
    try {
      // Ensure we have the backend URL
      if (!backendUrl) {
        console.error('Backend URL is not defined');
        toast.error('Configuration error. Please contact support.');
        setLoading(false);
        return;
      }
      
      // Log the request for debugging
      console.log('Sending subscription request to:', `${backendUrl}/api/subscribers`);
      console.log('Request payload:', { email });
      
      // Send subscription to backend API with timeout
      const response = await axios.post(`${backendUrl}/api/subscribers`, { email }, {
        timeout: 10000, // 10 seconds timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Subscription response:', response.data);
      
      // Show success message
      toast.success(response.data.message || 'Thank you for subscribing to our newsletter!');
      
      // Clear the input
      setEmail('');
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      
      // More detailed error handling
      if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try again later.');
      } else if (!error.response) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        // Show error message from API if available, otherwise show generic message
        const errorMessage = error.response?.data?.message || 'Something went wrong. Please try again later.';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className='max-padd-container border-t-[1px] border-b-[1px] border-primary py-4'>
      <div className='flexBetween flex-wrap gap-7'>
        <div>
          <h4 className='bold-14 uppercase tracking-wider'>Subscribe newsletter</h4>
          <p>Get latest information on Events, Sales & Offers.</p>
        </div>
        <div>
          <form onSubmit={handleSubmit} className='flex bg-secondary'>
            <input 
              type="email" 
              placeholder='Email Address' 
              className='p-4 bg-tertiary w-[266px] outline-none text-[13px]'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button 
              type="submit"
              className='btn-yellow !rounded-none !text-[13px] !font-bold uppercase'
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
        <div className='flex gap-x-3 pr-14'>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className='h-8 w-8 rounded-full hover:bg-tertiary hover:text-white flexCenter transition-all duration-500'>
            <FaFacebookF />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className='h-8 w-8 rounded-full hover:bg-tertiary hover:text-white flexCenter transition-all duration-500'>
            <FaInstagram />
          </a>
          <a href="https://dribbble.com" target="_blank" rel="noopener noreferrer" className='h-8 w-8 rounded-full hover:bg-tertiary hover:text-white flexCenter transition-all duration-500'>
            <FaDribbble />
          </a>
        </div>
      </div>
    </section>
  )
}

export default NewsLetter