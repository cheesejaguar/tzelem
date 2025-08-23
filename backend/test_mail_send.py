#!/usr/bin/env python3
"""
Test script to send a test email via the mail API to hello@tzlm.io
"""

import json
import requests
from datetime import datetime


def send_test_email():
    """Send a test email via the API"""
    
    # API endpoint
    base_url = "http://localhost:8000"  # Adjust if your backend runs on a different port
    endpoint = f"{base_url}/api/mail"
    
    # Email data
    email_data = {
        "to": "hello@tzlm.io",
        "subject": f"Test Email from Tzelem - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "html": f"""
        <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #0066ff;">Test Email from Tzelem</h2>
                <p>This is a test email sent via the Tzelem mail API.</p>
                
                <h3>Test Details:</h3>
                <ul>
                    <li><strong>Timestamp:</strong> {datetime.now().isoformat()}</li>
                    <li><strong>Endpoint:</strong> {endpoint}</li>
                    <li><strong>Recipient:</strong> hello@tzlm.io</li>
                </ul>
                
                <p>If you received this email, the mail API is working correctly!</p>
                
                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                    This is an automated test email from Tzelem's mail testing script.
                </p>
            </body>
        </html>
        """,
        "text": f"""
Test Email from Tzelem

This is a test email sent via the Tzelem mail API.

Test Details:
- Timestamp: {datetime.now().isoformat()}
- Endpoint: {endpoint}
- Recipient: hello@tzlm.io

If you received this email, the mail API is working correctly!

---
This is an automated test email from Tzelem's mail testing script.
        """,
        "from_name": "Tzelem Test Script"
    }
    
    try:
        print(f"🚀 Sending test email to hello@tzlm.io...")
        print(f"   Endpoint: {endpoint}")
        print(f"   Subject: {email_data['subject']}")
        
        # Send the request
        response = requests.post(
            endpoint,
            json=email_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Check response
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Email sent successfully!")
            print(f"   Status: {result.get('status')}")
            print(f"   Message: {result.get('message')}")
            if result.get('messageId'):
                print(f"   Message ID: {result.get('messageId')}")
        else:
            print(f"❌ Failed to send email")
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.text}")
            
            # Parse error if JSON
            try:
                error_data = response.json()
                print(f"   Error Detail: {error_data.get('detail', 'Unknown error')}")
            except:
                pass
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Could not connect to the backend server")
        print("   Make sure the backend is running on http://localhost:8000")
        print("   You can start it with: cd backend && python main.py")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


def check_health():
    """Check the health of the mail service"""
    base_url = "http://localhost:8000"
    health_endpoint = f"{base_url}/api/mail/health"
    
    try:
        print("\n📋 Checking mail service health...")
        response = requests.get(health_endpoint)
        
        if response.status_code == 200:
            health = response.json()
            print(f"   Status: {health.get('status')}")
            print(f"   AgentMail Installed: {health.get('agentmail_installed')}")
            print(f"   API Key Configured: {health.get('api_key_configured')}")
            print(f"   Mock Mode: {health.get('mock_mode')}")
            print(f"   Message: {health.get('message')}")
            return health
        else:
            print(f"   Failed to check health - Status: {response.status_code}")
            return None
    except Exception as e:
        print(f"   Could not check health: {e}")
        return None


if __name__ == "__main__":
    print("=" * 60)
    print("TZELEM MAIL API TEST SCRIPT")
    print("=" * 60)
    
    # First check health
    health = check_health()
    
    # Send test email
    print("")
    send_test_email()
    
    print("\n" + "=" * 60)
    print("Test completed!")
    
    if health and not health.get('api_key_configured'):
        print("\n⚠️  Note: AGENTMAIL_API_KEY is not configured.")
        print("   Set the environment variable to enable real email sending.")
        print("   export AGENTMAIL_API_KEY='your-api-key-here'")