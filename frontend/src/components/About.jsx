import { FaUserGroup } from 'react-icons/fa6'
import { BiBed } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'

const About = () => {
  const navigate = useNavigate()
  return (
    <section className='max-padd-container py-16 bg-gradient-to-br from-white to-gray-50'>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
        {/* Left Side - Strong Team */}
        <div className='text-center space-y-6 bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow'>
          <div className='inline-flex justify-center items-center w-16 h-16 rounded-full bg-secondary/10'>
            <FaUserGroup className='text-3xl text-secondary' />
          </div>
          <h3 className='text-2xl font-bold text-primary'>Strong Team</h3>
          <p className='text-gray-600 leading-relaxed'>
          At the core of WG Hotel’s success is a dedicated and experienced management team that ensures operational excellence, guest satisfaction, and continued growth. Our team blends industry knowledge with innovation, working harmoniously across departments.
          </p>
        </div>

        {/* Center - Pool Image */}
        <div className='relative h-[400px] rounded-2xl overflow-hidden shadow-lg'>
          <img 
            src="/src/assets/rooftop.jpg" 
            alt="Luxury Pool" 
            className='absolute inset-0 w-full h-full object-cover'
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
            src="/src/assets/wg-kolamrenang.jpeg" 
            alt="Luxury Room View" 
            className='absolute inset-0 w-full h-full object-cover'
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
    </section>
  )
}

export default About