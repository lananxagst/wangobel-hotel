import { useState, useContext, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/wg-navbar-logo.png";
import MobileMenu from "./MobileMenu";
import { FaBars, FaBarsStaggered } from "react-icons/fa6";
import { RiUserLine } from "react-icons/ri";
import { RoomContext } from "../context/RoomContext.js";

const Header = () => {
  const [menuOpened, setMenuOpened] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, setUser, setToken } = useContext(RoomContext);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const toggleMenu = () => setMenuOpened((prev) => !prev);

  return (
    <>
      <header className="w-full bg-primary text-white">
        <div className="max-w-container mx-auto px-4 py-6 flex justify-between items-center">
          {/* LOGO  */}
          <Link to={"/"} className="flex items-center -ml-3 gap-2">
            <img 
              src={logo} 
              alt="WG Hotel Logo" 
              className="h-16 w-auto hover:opacity-90 transition-opacity scale-150 -translate-y-1 gap-2" 
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none">
                WG HOTEL
              </span>
              <span className="text-sm font-medium text-secondary mt-1 ml-3">
                JIMBARAN
              </span>
            </div>
          </Link>
          {/* NAVBAR */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/" className="text-white hover:text-secondary transition-colors">Home</Link>
            <Link to="/rooms" className="text-white hover:text-secondary transition-colors">Rooms</Link>
            <Link to="/about" className="text-white hover:text-secondary transition-colors">About</Link>
            {user && (
              <Link to="/my-reservations" className="text-white hover:text-secondary transition-colors">Reservations</Link>
            )}
            <Link to="/contact" className="text-white hover:text-secondary transition-colors">Contact</Link>
          </div>
          
          {/* RIGHT SIDE: LOGIN/PROFILE & MENU */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Mobile Avatar (visible on small screens) */}
                <img
                  src={user.picture}
                  alt={user.name}
                  onClick={toggleMenu}
                  className="lg:hidden w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-secondary transition-all"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                  }}
                />
                
                {/* Desktop Avatar (visible on large screens) */}
                <div className="hidden lg:block relative" ref={profileRef}>
                  <img
                    src={user.picture}
                    alt={user.name}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="w-8 h-8 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-secondary transition-all"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                    }}
                  />
                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-secondary cursor-pointer"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Profile
                      </Link>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setShowProfileMenu(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-secondary cursor-pointer"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Mobile Login Link (hidden on desktop) */}
                <Link
                  to="/login"
                  className="lg:hidden flex items-center gap-2 text-white hover:text-secondary transition-colors"
                  onClick={toggleMenu}
                >
                  <RiUserLine className="text-xl" />
                </Link>

                {/* Desktop Login Link (hidden on mobile) */}
                <Link
                  to="/login"
                  className="hidden lg:flex items-center gap-2 text-white hover:text-secondary transition-colors"
                >
                  <RiUserLine className="text-xl" />
                  <span>Login</span>
                </Link>
              </>
            )}
            
            {/* MENU TOGGLE - only show if not showing mobile avatar */}
            {(!user || (user && window.innerWidth > 768)) && (
              <button
                onClick={toggleMenu}
                className="lg:hidden text-white hover:text-secondary transition-colors"
              >
                {menuOpened ? (
                  <FaBarsStaggered className="text-2xl" />
                ) : (
                  <FaBars className="text-2xl" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>
      {menuOpened && <MobileMenu onClose={toggleMenu} user={user} handleLogout={handleLogout} />}
    </>
  );
};

export default Header;
