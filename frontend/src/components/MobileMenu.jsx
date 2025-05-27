import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { RiUserLine } from "react-icons/ri";

const MobileMenu = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
      <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-4">
          <nav className="space-y-4">
            <Link 
              to="/" 
              className="block text-text-dark hover:text-secondary transition-colors"
              onClick={onClose}
            >
              Home
            </Link>
            <Link 
              to="/rooms" 
              className="block text-text-dark hover:text-secondary transition-colors"
              onClick={onClose}
            >
              Rooms
            </Link>
            <Link 
              to="/about" 
              className="block text-text-dark hover:text-secondary transition-colors"
              onClick={onClose}
            >
              About
            </Link>
            <Link 
              to="/my-reservations" 
              className="block text-text-dark hover:text-secondary transition-colors"
              onClick={onClose}
            >
              My Reservation
            </Link>
            <Link 
              to="/contact" 
              className="block text-text-dark hover:text-secondary transition-colors"
              onClick={onClose}
            >
              Contact
            </Link>
            <Link 
              to="/login" 
              className="flex items-center gap-2 text-text-dark hover:text-secondary transition-colors"
              onClick={onClose}
            >
              <RiUserLine className="text-xl" />
              <span>Login</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
};

MobileMenu.propTypes = {
  onClose: PropTypes.func.isRequired
};

export default MobileMenu;
