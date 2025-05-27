import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import login from "../assets/wg-logo-fix.png";
import { RoomContext } from "../context/RoomContext.js";
import axios from "axios";
import { toast } from "react-toastify";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import { IoMdArrowBack } from "react-icons/io";

const Login = () => {
  const [currState, setCurrState] = useState("Login");
  const navigate = useNavigate();
  const { token, setToken, setUser } = useContext(RoomContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const isInitialLoad = useRef(true);

  const googleLogin = useGoogleLogin({
    onSuccess: async (response) => {
      try {
        // Get user info from Google
        const userInfo = await axios.get(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${response.access_token}` },
          }
        );

        // Send to our backend
        const loginResponse = await axios.post(
          `${backendUrl}/api/user/google-login`,
          {
            name: userInfo.data.name,
            email: userInfo.data.email,
            googleId: userInfo.data.sub,
            picture: userInfo.data.picture
          }
        );

        if (loginResponse.data.success) {
          setToken(loginResponse.data.token);
          localStorage.setItem("token", loginResponse.data.token);

          const userData = {
            name: userInfo.data.name,
            email: userInfo.data.email,
            picture: userInfo.data.picture
          };
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));

          toast.success("Successfully logged in with Google");
        } else {
          toast.error(loginResponse.data.message);
        }
      } catch (error) {
        console.error("Google login error:", error);
        toast.error("Failed to login with Google");
      }
    },
    onError: () => {
      toast.error("Failed to login with Google");
    },
  });

  // Validate form fields based on current state
  const validateForm = () => {
    const newErrors = {};
    
    if (currState === "Sign Up") {
      // Name validation
      if (!name.trim()) {
        newErrors.name = "Name is required";
      }
    }
    
    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation (not needed for forgot password)
    if (currState !== "Forgot Password" && !password) {
      newErrors.password = "Password is required";
    } else if (currState !== "Forgot Password" && password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    
    // Reset email validation
    if (currState === "Forgot Password") {
      if (!resetEmail.trim()) {
        newErrors.resetEmail = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
        newErrors.resetEmail = "Please enter a valid email address";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle forgot password request
  const handleForgotPassword = async () => {
    // Clear previous errors
    setErrors({});
    
    // Validate the email
    if (!resetEmail.trim()) {
      setErrors({ resetEmail: "Email is required" });
      return;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
      setErrors({ resetEmail: "Please enter a valid email address" });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${backendUrl}/api/user/forgot-password`, {
        email: resetEmail
      });
      
      if (response.data.success) {
        setResetSent(true);
        toast.success("Password reset link has been sent to your email");
      } else {
        toast.error(response.data.message || "Failed to send reset link");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error(error.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    
    // Handle forgot password separately
    if (currState === "Forgot Password") {
      await handleForgotPassword();
      return;
    }
    
    // Clear previous errors
    setErrors({});
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      let response;
      if (currState === "Sign Up") {
        response = await axios.post(`${backendUrl}/api/user/register`, {
          name,
          email,
          password,
        });

        if (response.data.success) {
          // Store the token and user data from registration response
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);
          
          // Use user data returned from the server
          const userData = response.data.user || {
            name,
            email,
            picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
          };
          
          setUser(userData);
          localStorage.setItem("user", JSON.stringify(userData));
          
          toast.success("Successfully registered and logged in");
          navigate("/");
        } else {
          toast.error(response.data.message);
        }
      } else {
        response = await axios.post(`${backendUrl}/api/user/login`, {
          email,
          password,
        });

        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem("token", response.data.token);

          // Get user data from backend
          const userResponse = await axios.get(`${backendUrl}/api/user/profile`, {
            headers: { Authorization: `Bearer ${response.data.token}` }
          });

          if (userResponse.data.success) {
            const userData = {
              name: userResponse.data.user.name,
              email: userResponse.data.user.email,
              picture: userResponse.data.user.picture || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userResponse.data.user.name)}&background=random`
            };
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
          }

          toast.success("Successfully logged in");
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Hanya redirect jika user baru saja login (token berubah)
    // dan bukan saat pertama kali load halaman
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    if (token) {
      navigate("/");
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen w-full bg-white">
      {/* CONTAINER */}
      <div className="flex h-full w-full">
        {/* IMAGE SIDE */}
        <div className="w-1/2 hidden sm:block">
          <img
            src={login}
            alt="loginImg"
            className="object-cover h-full w-full"
          />
        </div>
        {/* FORM SIDE */}
        <div className="flexCenter w-full sm:w-1/2 text-[90%]">
          <form
            onSubmit={onSubmitHandler}
            className="flex flex-col items-center w-[90%] sm:max-w-md m-auto gap-y-5"
          >
            <div className="w-full mb-4 flex items-center">
              {currState !== "Login" && (
                <button 
                  type="button"
                  onClick={() => {
                    setCurrState("Login");
                    setResetSent(false);
                  }}
                  className="mr-3 text-secondary hover:text-secondary/80"
                >
                  <IoMdArrowBack className="text-xl" />
                </button>
              )}
              <h3 className="bold-36">{currState}</h3>
            </div>
            {currState === "Sign Up" && (
              <div className="w-full">
                <label htmlFor="name" className="medium-15">
                  Name
                </label>
                <input
                  onChange={(e) => setName(e.target.value)}
                  value={name}
                  type="text"
                  id="name"
                  placeholder="Name"
                  className={`w-full px-3 py-1.5 ring-1 ${errors.name ? 'ring-red-500' : 'ring-slate-900/5'} rounded bg-tertiary mt-1`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
            )}
            
            {currState === "Forgot Password" && !resetSent && (
              <div className="w-full">
                <p className="text-gray-600 mb-4">Enter your email address and we will send you a link to reset your password.</p>
                <label htmlFor="resetEmail" className="medium-15">
                  Email Address
                </label>
                <input
                  onChange={(e) => setResetEmail(e.target.value)}
                  value={resetEmail}
                  type="email"
                  id="resetEmail"
                  placeholder="Email"
                  className={`w-full px-3 py-1.5 ring-1 ${errors.resetEmail ? 'ring-red-500' : 'ring-slate-900/5'} rounded bg-tertiary mt-1`}
                />
                {errors.resetEmail && <p className="text-red-500 text-xs mt-1">{errors.resetEmail}</p>}
              </div>
            )}
            
            {currState === "Forgot Password" && resetSent && (
              <div className="w-full text-center py-4">
                <div className="flex justify-center mb-4">
                  <svg className="h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Check Your Email</h3>
                <p className="text-gray-600">We&apos;ve sent a password reset link to <strong>{resetEmail}</strong></p>
                <p className="text-gray-600 mt-4">Didn&apos;t receive the email? Check your spam folder or</p>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-secondary hover:underline mt-1"
                >
                  Click here to try again
                </button>
              </div>
            )}
            {(currState === "Login" || currState === "Sign Up") && (
              <>
                <div className="w-full">
                  <label htmlFor="email" className="medium-15">
                    Email
                  </label>
                  <input
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    type="email"
                    id="email"
                    placeholder="Email"
                    className={`w-full px-3 py-1.5 ring-1 ${errors.email ? 'ring-red-500' : 'ring-slate-900/5'} rounded bg-tertiary mt-1`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                <div className="w-full">
                  <label htmlFor="password" className="medium-15">
                    Password
                  </label>
                  <input
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    type="password"
                    id="password"
                    placeholder="Password"
                    className={`w-full px-3 py-1.5 ring-1 ${errors.password ? 'ring-red-500' : 'ring-slate-900/5'} rounded bg-tertiary mt-1`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                  {currState === "Sign Up" && !errors.password && password && (
                    <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters long</p>
                  )}
                </div>
              </>
            )}
            {(currState !== "Forgot Password" || !resetSent) && (
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-secondary text-white py-2.5 rounded-lg hover:bg-secondary/90 transition-all mt-5 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  currState === "Sign Up" ? "Sign Up" : 
                  currState === "Forgot Password" ? "Send Reset Link" : "Login"
                )}
              </button>
            )}

            {(currState === "Login" || currState === "Sign Up") && (
              <button
                type="button"
                onClick={() => googleLogin()}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all mt-3"
              >
                <FcGoogle className="text-xl" />
                <span>Continue with Google</span>
              </button>
            )}
            {!resetSent && (
              <div className="w-full flex flex-col gap-y-3">
                {currState === "Login" ? (
                  <>
                    <div 
                      className="underline medium-15 cursor-pointer hover:text-secondary"
                      onClick={() => {
                        setCurrState("Forgot Password");
                        setResetEmail(email); // Pre-fill with current email if exists
                      }}
                    >
                      Forgot your password?
                    </div>
                    <div className="underline medium-15">
                      Don&apos;t have an account?
                      <span
                        onClick={() => setCurrState("Sign Up")}
                        className="cursor-pointer pl-1 hover:text-secondary"
                      >
                        Create account
                      </span>
                    </div>
                  </>
                ) : currState === "Sign Up" ? (
                  <div
                    className="text-sm text-gray-600 hover:text-secondary cursor-pointer"
                  >
                    Already have an account?
                    <span
                      onClick={() => setCurrState("Login")}
                      className="cursor-pointer pl-1 hover:text-secondary"
                    >
                      Login
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
