import PropTypes from 'prop-types';
import { NavLink } from "react-router-dom";
import { FaHotel, FaBed, FaChartLine, FaCalendarCheck } from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";

const Sidebar = ({setToken}) => {
  const handleLogout = () => {
    setToken("");
    localStorage.removeItem('adminToken');
  };

  return (
    <div className="h-full sm:w-[200px] bg-white text-primary shadow-lg sm:border-r border-gray-200 max-sm:flex max-sm:flex-col">
      <div className="sm:flex sm:flex-col h-full">
        {/* LOGO */}
        <div className="flex sm:flex-col items-center justify-center py-2 sm:py-5 border-b border-gray-200 bg-tertiary">
          <div className="flex items-center">
            <FaHotel className="text-secondary text-xl sm:text-2xl mr-1 sm:mr-2" />
            <span className="text-lg sm:text-xl font-bold tracking-wide">
              <span className="text-secondary">WG</span> Hotel <span className="sm:hidden">Admin</span>
            </span>
          </div>
          <div className="text-xs text-gray-500 font-medium hidden sm:block">Admin</div>
        </div>
        
        {/* LINKS - vertical on desktop, icon-only centered on mobile */}
        <div className="sm:flex sm:flex-col sm:py-5 sm:gap-y-2 sm:px-3 sm:flex-1 
                     max-sm:flex max-sm:flex-row max-sm:justify-center max-sm:py-2 max-sm:px-1 max-sm:gap-x-4 max-sm:border-b max-sm:border-gray-200">
          <div className="text-xs uppercase text-gray-500 font-semibold px-3 pb-2 hidden sm:block">Menu</div>
          <NavLink
            to={"/"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 bg-secondary/10 sm:bg-secondary/10 text-secondary rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
                : "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 hover:bg-gray-100 text-gray-700 rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
            }
          >
            <FaHotel className="text-lg" />
            <span className="max-sm:hidden">Add Room</span>
          </NavLink>
          
          <NavLink
            to={"/rooms"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 bg-secondary/10 sm:bg-secondary/10 text-secondary rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
                : "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 hover:bg-gray-100 text-gray-700 rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
            }
          >
            <FaBed className="text-lg" />
            <span className="max-sm:hidden">Manage Rooms</span>
          </NavLink>

          <NavLink
            to={"/bookings"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 bg-secondary/10 sm:bg-secondary/10 text-secondary rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
                : "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 hover:bg-gray-100 text-gray-700 rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
            }
          >
            <FaCalendarCheck className="text-lg" />
            <span className="max-sm:hidden">Bookings</span>
          </NavLink>

          <NavLink
            to={"/list"}
            className={({ isActive }) =>
              isActive
                ? "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 bg-secondary/10 sm:bg-secondary/10 text-secondary rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
                : "flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 hover:bg-gray-100 text-gray-700 rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
            }
          >
            <FaChartLine className="text-lg" />
            <span className="max-sm:hidden">Dashboard</span>
          </NavLink>
          
          <div className="border-t border-gray-200 my-4 w-full hidden sm:block"></div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-x-2 sm:px-4 sm:py-2 py-1 text-gray-700 hover:bg-gray-100 rounded-md sm:font-medium transition-all duration-200 sm:w-full max-sm:px-2"
          >
            <BiLogOut className="text-lg" />
            <span className="max-sm:hidden">Logout</span>
          </button>
        </div>
        
        <div className="mt-auto px-4 py-4 text-xs text-gray-400 border-t border-gray-200 bg-tertiary hidden sm:block">
          <p> 2025 WG Hotel</p>
          <p>Version 10.0.0</p>
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  setToken: PropTypes.func.isRequired
};

export default Sidebar;
