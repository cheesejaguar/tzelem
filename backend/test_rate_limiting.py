#!/usr/bin/env python3
"""
Test script to verify rate limiting functionality.
"""

import time
from datetime import datetime

import requests


def test_rate_limit(endpoint: str, limit: int, window: int):
    """
    Test rate limiting for a specific endpoint.

    Args:
        endpoint: The API endpoint to test
        limit: Expected rate limit (requests per window)
        window: Time window in seconds
    """
    base_url = "http://localhost:8000"
    url = f"{base_url}{endpoint}"

    print(f"\n🧪 Testing rate limit for {endpoint}")
    print(f"   Expected limit: {limit} requests per {window} seconds")

    # Track successful and failed requests
    successful = 0
    rate_limited = 0
    errors = 0

    # Make requests up to the limit + 5 extra
    total_requests = limit + 5

    print(f"   Making {total_requests} requests...")
    start_time = time.time()

    for i in range(total_requests):
        try:
            response = requests.get(url, timeout=5)

            if response.status_code == 200:
                successful += 1
                print(f"   ✅ Request {i + 1}: Success")

                # Check for rate limit headers
                if "X-RateLimit-Limit" in response.headers:
                    print(f"      Rate Limit: {response.headers['X-RateLimit-Limit']}")
                if "X-RateLimit-Remaining" in response.headers:
                    print(f"      Remaining: {response.headers['X-RateLimit-Remaining']}")

            elif response.status_code == 429:
                rate_limited += 1
                print(f"   🚫 Request {i + 1}: Rate limited!")

                # Check retry-after header
                if "Retry-After" in response.headers:
                    print(f"      Retry after: {response.headers['Retry-After']} seconds")

            else:
                errors += 1
                print(f"   ❌ Request {i + 1}: Error {response.status_code}")

        except requests.exceptions.ConnectionError:
            print(f"   ❌ Request {i + 1}: Connection error (server not running?)")
            return None
        except Exception as e:
            errors += 1
            print(f"   ❌ Request {i + 1}: Error {e}")

        # Small delay between requests
        time.sleep(0.1)

    elapsed = time.time() - start_time

    # Print summary
    print("\n   📊 Summary:")
    print(f"      Total requests: {total_requests}")
    print(f"      Successful: {successful}")
    print(f"      Rate limited: {rate_limited}")
    print(f"      Errors: {errors}")
    print(f"      Time elapsed: {elapsed:.2f} seconds")

    # Verify rate limiting worked
    if successful <= limit and rate_limited > 0:
        print("   ✅ Rate limiting is working correctly!")
    elif successful > limit:
        print("   ⚠️  More requests succeeded than expected limit")
    else:
        print("   ⚠️  No rate limiting observed")

    return successful, rate_limited, errors


def test_endpoint_specific_limits():
    """Test different rate limits for different endpoints."""

    print("=" * 60)
    print("TZELEM RATE LIMITING TEST")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")

    # Test health endpoint (high limit)
    test_rate_limit("/health", limit=200, window=60)

    # Wait a bit between tests
    print("\n⏳ Waiting 2 seconds before next test...")
    time.sleep(2)

    # Test voice endpoint (low limit)
    print("\n🎤 Testing voice endpoint rate limit...")
    print("   Note: This endpoint may return 503 if dependencies are missing")

    # Create a simple POST request for voice room
    base_url = "http://localhost:8000"
    url = f"{base_url}/api/voice/rooms"

    successful = 0
    rate_limited = 0

    for i in range(15):  # Voice limit is 10 per minute
        try:
            response = requests.post(url, json={}, timeout=5)

            if response.status_code == 429:
                rate_limited += 1
                print(f"   🚫 Request {i + 1}: Rate limited!")
            elif response.status_code in [200, 201]:
                successful += 1
                print(f"   ✅ Request {i + 1}: Success")
            else:
                # May get 503 or 500 if Daily API key is not configured
                print(
                    f"   ⚠️  Request {i + 1}: Status {response.status_code} (expected if Daily API not configured)"
                )

        except Exception as e:
            print(f"   ❌ Request {i + 1}: Error {e}")

        time.sleep(0.1)

    print("\n   Voice endpoint summary:")
    print(f"      Successful: {successful}")
    print(f"      Rate limited: {rate_limited}")

    if rate_limited > 0:
        print("   ✅ Voice endpoint rate limiting is working!")


def main():
    """Run all rate limiting tests."""

    # Check if server is running
    try:
        response = requests.get("http://localhost:8000/health", timeout=2)
        if response.status_code != 200:
            print("⚠️  Server is not responding correctly")
            print("   Make sure the backend is running: cd backend && uvicorn main:app")
            return
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to server at http://localhost:8000")
        print("   Please start the backend server first:")
        print("   cd backend && uvicorn main:app")
        return
    except Exception as e:
        print(f"❌ Error checking server: {e}")
        return

    # Run tests
    test_endpoint_specific_limits()

    print("\n" + "=" * 60)
    print("Test completed!")
    print("=" * 60)

    print("\n💡 Tips:")
    print("   - Rate limits can be configured via environment variables")
    print("   - Set RATE_LIMIT_ENABLED=false to disable rate limiting")
    print("   - Set RATE_LIMIT_REQUESTS=50 to change default limit")
    print("   - Check backend/core/config.py for all configuration options")


if __name__ == "__main__":
    main()
