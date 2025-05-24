// import { useEffect, useState } from "react";
// import { Link } from "react-router-dom";
// import { backend_url } from "../App";
// import { FaBed, FaUsers, FaWifi, FaTv } from "react-icons/fa";
// import axios from "axios";

// const FeaturedRooms = () => {
//   const [rooms, setRooms] = useState([]);

//   useEffect(() => {
//     const fetchRooms = async () => {
//       try {
//         const { data } = await axios.get(`${backend_url}/api/rooms/featured`);
//         setRooms(Array.isArray(data) ? data : []);
//       } catch (error) {
//         console.error('Error fetching featured rooms:', error);
//       }
//     };
//     fetchRooms();
//   }, []);

//   return (
//     <section className="py-24 bg-white">
//       <div className="max-w-7xl mx-auto px-4">
//         <div className="text-center mb-16">
//           <p className="text-lg text-secondary mb-2 tracking-widest">ROOMS</p>
//           <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Featured Rooms</h2>
//           <p className="text-text-light max-w-2xl mx-auto">
//             Experience luxury in our carefully selected premium rooms
//           </p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//           {rooms.map((room) => (
//             <Link
//               to={`/room/${room._id}`}
//               key={room._id}
//               className="group bg-white overflow-hidden border border-gray-100 hover:border-secondary/20 transition-colors"
//             >
//               <div className="relative">
//                 <img
//                   src={room.images[0]?.url || '/placeholder-room.jpg'}
//                   alt={room.name}
//                   className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
//                 />
//                 <div className="absolute top-4 right-4 bg-secondary text-primary font-bold px-4 py-2">
//                   ${room.price}/night
//                 </div>
//               </div>

//               <div className="p-8">
//                 <h3 className="text-xl font-bold text-text-dark mb-3 group-hover:text-secondary transition-colors">{room.name}</h3>
//                 <p className="text-gray-600 mb-4 line-clamp-2">{room.description}</p>

//                 <div className="grid grid-cols-2 gap-4">
//                   <div className="flex items-center text-gray-600">
//                     <FaBed className="mr-2" />
//                     <span>{room.roomType}</span>
//                   </div>
//                   <div className="flex items-center text-gray-600">
//                     <FaUsers className="mr-2" />
//                     <span>Up to {room.capacity} guests</span>
//                   </div>
//                   <div className="flex items-center text-gray-600">
//                     <FaWifi className="mr-2" />
//                     <span>Free WiFi</span>
//                   </div>
//                   <div className="flex items-center text-gray-600">
//                     <FaTv className="mr-2" />
//                     <span>Smart TV</span>
//                   </div>
//                 </div>

//                 <button className="w-full mt-6 bg-primary/10 text-primary font-semibold py-2 rounded hover:bg-primary hover:text-white transition-colors">
//                   View Details
//                 </button>
//               </div>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// };

// export default FeaturedRooms;
