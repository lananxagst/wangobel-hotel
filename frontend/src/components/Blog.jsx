import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { staticNews } from '../assets/staticNews';

const Blog = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const nextSlide = () => {
    setCurrentSlide(current => 
      current + 4 >= articles.length ? 0 : current + 4
    );
  };

  const prevSlide = () => {
    setCurrentSlide(current => 
      current - 4 < 0 ? Math.max(articles.length - 4, 0) : current - 4
    );
  };

  useEffect(() => {
    let slideInterval;
    if (!isPaused && articles.length > 0) {
      slideInterval = setInterval(() => {
        setCurrentSlide(current => 
          current + 4 >= articles.length ? 0 : current + 4
        );
      }, 3000);
    }
    return () => {
      if (slideInterval) {
        clearInterval(slideInterval);
      }
    };
  }, [isPaused, articles.length]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // First try to get news from GNews API
        const response = await axios.get(
          'https://gnews.io/api/v4/search', {
            params: {
              q: 'hotel OR hospitality OR tourism',
              lang: 'en',
              country: 'id',
              max: 8,
              apikey: import.meta.env.VITE_GNEWS_API_KEY
            },
            timeout: 5000 // 5 seconds timeout
          }
        );

        // Check if we got valid articles from the API
        if (response.data.articles && response.data.articles.length > 0) {
          console.log('Using GNews API data');
          // Map GNews articles to match our format
          const formattedArticles = response.data.articles.map(article => ({
            ...article,
            publishedAt: article.publishedAt || new Date().toISOString(),
            image: article.image || 'https://via.placeholder.com/400x200?text=News'
          }));
          setArticles(formattedArticles);
        } else {
          console.log('No articles from GNews API, using static data');
          setArticles(staticNews);
        }
      } catch (error) {
        // If there's any error (including rate limit), use static news
        console.log('GNews API error:', error.message);
        console.log('Falling back to static news data');
        setArticles(staticNews);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <p>Loading news...</p>
          </div>
        </div>
      </section>
    );
  }



  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-secondary mb-2 tracking-widest uppercase">LATEST NEWS</p>
          <h2 className="text-3xl md:text-4xl font-bold text-text-dark mb-4">Travel & Hotel News</h2>
          <p className="text-text-light text-base max-w-2xl mx-auto">
            Stay updated with the latest news and trends in travel and hospitality
          </p>
        </div>

        <div className="relative px-12">
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentSlide * (100 / 4)}%)`
              }}
            >
              {articles.map((article, index) => (
                <div
                  key={index}
                  className="w-full md:w-1/4 px-4 flex-shrink-0"
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                >
                  <div className="bg-white rounded-xl overflow-hidden shadow-lg h-full transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                      />
                    </div>
                    <div className="p-6">
                      <p className="text-sm text-secondary mb-2 font-medium">
                        {new Date(article.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 hover:text-secondary/90 transition-colors">
                        {article.title}
                      </h4>
                      <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                        {article.description}
                      </p>
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
                      >
                        Read More
                        <span className="ml-2 text-lg">&rarr;</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white focus:outline-none z-10 transition-all duration-300 hover:scale-110"
            aria-label="Previous slide"
          >
            <FaChevronLeft className="text-gray-800 text-xl" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white focus:outline-none z-10 transition-all duration-300 hover:scale-110"
            aria-label="Next slide"
          >
            <FaChevronRight className="text-gray-800 text-xl" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default Blog;
