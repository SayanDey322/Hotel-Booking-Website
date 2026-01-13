import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Navigation from '../components/Navigation';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LandingPage = () => {
  const [hotels, setHotels] = useState([]);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      const response = await axios.get(`${API}/hotels`);
      setHotels(response.data.slice(0, 6));
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  };

  const handleSearch = () => {
    if (searchCity) {
      window.location.href = `/hotels?city=${searchCity}`;
    } else {
      window.location.href = '/hotels';
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <section className="relative h-screen" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1765439178218-e54dcbb64bcb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHw0fHxsdXh1cnklMjBob3RlbCUyMGV4dGVyaW9yJTIwYXJjaGl0ZWN0dXJlfGVufDB8fHx8MTc2ODMwMjIxMXww&ixlib=rb-4.1.0&q=85"
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-overlay" />
        </div>

        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white px-6">
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-center mb-6 fade-in" data-testid="hero-title">
            Discover Your Perfect Escape
          </h1>
          <p className="text-xl md:text-2xl text-center mb-12 max-w-2xl font-light">
            Luxury hotels curated for unforgettable experiences
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-sm shadow-2xl p-6 max-w-4xl w-full" data-testid="search-bar">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center space-x-2 border-b border-stone-200 pb-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <Input
                    type="text"
                    placeholder="Where are you going?"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="border-0 focus:ring-0 text-foreground"
                    data-testid="search-city-input"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-primary text-white hover:bg-primary/90 rounded-none px-8 py-6 text-lg font-serif tracking-wide"
                  data-testid="search-button"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search Hotels
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="py-20 px-6 md:px-12 bg-secondary" data-testid="featured-hotels-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-4" data-testid="featured-title">
            Featured Properties
          </h2>
          <p className="text-center text-muted mb-16 text-lg">Handpicked stays for discerning travelers</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hotels.map((hotel) => (
              <Link key={hotel.id} to={`/hotels/${hotel.id}`} data-testid={`hotel-card-${hotel.id}`}>
                <div className="hotel-card group relative overflow-hidden rounded-md shadow-lg hover:shadow-xl transition-all duration-500 bg-white">
                  <div className="relative h-72 overflow-hidden">
                    <img
                      src={hotel.images[0]}
                      alt={hotel.name}
                      className="hotel-card-image w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-sm flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="font-semibold text-sm">{hotel.rating}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-serif font-semibold mb-2" data-testid={`hotel-name-${hotel.id}`}>{hotel.name}</h3>
                    <div className="flex items-center text-muted mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{hotel.city}</span>
                    </div>
                    <p className="text-sm text-muted line-clamp-2 mb-4">{hotel.description}</p>
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary/5 rounded-none py-6 font-serif tracking-wide"
                      data-testid={`view-hotel-button-${hotel.id}`}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/hotels">
              <Button className="bg-primary text-white hover:bg-primary/90 rounded-none px-12 py-6 text-lg font-serif tracking-wide" data-testid="view-all-hotels-button">
                View All Hotels
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 md:px-12" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-center mb-16">Why Choose LuxeStay</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-semibold mb-4">Curated Selection</h3>
              <p className="text-muted">Only the finest hotels make it to our collection</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-semibold mb-4">Easy Booking</h3>
              <p className="text-muted">Seamless reservation process from search to stay</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-serif font-semibold mb-4">24/7 Support</h3>
              <p className="text-muted">Our concierge team is always here to help</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">LuxeStay</h2>
          <p className="text-white/80 mb-6">Your gateway to exceptional hospitality</p>
          <p className="text-sm text-white/60">&copy; 2025 LuxeStay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;