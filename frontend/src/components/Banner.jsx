import banner1 from "../assets/wg-full2.jpg"
import banner2 from "../assets/loby.jpg"


const Banner = () => {
  return (
    <section className='max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8'>
        <div className='aspect-[4/3] w-full overflow-hidden rounded-xl shadow-lg'>
          <img 
            src={banner1} 
            alt="Rooftop view" 
            className='w-full h-full object-cover hover:scale-105 transition-transform duration-500'
          />
        </div>
        <div className='aspect-[4/3] w-full overflow-hidden rounded-xl shadow-lg'>
          <img 
            src={banner2} 
            alt="Lobby view" 
            className='w-full h-full object-cover hover:scale-105 transition-transform duration-500'
          />
        </div>
      </div>
    </section>
  )
}

export default Banner