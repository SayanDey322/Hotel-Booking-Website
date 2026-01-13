#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime, timedelta

class HotelBookingAPITester:
    def __init__(self, base_url="https://stayspot-45.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if not success:
                details += f", Expected: {expected_status}"
                try:
                    error_data = response.json()
                    details += f", Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    details += f", Response: {response.text[:100]}"

            self.log_test(name, success, details)
            
            if success:
                try:
                    return response.json()
                except:
                    return {}
            return None

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return None

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test user registration
        user_data = {
            "name": "Test User",
            "email": f"testuser_{datetime.now().strftime('%H%M%S')}@example.com",
            "password": "testpass123",
            "phone": "1234567890"
        }
        
        response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if response and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
        
        # Test user login
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        # Test admin login
        admin_login_data = {
            "email": "admin@luxestay.com",
            "password": "admin123"
        }
        
        response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data=admin_login_data
        )
        
        if response and 'token' in response:
            self.admin_token = response['token']
        
        # Test get current user
        if self.token:
            headers = {'Authorization': f'Bearer {self.token}'}
            self.run_test(
                "Get Current User",
                "GET",
                "auth/me",
                200,
                headers=headers
            )

    def test_hotel_endpoints(self):
        """Test hotel endpoints"""
        print("\n🏨 Testing Hotel Endpoints...")
        
        # Test get all hotels
        response = self.run_test(
            "Get All Hotels",
            "GET",
            "hotels",
            200
        )
        
        hotels = response if response else []
        
        if hotels:
            # Test get specific hotel
            hotel_id = hotels[0]['id']
            self.run_test(
                "Get Specific Hotel",
                "GET",
                f"hotels/{hotel_id}",
                200
            )
            
            # Store hotel_id for later tests
            self.test_hotel_id = hotel_id
        
        # Test hotel search
        search_data = {"city": "New York"}
        self.run_test(
            "Search Hotels by City",
            "POST",
            "hotels/search",
            200,
            data=search_data
        )
        
        # Test hotel search with price filter
        search_data = {"min_price": 100, "max_price": 500}
        self.run_test(
            "Search Hotels by Price",
            "POST",
            "hotels/search",
            200,
            data=search_data
        )
        
        # Test admin hotel creation (if admin token available)
        if self.admin_token:
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            hotel_data = {
                "name": "Test Hotel",
                "description": "A test hotel for API testing",
                "location": "123 Test Street",
                "city": "Test City",
                "amenities": ["Wi-Fi", "Pool"],
                "images": ["https://example.com/image1.jpg"],
                "rating": 4.5
            }
            
            response = self.run_test(
                "Create Hotel (Admin)",
                "POST",
                "hotels",
                200,
                data=hotel_data,
                headers=headers
            )
            
            if response:
                self.created_hotel_id = response['id']

    def test_room_endpoints(self):
        """Test room endpoints"""
        print("\n🚪 Testing Room Endpoints...")
        
        # Test get all rooms
        response = self.run_test(
            "Get All Rooms",
            "GET",
            "rooms",
            200
        )
        
        rooms = response if response else []
        
        if hasattr(self, 'test_hotel_id'):
            # Test get rooms for specific hotel
            self.run_test(
                "Get Rooms for Hotel",
                "GET",
                f"rooms?hotel_id={self.test_hotel_id}",
                200
            )
        
        if rooms:
            # Test get specific room
            room_id = rooms[0]['id']
            self.run_test(
                "Get Specific Room",
                "GET",
                f"rooms/{room_id}",
                200
            )
            
            # Store room_id for booking tests
            self.test_room_id = room_id
        
        # Test admin room creation (if admin token and hotel available)
        if self.admin_token and hasattr(self, 'test_hotel_id'):
            headers = {'Authorization': f'Bearer {self.admin_token}'}
            room_data = {
                "hotel_id": self.test_hotel_id,
                "room_type": "Test Suite",
                "description": "A test room for API testing",
                "price": 200.0,
                "capacity": 2,
                "amenities": ["King Bed", "WiFi"],
                "images": ["https://example.com/room1.jpg"]
            }
            
            response = self.run_test(
                "Create Room (Admin)",
                "POST",
                "rooms",
                200,
                data=room_data,
                headers=headers
            )

    def test_booking_endpoints(self):
        """Test booking endpoints"""
        print("\n📅 Testing Booking Endpoints...")
        
        if not self.token:
            print("⚠️ Skipping booking tests - no user token available")
            return
        
        if not hasattr(self, 'test_room_id') or not hasattr(self, 'test_hotel_id'):
            print("⚠️ Skipping booking tests - no room/hotel available")
            return
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Test create booking
        tomorrow = datetime.now() + timedelta(days=1)
        day_after = datetime.now() + timedelta(days=2)
        
        booking_data = {
            "room_id": self.test_room_id,
            "hotel_id": self.test_hotel_id,
            "check_in": tomorrow.isoformat(),
            "check_out": day_after.isoformat(),
            "guests": 2,
            "origin_url": self.base_url
        }
        
        response = self.run_test(
            "Create Booking",
            "POST",
            "bookings",
            200,
            data=booking_data,
            headers=headers
        )
        
        if response and 'booking' in response:
            booking_id = response['booking']['id']
            self.test_booking_id = booking_id
            
            # Test get specific booking
            self.run_test(
                "Get Specific Booking",
                "GET",
                f"bookings/{booking_id}",
                200,
                headers=headers
            )
        
        # Test get user bookings
        if hasattr(self, 'user_id'):
            self.run_test(
                "Get User Bookings",
                "GET",
                f"bookings/user/{self.user_id}",
                200,
                headers=headers
            )
        
        # Test admin get all bookings
        if self.admin_token:
            admin_headers = {'Authorization': f'Bearer {self.admin_token}'}
            self.run_test(
                "Get All Bookings (Admin)",
                "GET",
                "bookings",
                200,
                headers=admin_headers
            )

    def test_payment_endpoints(self):
        """Test payment endpoints"""
        print("\n💳 Testing Payment Endpoints...")
        
        if not self.token:
            print("⚠️ Skipping payment tests - no user token available")
            return
        
        # Note: We can't fully test Stripe integration without actual payment
        # But we can test the endpoint structure
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Test payment status with dummy session (should return 404)
        self.run_test(
            "Get Payment Status (Invalid Session)",
            "GET",
            "payment/status/dummy_session_id",
            404,
            headers=headers
        )

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Hotel Booking API Tests...")
        print(f"Testing against: {self.base_url}")
        
        self.test_auth_endpoints()
        self.test_hotel_endpoints()
        self.test_room_endpoints()
        self.test_booking_endpoints()
        self.test_payment_endpoints()
        
        # Print summary
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Return results for further processing
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": self.tests_passed/self.tests_run*100 if self.tests_run > 0 else 0,
            "results": self.test_results
        }

def main():
    tester = HotelBookingAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if results["success_rate"] < 80:
        print(f"\n❌ Test suite failed - success rate below 80%")
        return 1
    else:
        print(f"\n✅ Test suite passed!")
        return 0

if __name__ == "__main__":
    sys.exit(main())