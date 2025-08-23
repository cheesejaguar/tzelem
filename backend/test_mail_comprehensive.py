#!/usr/bin/env python3
"""
Comprehensive test script for the Tzelem mail API.
Tests various scenarios including success, failure, and edge cases.
"""

import os
import sys
from datetime import datetime
from typing import Any

import requests


class Colors:
    """Terminal color codes for output formatting"""
    HEADER = "\033[95m"
    OKBLUE = "\033[94m"
    OKCYAN = "\033[96m"
    OKGREEN = "\033[92m"
    WARNING = "\033[93m"
    FAIL = "\033[91m"
    ENDC = "\033[0m"
    BOLD = "\033[1m"
    UNDERLINE = "\033[4m"


class MailAPITester:
    """Test harness for the Tzelem mail API"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.mail_endpoint = f"{base_url}/api/mail"
        self.health_endpoint = f"{base_url}/api/mail/health"
        self.test_results = []
        self.test_count = 0
        self.passed_count = 0
        self.failed_count = 0
        
    def print_header(self, text: str):
        """Print a formatted header"""
        print(f"\n{Colors.HEADER}{'=' * 70}{Colors.ENDC}")
        print(f"{Colors.HEADER}{Colors.BOLD}{text.center(70)}{Colors.ENDC}")
        print(f"{Colors.HEADER}{'=' * 70}{Colors.ENDC}")
    
    def print_section(self, text: str):
        """Print a section header"""
        print(f"\n{Colors.OKCYAN}{'-' * 50}{Colors.ENDC}")
        print(f"{Colors.OKCYAN}{Colors.BOLD}{text}{Colors.ENDC}")
        print(f"{Colors.OKCYAN}{'-' * 50}{Colors.ENDC}")
    
    def print_success(self, text: str):
        """Print success message"""
        print(f"{Colors.OKGREEN}✅ {text}{Colors.ENDC}")
        
    def print_failure(self, text: str):
        """Print failure message"""
        print(f"{Colors.FAIL}❌ {text}{Colors.ENDC}")
        
    def print_warning(self, text: str):
        """Print warning message"""
        print(f"{Colors.WARNING}⚠️  {text}{Colors.ENDC}")
        
    def print_info(self, text: str):
        """Print info message"""
        print(f"{Colors.OKBLUE}ℹ️  {text}{Colors.ENDC}")
    
    def check_backend_running(self) -> bool:
        """Check if the backend server is running"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=2)
            return response.status_code == 200
        except Exception:
            return False
    
    def check_mail_health(self) -> dict[str, Any] | None:
        """Check the health of the mail service"""
        try:
            self.print_section("Mail Service Health Check")
            response = requests.get(self.health_endpoint, timeout=5)
            
            if response.status_code == 200:
                health = response.json()
                
                # Display health status
                status_color = Colors.OKGREEN if health.get("status") == "healthy" else Colors.WARNING
                print(f"   Status: {status_color}{health.get('status')}{Colors.ENDC}")
                print(f"   AgentMail Installed: {health.get('agentmail_installed')}")
                print(f"   API Key Configured: {health.get('api_key_configured')}")
                print(f"   Mock Mode: {health.get('mock_mode')}")
                print(f"   Message: {health.get('message')}")
                
                if not health.get("api_key_configured"):
                    self.print_warning("AGENTMAIL_API_KEY not configured - tests will run in mock mode")
                
                return health
            self.print_failure(f"Health check failed - Status: {response.status_code}")
            return None
                
        except Exception as e:
            self.print_failure(f"Could not check health: {e}")
            return None
    
    def test_send_email(self,
                       test_name: str,
                       email_data: dict[str, Any],
                       expected_status: int = 200,
                       expected_response_field: str | None = None) -> bool:
        """
        Run a single email test
        
        Args:
            test_name: Name of the test
            email_data: Email data to send
            expected_status: Expected HTTP status code
            expected_response_field: Field to check in response
            
        Returns:
            bool: True if test passed, False otherwise
        """
        self.test_count += 1
        print(f"\n{Colors.BOLD}Test {self.test_count}: {test_name}{Colors.ENDC}")
        
        try:
            # Send request
            response = requests.post(
                self.mail_endpoint,
                json=email_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            # Check status code
            if response.status_code == expected_status:
                self.print_success(f"Got expected status code: {expected_status}")
                
                # Check response content if needed
                if expected_response_field and response.status_code == 200:
                    result = response.json()
                    if expected_response_field in result:
                        self.print_success(f"Response contains '{expected_response_field}': {result[expected_response_field]}")
                    else:
                        self.print_failure(f"Response missing field '{expected_response_field}'")
                        self.failed_count += 1
                        return False
                
                # Display response for successful sends
                if response.status_code == 200:
                    result = response.json()
                    print(f"   Status: {result.get('status')}")
                    print(f"   Message: {result.get('message')}")
                    if result.get("messageId"):
                        print(f"   Message ID: {result.get('messageId')}")
                
                self.passed_count += 1
                return True
            self.print_failure(f"Expected status {expected_status}, got {response.status_code}")
            print(f"   Response: {response.text}")
            self.failed_count += 1
            return False
                
        except requests.exceptions.Timeout:
            self.print_failure("Request timed out")
            self.failed_count += 1
            return False
        except Exception as e:
            self.print_failure(f"Test failed with error: {e}")
            self.failed_count += 1
            return False
    
    def run_all_tests(self):
        """Run all mail API tests"""
        self.print_header("TZELEM MAIL API COMPREHENSIVE TEST SUITE")
        
        # Check if backend is running
        if not self.check_backend_running():
            self.print_failure("Backend server is not running!")
            print("\nPlease start the backend server:")
            print("  cd backend && python main.py")
            return
        
        # Check mail service health
        health = self.check_mail_health()
        if not health:
            self.print_warning("Mail service health check failed, but continuing with tests...")
        
        # Test suite
        self.print_section("Running Test Suite")
        
        # Test 1: Basic email with all fields
        self.test_send_email(
            "Send basic email with all fields",
            {
                "to": "test@tzlm.io",
                "subject": f"Test Suite Run - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                "from_name": "Tzelem Test Suite",
                "html": "<h1>Test Email</h1><p>This is a test email with HTML content.</p>",
                "text": "Test Email\n\nThis is a test email with text content."
            },
            expected_status=200,
            expected_response_field="status"
        )
        
        # Test 2: Email with only HTML content
        self.test_send_email(
            "Send email with HTML only",
            {
                "to": "html-only@tzlm.io",
                "subject": "HTML Only Test",
                "html": "<h2>HTML Only</h2><p>This email has only HTML content.</p>"
            },
            expected_status=200
        )
        
        # Test 3: Email with only text content
        self.test_send_email(
            "Send email with text only",
            {
                "to": "text-only@tzlm.io",
                "subject": "Text Only Test",
                "text": "This email has only plain text content."
            },
            expected_status=200
        )
        
        # Test 4: Email without from_name
        self.test_send_email(
            "Send email without from_name",
            {
                "to": "no-from@tzlm.io",
                "subject": "No From Name Test",
                "text": "This email has no from_name field."
            },
            expected_status=200
        )
        
        # Test 5: Email with special characters in subject
        self.test_send_email(
            "Send email with special characters",
            {
                "to": "special-chars@tzlm.io",
                "subject": "Special Chars: 🚀 Ñoñó Çüé 中文 العربية",
                "html": "<p>Testing special characters: 🎉 ñ ü ç 中文</p>",
                "text": "Testing special characters: 🎉 ñ ü ç 中文"
            },
            expected_status=200
        )
        
        # Test 6: Email with long content
        long_text = "This is a long email. " * 100
        self.test_send_email(
            "Send email with long content",
            {
                "to": "long-content@tzlm.io",
                "subject": "Long Content Test",
                "html": f"<p>{long_text}</p>",
                "text": long_text
            },
            expected_status=200
        )
        
        # Test 7: Missing required field (to)
        self.test_send_email(
            "Missing 'to' field (should fail)",
            {
                "subject": "Missing To Field",
                "text": "This should fail - no recipient"
            },
            expected_status=422  # Validation error
        )
        
        # Test 8: Missing required field (subject)
        self.test_send_email(
            "Missing 'subject' field (should fail)",
            {
                "to": "no-subject@tzlm.io",
                "text": "This should fail - no subject"
            },
            expected_status=422  # Validation error
        )
        
        # Test 9: Missing content (both html and text)
        self.test_send_email(
            "Missing content fields (should fail)",
            {
                "to": "no-content@tzlm.io",
                "subject": "No Content Test"
            },
            expected_status=400  # Bad request
        )
        
        # Test 10: Invalid email format
        self.test_send_email(
            "Invalid email format",
            {
                "to": "not-an-email",
                "subject": "Invalid Email Test",
                "text": "Testing invalid email format"
            },
            expected_status=200  # API may still accept it
        )
        
        # Test 11: Multiple recipients (if supported)
        self.test_send_email(
            "Multiple recipients test",
            {
                "to": "first@tzlm.io,second@tzlm.io",
                "subject": "Multiple Recipients Test",
                "text": "Testing multiple recipients"
            },
            expected_status=200
        )
        
        # Test 12: Email with HTML injection attempt
        self.test_send_email(
            "HTML injection test (security)",
            {
                "to": "security@tzlm.io",
                "subject": "Security Test",
                "html": "<script>alert('XSS')</script><p>Testing HTML safety</p>",
                "text": "<script>alert('XSS')</script> Testing text safety"
            },
            expected_status=200
        )
        
        # Print results summary
        self.print_results_summary()
    
    def print_results_summary(self):
        """Print a summary of test results"""
        self.print_section("Test Results Summary")
        
        total = self.test_count
        passed = self.passed_count
        failed = self.failed_count
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {Colors.OKGREEN}{passed}{Colors.ENDC}")
        print(f"Failed: {Colors.FAIL}{failed}{Colors.ENDC}")
        print(f"Pass Rate: {pass_rate:.1f}%")
        
        if failed == 0:
            self.print_success("All tests passed! 🎉")
        elif passed > failed:
            self.print_warning(f"Most tests passed, but {failed} test(s) failed")
        else:
            self.print_failure("Multiple test failures detected")
        
        # Environment recommendations
        print(f"\n{Colors.BOLD}Environment Recommendations:{Colors.ENDC}")
        if not os.getenv("AGENTMAIL_API_KEY"):
            print("• Set AGENTMAIL_API_KEY environment variable for production testing")
            print("  export AGENTMAIL_API_KEY='your-api-key-here'")
        if os.getenv("DEBUG") == "true":
            print("• DEBUG mode is enabled - emails are being mocked")
            print("  unset DEBUG  # to disable debug mode")


def main():
    """Main function"""
    # Parse command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] in ["-h", "--help"]:
            print("Usage: python test_mail_comprehensive.py [base_url]")
            print("\nRun comprehensive tests on the Tzelem mail API")
            print("\nOptions:")
            print("  base_url    Backend URL (default: http://localhost:8000)")
            print("\nExamples:")
            print("  python test_mail_comprehensive.py")
            print("  python test_mail_comprehensive.py http://localhost:3000")
            sys.exit(0)
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:8000"
    
    # Run tests
    tester = MailAPITester(base_url)
    tester.run_all_tests()


if __name__ == "__main__":
    main()

