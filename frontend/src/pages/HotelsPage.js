import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Star, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Navigation from '../components/Navigation';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HotelsPage = () => {
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState(searchParams.get('city') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchHotels();
  }, [searchParams]);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const city = searchParams.get('city');
      if (city) {
        const response = await axios.post(`${API}/hotels/search`, { city });
        setHotels(response.data);
      } else {
        const response = await axios.get(`${API}/hotels`);
        setHotels(response.data);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/hotels/search`, {
        city: searchCity || undefined,
        min_price: minPrice ? parseFloat(minPrice) : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined
      });
      setHotels(response.data);
    } catch (error) {
      console.error('Error searching hotels:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Navigation />

      <div className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-8" data-testid="hotels-page-title">
            Explore Hotels
          </h1>

          {/* Search and Filters */}
          <div className="bg-white rounded-md shadow-md p-6 mb-12" data-testid="search-filters">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <Label>City or Location</Label>
                <Input
                  type="text"
                  placeholder="Search by city"
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  className="mt-2 h-12"
                  data-testid="city-search-input"
                />
              </div>
              <div>
                <Label>Min Price</Label>
                <Input
                  type="number"
                  placeholder="$0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="mt-2 h-12"
                  data-testid="min-price-input"
                />
              </div>
              <div>
                <Label>Max Price</Label>
                <Input
                  type="number"
                  placeholder="$1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="mt-2 h-12"
                  data-testid="max-price-input"
                />
              </div>
            </div>
            <Button
              onClick={handleSearch}
              className="bg-primary text-white hover:bg-primary/90 rounded-none px-8 py-6 font-serif tracking-wide"
              data-testid="apply-filters-button"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {/* Hotels Grid */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted">Loading hotels...</p>
            </div>
          ) : hotels.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted">No hotels found. Try adjusting your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="hotels-grid">
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
                      <h3 className="text-2xl font-serif font-semibold mb-2">{hotel.name}</h3>
                      <div className="flex items-center text-muted mb-4">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{hotel.city}</span>
                      </div>
                      <p className="text-sm text-muted line-clamp-2 mb-4">{hotel.description}</p>
                      <Button
                        variant="outline"
                        className="w-full border-primary text-primary hover:bg-primary/5 rounded-none py-6 font-serif tracking-wide"
                        data-testid={`view-details-button-${hotel.id}`}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelsPage;