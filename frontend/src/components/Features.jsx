
import { FaWifi, FaSwimmingPool, FaUtensils, FaSpa, FaDumbbell, FaParking } from "react-icons/fa";

const Features = () => {
  const facilities = [
    {
      icon: <FaWifi />,
      title: "Free WiFi",
      description: "High-speed internet access throughout the hotel"
    },
    {
      icon: <FaSwimmingPool />,
      title: "Swimming Pool",
      description: "Outdoor infinity pool with stunning city views"
    },
    {
      icon: <FaUtensils />,
      title: "Restaurant",
      description: "Fine dining with international cuisine"
    },
    {
      icon: <FaSpa />,
      title: "Spa & Wellness",
      description: "Luxurious spa treatments and wellness center"
    },
    {
      icon: <FaDumbbell />,
      title: "Cleaning Services",
      description: "Modern gym equipment and personal trainers"
    },
    {
      icon: <FaParking />,
      title: "Free Parking",
      description: "Secure underground parking for guests"
    }
  ];

  return (
    <section className="py-12 bg-extra-light">
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <div className="text-center mb-16">
          <p className="text-lg text-secondary mb-2 tracking-widest">FACILITIES</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Hotel Facilities</h2>
          <p className="text-text-light max-w-2xl mx-auto">
            Discover our world-class amenities designed for your comfort and convenience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {facilities.map((facility, index) => (
            <div 
              key={index}
              className="p-8 bg-white hover:bg-secondary/5 transition-colors text-center group cursor-default"
            >
              <div className="text-4xl text-secondary mb-6 flex justify-center group-hover:scale-110 transition-transform">
                {facility.icon}
              </div>
              <h3 className="text-xl font-bold text-text-dark mb-3">{facility.title}</h3>
              <p className="text-text-light">{facility.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
