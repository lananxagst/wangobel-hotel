import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { RiUserLine, RiLogoutBoxLine } from "react-icons/ri";

const MobileMenu = ({ onClose, user, handleLogout }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
      <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-4">
          {/* User Profile Section */}
          {user && (
            <div className="mb-6 border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                  }}
                />
                <div>
                  <h3 className="font-medium text-gray-900">{user.name}</h3>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              
              <Link 
                to="/profile" 
                className="flex items-center gap-2 text-text-dark hover:text-secondary transition-colors py-2"
                onClick={onClose}
              >
                <RiUserLine className="text-xl" />
                <span>My Profile</span>
              </Link>
            </div>
          )}
          
          {/* Navigation Links */}
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
            {user && (
              <Link 
                to="/my-reservations" 
                className="block text-text-dark hover:text-secondary transition-colors"
                onClick={onClose}
              >
                My Reservation
              </Link>
            )}
            <Link 
              to="/contact" 
              className="block text-text-dark hover:text-secondary transition-colors"
              onClick={onClose}
            >
              Contact
            </Link>
            
            {!user ? (
              <Link 
                to="/login" 
                className="flex items-center gap-2 text-text-dark hover:text-secondary transition-colors"
                onClick={onClose}
              >
                <RiUserLine className="text-xl" />
                <span>Login</span>
              </Link>
            ) : (
              <button 
                className="flex items-center gap-2 text-text-dark hover:text-secondary transition-colors w-full text-left"
                onClick={() => {
                  handleLogout();
                  onClose();
                }}
              >
                <RiLogoutBoxLine className="text-xl" />
                <span>Logout</span>
              </button>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

MobileMenu.propTypes = {
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  handleLogout: PropTypes.func
};

MobileMenu.defaultProps = {
  user: null,
  handleLogout: () => {}
};

export default MobileMenu;
