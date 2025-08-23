#!/usr/bin/env python3
"""
Performance testing script for the Tzelem mail API.
Measures latency, throughput, and concurrent request handling.
"""

import argparse
import asyncio
import json
import statistics
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from typing import Any

import aiohttp
import requests


class PerformanceTester:
    """Performance testing for mail API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.mail_endpoint = f"{base_url}/api/mail"
        self.results = []
        
    def create_test_email(self, test_id: int) -> dict[str, Any]:
        """Create a test email payload"""
        return {
            "to": f"perf-test-{test_id}@tzlm.io",
            "subject": f"Performance Test #{test_id} - {datetime.now().isoformat()}",
            "html": f"<p>Performance test email #{test_id}</p>",
            "text": f"Performance test email #{test_id}",
            "from_name": "Performance Tester"
        }
    
    async def send_async_request(self, session: aiohttp.ClientSession, test_id: int) -> tuple[int, float, int]:
        """
        Send an async request and measure response time
        
        Returns:
            Tuple of (test_id, response_time, status_code)
        """
        email_data = self.create_test_email(test_id)
        start_time = time.perf_counter()
        
        try:
            async with session.post(
                self.mail_endpoint,
                json=email_data,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                await response.text()
                end_time = time.perf_counter()
                return (test_id, end_time - start_time, response.status)
        except TimeoutError:
            end_time = time.perf_counter()
            return (test_id, end_time - start_time, -1)  # -1 indicates timeout
        except Exception:
            end_time = time.perf_counter()
            return (test_id, end_time - start_time, -2)  # -2 indicates error
    
    async def run_concurrent_test(self, num_requests: int, max_concurrent: int = 10) -> dict[str, Any]:
        """
        Run concurrent requests test
        
        Args:
            num_requests: Total number of requests to send
            max_concurrent: Maximum concurrent requests
            
        Returns:
            Dictionary with test results
        """
        print("\n🔄 Running Concurrent Test")
        print(f"   Total requests: {num_requests}")
        print(f"   Max concurrent: {max_concurrent}")
        
        connector = aiohttp.TCPConnector(limit=max_concurrent)
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = []
            for i in range(num_requests):
                task = self.send_async_request(session, i)
                tasks.append(task)
            
            start_time = time.perf_counter()
            
            # Show progress
            results = []
            for i, task in enumerate(asyncio.as_completed(tasks), 1):
                result = await task
                results.append(result)
                
                # Progress indicator
                if i % 10 == 0 or i == num_requests:
                    progress = i / num_requests * 100
                    print(f"\r   Progress: {progress:.1f}% ({i}/{num_requests})", end="", flush=True)
            
            total_time = time.perf_counter() - start_time
            print()  # New line after progress
        
        # Analyze results
        response_times = [r[1] for r in results]
        status_codes = [r[2] for r in results]
        
        successful = sum(1 for s in status_codes if s == 200)
        failed = sum(1 for s in status_codes if s != 200)
        timeouts = sum(1 for s in status_codes if s == -1)
        errors = sum(1 for s in status_codes if s == -2)
        
        return {
            "total_requests": num_requests,
            "max_concurrent": max_concurrent,
            "total_time": total_time,
            "successful": successful,
            "failed": failed,
            "timeouts": timeouts,
            "errors": errors,
            "throughput": num_requests / total_time,
            "response_times": {
                "min": min(response_times),
                "max": max(response_times),
                "mean": statistics.mean(response_times),
                "median": statistics.median(response_times),
                "p95": statistics.quantiles(response_times, n=20)[18],  # 95th percentile
                "p99": statistics.quantiles(response_times, n=100)[98],  # 99th percentile
            }
        }
    
    def run_latency_test(self, num_samples: int = 20) -> dict[str, Any]:
        """
        Test individual request latency
        
        Args:
            num_samples: Number of samples to collect
            
        Returns:
            Dictionary with latency statistics
        """
        print("\n⏱️  Running Latency Test")
        print(f"   Samples: {num_samples}")
        
        latencies = []
        
        for i in range(num_samples):
            email_data = self.create_test_email(i)
            
            start_time = time.perf_counter()
            try:
                requests.post(
                    self.mail_endpoint,
                    json=email_data,
                    timeout=10
                )
                end_time = time.perf_counter()
                
                latency = (end_time - start_time) * 1000  # Convert to milliseconds
                latencies.append(latency)
                
                # Show progress
                print(f"\r   Sample {i+1}/{num_samples}: {latency:.2f}ms", end="", flush=True)
                
            except Exception as e:
                print(f"\r   Sample {i+1}/{num_samples}: Error - {str(e)[:30]}", end="", flush=True)
        
        print()  # New line after progress
        
        if not latencies:
            return {"error": "No successful samples collected"}
        
        return {
            "samples": len(latencies),
            "latency_ms": {
                "min": min(latencies),
                "max": max(latencies),
                "mean": statistics.mean(latencies),
                "median": statistics.median(latencies),
                "stdev": statistics.stdev(latencies) if len(latencies) > 1 else 0,
            }
        }
    
    def run_burst_test(self, burst_size: int = 50, num_bursts: int = 3, delay_between: float = 5.0) -> dict[str, Any]:
        """
        Test API behavior under burst load
        
        Args:
            burst_size: Number of requests per burst
            num_bursts: Number of bursts to send
            delay_between: Delay between bursts in seconds
            
        Returns:
            Dictionary with burst test results
        """
        print("\n💥 Running Burst Test")
        print(f"   Burst size: {burst_size}")
        print(f"   Number of bursts: {num_bursts}")
        print(f"   Delay between: {delay_between}s")
        
        burst_results = []
        
        for burst_num in range(num_bursts):
            print(f"\n   Burst {burst_num + 1}/{num_bursts}:")
            
            # Send burst using thread pool
            with ThreadPoolExecutor(max_workers=burst_size) as executor:
                futures = []
                burst_start = time.perf_counter()
                
                for i in range(burst_size):
                    email_data = self.create_test_email(burst_num * burst_size + i)
                    future = executor.submit(
                        requests.post,
                        self.mail_endpoint,
                        json=email_data,
                        timeout=10
                    )
                    futures.append(future)
                
                # Wait for all requests to complete
                successful = 0
                failed = 0
                
                for future in as_completed(futures):
                    try:
                        response = future.result()
                        if response.status_code == 200:
                            successful += 1
                        else:
                            failed += 1
                    except Exception:
                        failed += 1
                
                burst_duration = time.perf_counter() - burst_start
                
                burst_result = {
                    "burst_num": burst_num + 1,
                    "size": burst_size,
                    "duration": burst_duration,
                    "successful": successful,
                    "failed": failed,
                    "rate": burst_size / burst_duration
                }
                burst_results.append(burst_result)
                
                print(f"      Duration: {burst_duration:.2f}s")
                print(f"      Success: {successful}/{burst_size}")
                print(f"      Rate: {burst_result['rate']:.2f} req/s")
                
                # Delay before next burst
                if burst_num < num_bursts - 1:
                    print(f"      Waiting {delay_between}s...")
                    time.sleep(delay_between)
        
        # Calculate aggregate statistics
        total_successful = sum(b["successful"] for b in burst_results)
        total_failed = sum(b["failed"] for b in burst_results)
        avg_rate = statistics.mean(b["rate"] for b in burst_results)
        
        return {
            "bursts": burst_results,
            "total_requests": burst_size * num_bursts,
            "total_successful": total_successful,
            "total_failed": total_failed,
            "average_rate": avg_rate
        }
    
    async def run_ramp_up_test(self,
                              start_rate: int = 1,
                              end_rate: int = 20,
                              step: int = 2,
                              duration_per_step: float = 5.0) -> dict[str, Any]:
        """
        Test API behavior with gradually increasing load
        
        Args:
            start_rate: Starting requests per second
            end_rate: Ending requests per second
            step: Increase in rate per step
            duration_per_step: Duration of each step in seconds
            
        Returns:
            Dictionary with ramp-up test results
        """
        print("\n📈 Running Ramp-Up Test")
        print(f"   Rate: {start_rate} -> {end_rate} req/s")
        print(f"   Step: {step} req/s")
        print(f"   Duration per step: {duration_per_step}s")
        
        results = []
        
        for rate in range(start_rate, end_rate + 1, step):
            print(f"\n   Testing at {rate} req/s:")
            
            num_requests = int(rate * duration_per_step)
            delay_between = 1.0 / rate if rate > 0 else 1.0
            
            step_start = time.perf_counter()
            
            # Send requests at the specified rate
            async with aiohttp.ClientSession() as session:
                tasks = []
                for i in range(num_requests):
                    task = self.send_async_request(session, i)
                    tasks.append(task)
                    await asyncio.sleep(delay_between)
                
                # Collect results
                responses = await asyncio.gather(*tasks)
            
            step_duration = time.perf_counter() - step_start
            
            # Analyze results
            response_times = [r[1] for r in responses]
            status_codes = [r[2] for r in responses]
            successful = sum(1 for s in status_codes if s == 200)
            
            step_result = {
                "rate": rate,
                "requests_sent": num_requests,
                "duration": step_duration,
                "successful": successful,
                "failed": num_requests - successful,
                "avg_response_time": statistics.mean(response_times),
                "actual_rate": num_requests / step_duration
            }
            results.append(step_result)
            
            print(f"      Actual rate: {step_result['actual_rate']:.2f} req/s")
            print(f"      Success rate: {successful}/{num_requests}")
            print(f"      Avg response: {step_result['avg_response_time']:.3f}s")
        
        return {
            "steps": results,
            "start_rate": start_rate,
            "end_rate": end_rate,
            "total_requests": sum(s["requests_sent"] for s in results),
            "total_successful": sum(s["successful"] for s in results)
        }
    
    def print_performance_summary(self, test_results: dict[str, Any]):
        """Print a summary of performance test results"""
        print(f"\n{'=' * 60}")
        print("📊 PERFORMANCE TEST SUMMARY")
        print(f"{'=' * 60}")
        
        if "latency" in test_results:
            latency = test_results["latency"]["latency_ms"]
            print("\n⏱️  Latency (ms):")
            print(f"   Min: {latency['min']:.2f}")
            print(f"   Max: {latency['max']:.2f}")
            print(f"   Mean: {latency['mean']:.2f}")
            print(f"   Median: {latency['median']:.2f}")
        
        if "concurrent" in test_results:
            concurrent = test_results["concurrent"]
            print("\n🔄 Concurrent Requests:")
            print(f"   Total: {concurrent['total_requests']}")
            print(f"   Successful: {concurrent['successful']}")
            print(f"   Failed: {concurrent['failed']}")
            print(f"   Throughput: {concurrent['throughput']:.2f} req/s")
            print(f"   P95 Response Time: {concurrent['response_times']['p95']:.3f}s")
            print(f"   P99 Response Time: {concurrent['response_times']['p99']:.3f}s")
        
        if "burst" in test_results:
            burst = test_results["burst"]
            print("\n💥 Burst Test:")
            print(f"   Total Requests: {burst['total_requests']}")
            print(f"   Successful: {burst['total_successful']}")
            print(f"   Failed: {burst['total_failed']}")
            print(f"   Average Rate: {burst['average_rate']:.2f} req/s")
        
        if "ramp_up" in test_results:
            ramp = test_results["ramp_up"]
            print("\n📈 Ramp-Up Test:")
            print(f"   Rate Range: {ramp['start_rate']} -> {ramp['end_rate']} req/s")
            print(f"   Total Requests: {ramp['total_requests']}")
            print(f"   Total Successful: {ramp['total_successful']}")


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Performance testing for Tzelem mail API")
    parser.add_argument("--base-url", "-u", default="http://localhost:8000",
                       help="Backend base URL")
    parser.add_argument("--test", "-t", choices=["all", "latency", "concurrent", "burst", "ramp"],
                       default="all", help="Test type to run")
    parser.add_argument("--requests", "-r", type=int, default=100,
                       help="Number of requests for concurrent test")
    parser.add_argument("--concurrent", "-c", type=int, default=10,
                       help="Max concurrent requests")
    parser.add_argument("--output", "-o", help="Output results to JSON file")
    
    args = parser.parse_args()
    
    # Check backend
    try:
        response = requests.get(f"{args.base_url}/health", timeout=2)
        if response.status_code != 200:
            print("❌ Backend server is not responding correctly")
            return
    except Exception:
        print("❌ Cannot connect to backend server")
        print(f"   Make sure it's running at {args.base_url}")
        return
    
    tester = PerformanceTester(args.base_url)
    results = {}
    
    print(f"{'=' * 60}")
    print("🚀 TZELEM MAIL API PERFORMANCE TEST")
    print(f"{'=' * 60}")
    print(f"Backend: {args.base_url}")
    print(f"Test Type: {args.test}")
    
    # Run selected tests
    if args.test in ["all", "latency"]:
        results["latency"] = tester.run_latency_test()
    
    if args.test in ["all", "concurrent"]:
        results["concurrent"] = await tester.run_concurrent_test(
            num_requests=args.requests,
            max_concurrent=args.concurrent
        )
    
    if args.test in ["all", "burst"]:
        results["burst"] = tester.run_burst_test()
    
    if args.test in ["all", "ramp"]:
        results["ramp_up"] = await tester.run_ramp_up_test()
    
    # Print summary
    tester.print_performance_summary(results)
    
    # Save results if requested
    if args.output:
        with open(args.output, "w") as f:  # noqa: PTH123
            json.dump(results, f, indent=2, default=str)
        print(f"\n📁 Results saved to: {args.output}")


if __name__ == "__main__":
    asyncio.run(main())

