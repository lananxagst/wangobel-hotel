import { NavLink } from "react-router-dom";
import PropTypes from 'prop-types';

const Navbar = ({containerStyles, onClick}) => {
  const navLinks = [
    { path: "/", title: "Home" },
    { path: "/collection", title: "Collection" },
    { path: "/blog", title: "Blog" },
    { path: "/my-reservations", title: "My Reservations" },
    { path: "mailto:info@shopanza.com", title: "Contact" },
  ];

  return (
    <nav className={`${containerStyles}`}>
      {navLinks.map((link) => (
        <NavLink
          key={link.title}
          to={link.path}
          className={({ isActive }) => `${isActive ? "active-link" : ""} px-3 py-2 rounded-full`}
          onClick={onClick} // Close menu when link clicked
        >
          {link.title}
        </NavLink>
      ))}
    </nav>
  );
};

Navbar.propTypes = {
  containerStyles: PropTypes.string,
  onClick: PropTypes.func
};

export default Navbar;
