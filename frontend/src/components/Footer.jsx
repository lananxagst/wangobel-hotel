import cards from "../assets/cards.png"
import logo from "../assets/wg-navbar-logo.png"
import { Link } from "react-router-dom"
import { FaCode, FaCopyright } from "react-icons/fa6";
import { RiReservedLine } from "react-icons/ri";

const Footer = () => {
  return (
    <footer className="bg-primary gap">
      <div className="max-padd-container flex items-start justify-between flex-wrap gap-12 mt-12">
        {/* logo - Left side */}
        <div className="flex flex-col max-w-sm gap-y-5">
          <Link to={"/"} className="flex items-center -ml-3 gap-2 mt-5">
            <img 
              src={logo} 
              alt="WG Hotel Logo" 
              className="h-16 w-auto hover:opacity-90 transition-opacity scale-150 -translate-y-1 gap-2" 
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-none text-tertiary">
                WG HOTEL
              </span>
              <span className="text-sm font-medium text-secondary mt-1 ml-3">
                JIMBARAN
              </span>
            </div>
          </Link>
          <p className="text-tertiary/90">
          Hotel Wg Jimbaran, located in Ungasan, provides free self parking and a swimming pool. Paintball is 500 meters from the property, while Pandawa Beach is 4.3 km away.
          </p>
          <img src={cards} alt="" height={33} width={144} className="mt-5"/>
        </div>
        <div className="flexStart gap-7 xl:gap-x-36 flex-wrap mt-5">
          <ul>
            <h4 className="h4 mb-3 text-tertiary">Customer Service</h4>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Help center
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Payment methods
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Contact
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Shipping status
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Complaints
              </a>
            </li>
          </ul>
          <ul>
            <h4 className="h4 mb-3">Legal</h4>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Privacy Policy
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Cookie settings
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Terms & conditions
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Cancelation
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Imprint
              </a>
            </li>
          </ul>
          <ul>
            <h4 className="h4 mb-3">Others</h4>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Our teams
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Sustainability
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Press
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Jobs
              </a>
            </li>
            <li className="my-2">
              <a href="" className="text-tertiary/90 hover:text-tertiary transition-colors regular-14 ">
                Newsletter
              </a>
            </li>
          </ul>
        </div>
      </div>
      {/* copyrights */}
      <p className="max-padd-container bg-primary py-2 px-8 rounded flexBetween mt-6">
        <span className="text-tertiary/90 flex items-center gap-2"> 
        <FaCopyright className="text-sec/90"  />
        2025 WG Hotel Jimbaran</span>
        <span className="text-tertiary/90 flex items-center gap-2"> 
        <FaCode className="text-tertiary/90"  />
        Code with Lanang</span>
        <span className="text-tertiary/90 flex items-center gap-2">
        <RiReservedLine />
        All rights reserved</span>
      </p>
    </footer> 
  );
};

export default Footer;
