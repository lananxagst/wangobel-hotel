import login from "../assets/loginImg.png";
import axios from "axios";
import { useState } from "react";
import PropTypes from 'prop-types';
import { backend_url } from "../constants";
import { toast } from "react-toastify";
import { FaHotel, FaLock, FaEnvelope } from "react-icons/fa";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault(); // prevent reload
      if (!email || !password) {
        toast.error('Please enter both email and password');
        return;
      }

      setLoading(true);
      
      const response = await axios.post(`${backend_url}/api/user/admin/login`, {
        email,
        password,
      });

      if (response.data.success) {
        toast.success('Login successful');
        setToken(response.data.token);
      } else {
        toast.error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-0 left-0 h-full w-full z-50 bg-tertiary">
      {/* CONTAINER */}
      <div className="flex h-full w-full overflow-hidden">
        {/* IMAGE SIDE */}
        <div className="w-2/3 hidden lg:block relative">
          <img src={login} alt="" className="object-cover h-full w-full" />
          <div className="absolute inset-0 bg-primary/40 flex flex-col justify-center items-center p-10">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-lg max-w-md text-white border border-white/20">
              <h2 className="text-3xl font-bold mb-4">WG Hotel Admin Panel</h2>
              <p className="text-lg mb-3">Manage your hotel resources with ease</p>
              <ul className="space-y-2 text-sm opacity-90">
                <li>• Room Management</li>
                <li>• Booking Overview</li>
                <li>• Property Maintenance</li>
                <li>• Staff Scheduling</li>
              </ul>
            </div>
          </div>
        </div>
        {/* FORM SIDE */}
        <div className="flex items-center justify-center w-full lg:w-1/3 px-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary/10 text-secondary rounded-full mb-4">
                  <FaHotel className="text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Admin Login</h2>
                <p className="text-gray-500 text-sm mt-1">Enter your credentials to access the dashboard</p>
              </div>
              
              <form onSubmit={onSubmitHandler} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="admin@example.com"
                      className="admin-input pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      className="admin-input pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="admin-btn-secondary w-full flex items-center justify-center"
                  >
                    {loading ? (
                      <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    ) : null}
                    {loading ? 'Signing in...' : 'Sign in'}
                  </button>
                </div>
              </form>
            </div>
            
            <div className="text-center mt-6">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} WG Hotel. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

Login.propTypes = {
  setToken: PropTypes.func.isRequired
};

export default Login;
