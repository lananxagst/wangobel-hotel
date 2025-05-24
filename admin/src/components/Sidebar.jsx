import PropTypes from 'prop-types';
import { Link, NavLink } from "react-router-dom";
import { FaHotel, FaBed } from "react-icons/fa";
import { BiLogOut } from "react-icons/bi";

const Sidebar = ({setToken}) => {
  const handleLogout = () => {
    setToken("");
    localStorage.removeItem('adminToken');
  };

  return (
    <div className="max-sm:flexCenter max-sm:pb-3 rounded bg-white pb-3 sm:w-1/5 sm:min-h-screen">
      <div className="flex flex-col gap-y-6 max-sm:items-center sm:flex-col pt-4 sm:pt-14">
        {/* LOGO */}
        <Link to={"/"} className="bold-22 xl:bold-32 sm:pl-2 lg:pl-12">
          WG Hotel Admin
        </Link>
        {/* LINKS */}
        <div className="flex sm:flex-col gap-x-5 gap-y-8 sm:pt-10">
          <NavLink
            to={"/"}
            className={({ isActive }) =>
              isActive
                ? "active-link"
                : "flexStart gap-x-2 sm:pl-12 p-5 medium-15 cursor-pointer h-10 rounded-xl"
            }
          >
            <FaHotel />
            <div className="hidden lg:flex">Add Room</div>
          </NavLink>
          <NavLink
            to={"/rooms"}
            className={({ isActive }) =>
              isActive
                ? "active-link"
                : "flexStart gap-x-2 sm:pl-12 p-5 medium-15 cursor-pointer h-10 rounded-xl"
            }
          >
            <FaBed />
            <div className="hidden lg:flex">Manage Rooms</div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flexStart gap-x-2 sm:pl-12 p-5 medium-15 cursor-pointer h-10 rounded-xl text-red-600 hover:text-red-700"
          >
            <BiLogOut />
            <div className="hidden lg:flex">Logout</div>
          </button>
        </div>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  setToken: PropTypes.func.isRequired
};

export default Sidebar;
