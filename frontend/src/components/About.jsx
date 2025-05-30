import { useState } from 'react';
import { FaUserGroup } from 'react-icons/fa6';
import { BiBed } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { FaExpand } from 'react-icons/fa';
import rooftop from '../assets/rooftop.jpg';
import pool from '../assets/wg-kolamrenang.jpeg'

// Data galeri foto hotel
const galleryImages = [
  {
    id: 1,
    title: 'Lobby Area',
    url: 'https://res.cloudinary.com/ddvkl3pvi/image/upload/v1748598787/wangobel-rooms/eabgb3qhkllf28kuancz.jpg',
  },
  {
    id: 2,
    title: 'Swimming Pool',
    url: 'https://res.cloudinary.com/ddvkl3pvi/image/upload/v1748596550/wangobel-rooms/qnefc3bq1xzqzksdje6x.jpg',
  },
  {
    id: 3,
    title: 'Bar',
    url: 'https://res.cloudinary.com/ddvkl3pvi/image/upload/v1748599049/wangobel-rooms/bavcnzotcjntxv54vdwl.jpg',
  },
  {
    id: 4,
    title: 'places',
    url: 'https://res.cloudinary.com/ddvkl3pvi/image/upload/v1748598791/wangobel-rooms/jf40ongannqkwiisib3q.jpg',
  },
  {
    id: 5,
    title: 'Deluxe Room',
    url: 'https://res.cloudinary.com/ddvkl3pvi/image/upload/v1748596546/wangobel-rooms/revdqzf7krzhesjujfen.jpg',
  },
  {
    id: 6,
    title: 'Another Pool Spot',
    url: 'https://res.cloudinary.com/ddvkl3pvi/image/upload/v1748598789/wangobel-rooms/kg5kab4aai4msboc907l.jpg',
  }
];

const About = () => {
  const navigate = useNavigate();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(null);

  const openLightbox = (image) => {
    setActiveImage(image);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <section className='max-padd-container py-16 bg-extra-light'>
      <div className="text-center mb-16">
          <p className="text-lg text-secondary mb-2 tracking-widest">ABOUT</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">About Us</h2>
          <p className="text-text-light max-w-2xl mx-auto">
            Welcome to a hidden realm of extraordinary accommodations where luxury, comfort, and adventure converge. Our underground hotels offer an unparalleled escape from the ordinary, inviting you to explore a subterranean world of wonders.
          </p>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left Side - Strong Team */}
          <div className='text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow'>
            <div className='inline-flex justify-center items-center w-16 h-16 rounded-full bg-secondary/10'>
              <FaUserGroup className='text-3xl text-secondary' />
            </div>
            <h3 className='text-2xl font-bold text-primary'>Strong Team</h3>
            <p className='text-gray-600 leading-relaxed'>
            At the core of WG Hotel&apos;s success is a dedicated and experienced management team that ensures operational excellence, guest satisfaction, and continued growth. Our team blends industry knowledge with innovation, working harmoniously across departments.
            </p>
          </div>

          {/* Center - Pool Image */}
          <div className='relative h-[400px] rounded-2xl overflow-hidden shadow-lg'>
            <img 
              src={rooftop} 
              alt="Luxury Pool" 
              className='absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105'
              loading="lazy"
            />
          </div>

          {/* Right Side - About Us */}
          <div className='text-left space-y-6 bg-white p-8 rounded-2xl shadow-sm'>
            <span className='text-secondary uppercase tracking-wider font-medium'>ABOUT US</span>
            <h2 className='text-4xl font-bold text-primary leading-tight'>Discover Our<br/>Underground</h2>
            <p className='text-gray-600 leading-relaxed'>
              Welcome to a hidden realm of extraordinary accommodations where luxury, comfort, and adventure converge. Our underground hotels offer an unparalleled escape from the ordinary, inviting you to explore a subterranean world of wonders.
            </p>
            <button onClick={() => navigate('/rooms')} className='bg-secondary text-white px-8 py-3 rounded-lg hover:bg-secondary/90 transition-colors'>
              Book Now
            </button>
          </div>

          {/* Bottom - Room View */}
          <div className='relative h-[300px] lg:col-span-2 rounded-2xl overflow-hidden shadow-lg'>
            <img 
              src={pool} 
              alt="Pool View" 
              className='absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105'
              loading="lazy"
            />
          </div>

          {/* Bottom Right - Luxury Room */}
          <div className='bg-primary p-8 rounded-2xl text-white space-y-4'>
            <div className='inline-flex justify-center items-center w-16 h-16 rounded-full bg-secondary/20'>
              <BiBed className='text-3xl text-secondary' />
            </div>
            <h4 className='text-2xl font-bold'>Good Place To Stay</h4>
            <p className='text-white/80 leading-relaxed'>
              Experience Unrivaled<br/>Luxury at Our Exquisite<br/>Luxury Rooms
            </p>
          </div>
        </div>

        {/* PHOTO GALLERY SECTION - NEW */}
        <div className="mt-20">
          <div className="text-center mb-12">
          <p className="text-lg text-secondary mb-2 tracking-widest">GALLERY</p>
            <h2 className="text-4xl font-bold text-primary mb-4">Our Hotel Gallery</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Explore the beauty and luxury of WG Hotel Jimbaran through our carefully curated photo gallery. 
              Each image captures the essence of our exceptional accommodations and facilities.
            </p>
          </div>
          
          {/* Responsive Grid Gallery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {galleryImages.map((image) => (
              <div 
                key={image.id} 
                className="relative overflow-hidden rounded-lg h-64 group cursor-pointer"
                onClick={() => openLightbox(image)}
              >
                <img 
                  src={image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="text-white text-center p-4">
                    <FaExpand className="mx-auto mb-2 text-2xl" />
                    <h3 className="font-medium">{image.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox for fullscreen gallery */}
      {lightboxOpen && activeImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <div className="relative max-w-screen-xl max-h-screen" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 text-white text-xl bg-black/50 w-10 h-10 rounded-full flex items-center justify-center z-10"
              onClick={closeLightbox}
            >
              ✕
            </button>
            <img 
              src={activeImage.url.replace('/upload/', '/upload/q_auto,f_auto,w_1600,h_900,c_limit/')} 
              alt={activeImage.title} 
              className="max-w-full max-h-[90vh] object-contain"
            />
            <div className="text-white text-center mt-4">
              <h3 className="text-xl font-medium">{activeImage.title}</h3>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default About;