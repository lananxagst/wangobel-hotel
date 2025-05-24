import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import login from "../assets/wg-logo-fix.png";
import { RoomContext } from "../context/RoomContext.js";
import axios from "axios";
import { toast } from "react-toastify";
import { useGoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const [currState, setCurrState] = useState("Login");
  const navigate = useNavigate();
  const { token, setToken, setUser } = useContext(RoomContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      let response;
      if (currState === "Sign Up") {
        response = await axios.post(`${backendUrl}/api/user/register`, {
          name,
          email,
          password,
        });

        if (response.data.success) {
          // Setelah register berhasil, langsung login
          const loginResponse = await axios.post(`${backendUrl}/api/user/login`, {
            email,
            password,
          });

          if (loginResponse.data.success) {
            setToken(loginResponse.data.token);
            localStorage.setItem("token", loginResponse.data.token);

            // Set user data
            const userData = {
              name,
              email,
              picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            };
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));

            toast.success("Successfully registered and logged in");
          }
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
      toast.error(error.message);
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
            <div className="w-full mb-4">
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
                  placeholder="Name"
                  className="w-full px-3 py-1.5 ring-1 ring-slate-900/5 rounded bg-tertiary mt-1"
                />
              </div>
            )}
            <div className="w-full">
              <label htmlFor="email" className="medium-15">
                Email
              </label>
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type="email"
                placeholder="Email"
                className="w-full px-3 py-1.5 ring-1 ring-slate-900/5 rounded bg-tertiary mt-1"
              />
            </div>
            <div className="w-full">
              <label htmlFor="password" className="medium-15">
                Password
              </label>
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type="password"
                placeholder="Password"
                className="w-full px-3 py-1.5 ring-1 ring-slate-900/5 rounded bg-tertiary mt-1"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-secondary text-white py-2.5 rounded-lg hover:bg-secondary/90 transition-all mt-5"
            >
              {currState === "Sign Up" ? "Sign Up" : "Login"}
            </button>

            <button
              type="button"
              onClick={() => googleLogin()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-all mt-3"
            >
              <FcGoogle className="text-xl" />
              <span>Continue with Google</span>
            </button>
            <div className="w-full flex flex-col gap-y-3">
              {currState === "Login" ? (
                <>
                  <div className="underline medium-15">
                    Forgot your password?
                  </div>
                  <div className="underline medium-15">
                    Dont have an account?
                    <span
                      onClick={() => setCurrState("Sign Up")}
                      className="cursor-pointer pl-1"
                    >
                      Create account
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className="text-sm text-gray-600 hover:text-secondary cursor-pointer"
                >
                  Already have an account?
                  <span
                    onClick={() => setCurrState("Login")}
                    className="cursor-pointer pl-1"
                  >
                    Login
                  </span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
