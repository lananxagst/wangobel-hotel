import PropTypes from 'prop-types';
import { Link, NavLink } from "react-router-dom";
import { FaHotel, FaBed, FaChartLine, FaCalendarCheck } from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";

const Sidebar = ({setToken}) => {
  const handleLogout = () => {
    setToken("");
    localStorage.removeItem('adminToken');
  };

  return (
    <div className="max-sm:flexCenter max-sm:pb-3 sm:w-1/5 sm:min-h-screen bg-tertiary text-primary shadow-lg">
      <div className="flex flex-col gap-y-6 max-sm:items-center sm:flex-col pt-4 sm:pt-10 w-full">
        {/* LOGO */}
        <div className="flex items-center justify-center sm:justify-start sm:pl-6 lg:pl-8 py-4 border-b border-gray-700 w-full">
          <FaHotel className="text-secondary text-2xl mr-3" />
          <Link to={"/"} className="text-xl font-bold tracking-wide">
            <span className="text-secondary">WG</span> Hotel Admin
          </Link>
        </div>
        
        {/* LINKS */}
        <div className="flex sm:flex-col gap-x-5 gap-y-3 sm:pt-6 w-full px-2">
          <NavLink
            to={"/"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-3 px-4 py-3 bg-secondary/20 text-secondary rounded-lg font-medium transition-all duration-200 w-full"
                : "flex items-center gap-x-3 px-4 py-3 hover:bg-white/10 rounded-lg font-medium transition-all duration-200 w-full"
            }
          >
            <FaHotel className="text-lg" />
            <span className="hidden lg:block">Add Room</span>
          </NavLink>
          
          <NavLink
            to={"/rooms"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-3 px-4 py-3 bg-secondary/20 text-secondary rounded-lg font-medium transition-all duration-200 w-full"
                : "flex items-center gap-x-3 px-4 py-3 hover:bg-white/10 rounded-lg font-medium transition-all duration-200 w-full"
            }
          >
            <FaBed className="text-lg" />
            <span className="hidden lg:block">Manage Rooms</span>
          </NavLink>

          <NavLink
            to={"/bookings"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-3 px-4 py-3 bg-secondary/20 text-secondary rounded-lg font-medium transition-all duration-200 w-full"
                : "flex items-center gap-x-3 px-4 py-3 hover:bg-white/10 rounded-lg font-medium transition-all duration-200 w-full"
            }
          >
            <FaCalendarCheck className="text-lg" />
            <span className="hidden lg:block">Bookings</span>
          </NavLink>

          <NavLink
            to={"/list"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-3 px-4 py-3 bg-secondary/20 text-secondary rounded-lg font-medium transition-all duration-200 w-full"
                : "flex items-center gap-x-3 px-4 py-3 hover:bg-white/10 rounded-lg font-medium transition-all duration-200 w-full"
            }
          >
            <FaChartLine className="text-lg" />
            <span className="hidden lg:block">Statistics</span>
          </NavLink>
          
          <div className="border-t border-gray-700 my-4 w-full"></div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-x-3 px-4 py-3 text-primary rounded-lg font-medium transition-all duration-200 w-full mt-auto"
          >
            <BiLogOut className="text-lg" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
        
        <div className="mt-auto px-4 py-6 text-xs text-gray-400 hidden sm:block">
          <p>© 2025 WG Hotel Admin</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  setToken: PropTypes.func.isRequired
};

export default Sidebar;
