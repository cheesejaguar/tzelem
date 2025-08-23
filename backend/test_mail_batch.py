#!/usr/bin/env python3
"""
Batch email testing script for the Tzelem mail API.
Sends multiple test emails with different configurations.
"""

import argparse
import random
import time
from datetime import datetime, timedelta
from typing import Any

import requests


class BatchMailTester:
    """Batch testing for mail API"""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.mail_endpoint = f"{base_url}/api/mail"
        self.health_endpoint = f"{base_url}/api/mail/health"
        self.sent_count = 0
        self.failed_count = 0
        self.start_time = None

    def generate_test_emails(self, count: int, recipient: str) -> list[dict[str, Any]]:
        """Generate a list of test emails with varied content"""
        emails = []

        # Email templates
        templates = [
            {
                "type": "welcome",
                "subject": "Welcome to Tzelem!",
                "html": """
                <h2>Welcome to Tzelem!</h2>
                <p>We're excited to have you on board.</p>
                <p>Tzelem helps you build AI teams that deliver real work.</p>
                <ul>
                    <li>Define objectives with budgets</li>
                    <li>Assemble specialized agents</li>
                    <li>Monitor workflows in real-time</li>
                </ul>
                """,
                "text": "Welcome to Tzelem!\n\nWe're excited to have you on board...",
            },
            {
                "type": "notification",
                "subject": "Your workflow completed successfully",
                "html": """
                <h3>Workflow Completed</h3>
                <p>Your workflow "Data Analysis Pipeline" has completed successfully.</p>
                <p><strong>Duration:</strong> 2 minutes 34 seconds</p>
                <p><strong>Status:</strong> ✅ Success</p>
                """,
                "text": "Your workflow completed successfully...",
            },
            {
                "type": "alert",
                "subject": "Budget threshold reached",
                "html": """
                <h3 style="color: #ff6600;">Budget Alert</h3>
                <p>Your project has reached 80% of its allocated budget.</p>
                <p>Consider reviewing your spending limits.</p>
                """,
                "text": "Budget Alert: 80% threshold reached...",
            },
            {
                "type": "report",
                "subject": "Weekly usage report",
                "html": """
                <h2>Weekly Usage Report</h2>
                <table>
                    <tr><td>Workflows Run:</td><td>42</td></tr>
                    <tr><td>Agents Created:</td><td>18</td></tr>
                    <tr><td>Total Spend:</td><td>$127.50</td></tr>
                </table>
                """,
                "text": "Weekly Report: 42 workflows, 18 agents, $127.50 spent",
            },
            {
                "type": "update",
                "subject": "New features available",
                "html": """
                <h2>New Features Released!</h2>
                <ul>
                    <li>Voice interface with PipeCat integration</li>
                    <li>Enhanced flow builder</li>
                    <li>Real-time collaboration</li>
                </ul>
                """,
                "text": "New features: Voice interface, Enhanced flow builder...",
            },
        ]

        for i in range(count):
            template = random.choice(templates)  # noqa: S311
            timestamp = datetime.now() + timedelta(seconds=i)

            email = {
                "to": recipient,
                "subject": f"[Batch Test {i + 1}/{count}] {template['subject']}",
                "html": template["html"]
                + f"\n<p style='color:#999;font-size:11px;'>Test email {i + 1} sent at {timestamp.isoformat()}</p>",
                "text": template["text"]
                + f"\n\nTest email {i + 1} sent at {timestamp.isoformat()}",
                "from_name": f"Tzelem Batch Test ({template['type'].title()})",
            }
            emails.append(email)

        return emails

    def send_batch(
        self,
        emails: list[dict[str, Any]],
        delay_between: float = 0.5,
        show_progress: bool = True,  # noqa: FBT001, FBT002
    ) -> dict[str, Any]:
        """
        Send a batch of emails

        Args:
            emails: List of email dictionaries
            delay_between: Delay in seconds between emails
            show_progress: Show progress bar

        Returns:
            Dictionary with batch results
        """
        total = len(emails)
        results = {"total": total, "sent": 0, "failed": 0, "errors": [], "duration": 0}

        print(f"\n📧 Sending batch of {total} emails...")
        print(f"   Delay between sends: {delay_between}s")
        print(f"   Estimated duration: {total * delay_between:.1f}s\n")

        self.start_time = time.time()

        for i, email_data in enumerate(emails, 1):
            # Progress indicator
            if show_progress:
                progress = i / total * 100
                bar_length = 40
                filled = int(bar_length * i / total)
                bar = "█" * filled + "░" * (bar_length - filled)
                print(f"\r[{bar}] {progress:.1f}% ({i}/{total})", end="", flush=True)

            try:
                # Send email
                response = requests.post(
                    self.mail_endpoint,
                    json=email_data,
                    headers={"Content-Type": "application/json"},
                    timeout=5,
                )

                if response.status_code == 200:
                    results["sent"] += 1
                    self.sent_count += 1
                else:
                    results["failed"] += 1
                    self.failed_count += 1
                    results["errors"].append(
                        {
                            "email": i,
                            "to": email_data["to"],
                            "status": response.status_code,
                            "error": response.text[:100],
                        }
                    )

            except Exception as e:
                results["failed"] += 1
                self.failed_count += 1
                results["errors"].append(
                    {"email": i, "to": email_data["to"], "error": str(e)[:100]}
                )

            # Delay between emails (except for the last one)
            if i < total and delay_between > 0:
                time.sleep(delay_between)

        results["duration"] = time.time() - self.start_time

        if show_progress:
            print()  # New line after progress bar

        return results

    def print_results(self, results: dict[str, Any]):
        """Print batch results"""
        print(f"\n{'=' * 50}")
        print("📊 Batch Results")
        print(f"{'=' * 50}")

        print(f"Total Emails: {results['total']}")
        print(f"✅ Sent: {results['sent']}")
        print(f"❌ Failed: {results['failed']}")
        print(f"⏱️  Duration: {results['duration']:.2f}s")
        print(f"📈 Rate: {results['total'] / results['duration']:.2f} emails/second")

        if results["errors"]:
            print(f"\n⚠️  Errors ({len(results['errors'])} total):")
            for error in results["errors"][:5]:  # Show first 5 errors
                print(
                    f"   • Email {error.get('email', 'N/A')}: {error.get('error', 'Unknown error')}"
                )
            if len(results["errors"]) > 5:
                print(f"   ... and {len(results['errors']) - 5} more errors")

        # Success rate
        success_rate = (results["sent"] / results["total"] * 100) if results["total"] > 0 else 0
        print(f"\n📊 Success Rate: {success_rate:.1f}%")

        if success_rate == 100:
            print("🎉 Perfect batch! All emails sent successfully.")
        elif success_rate >= 90:
            print("✅ Good performance with minor issues.")
        elif success_rate >= 50:
            print("⚠️  Moderate issues detected. Check your configuration.")
        else:
            print("❌ Significant issues. Please check server logs.")

    def run_stress_test(
        self,
        recipient: str,
        total_emails: int = 100,
        batch_size: int = 10,
        delay_between_batches: float = 2.0,
    ):
        """
        Run a stress test with multiple batches

        Args:
            recipient: Email recipient
            total_emails: Total number of emails to send
            batch_size: Number of emails per batch
            delay_between_batches: Delay between batches
        """
        print(f"\n{'=' * 60}")
        print("🚀 STRESS TEST MODE")
        print(f"{'=' * 60}")
        print(f"Total emails: {total_emails}")
        print(f"Batch size: {batch_size}")
        print(f"Number of batches: {total_emails // batch_size}")
        print(f"Delay between batches: {delay_between_batches}s")

        all_results = []
        emails_sent = 0

        while emails_sent < total_emails:
            remaining = total_emails - emails_sent
            current_batch_size = min(batch_size, remaining)

            print(f"\n📦 Batch {len(all_results) + 1}")

            # Generate and send batch
            emails = self.generate_test_emails(current_batch_size, recipient)
            results = self.send_batch(emails, delay_between=0.1, show_progress=True)
            all_results.append(results)

            emails_sent += current_batch_size

            # Delay between batches
            if emails_sent < total_emails:
                print(f"⏸️  Waiting {delay_between_batches}s before next batch...")
                time.sleep(delay_between_batches)

        # Print overall results
        print(f"\n{'=' * 60}")
        print("📊 STRESS TEST RESULTS")
        print(f"{'=' * 60}")

        total_sent = sum(r["sent"] for r in all_results)
        total_failed = sum(r["failed"] for r in all_results)
        total_duration = sum(r["duration"] for r in all_results)

        print(f"Total Emails Attempted: {total_emails}")
        print(f"✅ Successfully Sent: {total_sent}")
        print(f"❌ Failed: {total_failed}")
        print(f"⏱️  Total Duration: {total_duration:.2f}s")
        print(f"📈 Average Rate: {total_emails / total_duration:.2f} emails/second")

        success_rate = (total_sent / total_emails * 100) if total_emails > 0 else 0
        print(f"\n📊 Overall Success Rate: {success_rate:.1f}%")


def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Batch email testing for Tzelem mail API")
    parser.add_argument(
        "--recipient", "-r", default="test@tzlm.io", help="Email recipient (default: test@tzlm.io)"
    )
    parser.add_argument(
        "--count", "-c", type=int, default=10, help="Number of emails to send (default: 10)"
    )
    parser.add_argument(
        "--delay",
        "-d",
        type=float,
        default=0.5,
        help="Delay between emails in seconds (default: 0.5)",
    )
    parser.add_argument("--stress", "-s", action="store_true", help="Run stress test mode")
    parser.add_argument(
        "--batch-size", "-b", type=int, default=10, help="Batch size for stress test (default: 10)"
    )
    parser.add_argument(
        "--base-url",
        "-u",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )

    args = parser.parse_args()

    # Create tester
    tester = BatchMailTester(args.base_url)

    # Check backend
    try:
        response = requests.get(f"{args.base_url}/health", timeout=2)
        if response.status_code != 200:
            print("❌ Backend server is not responding correctly")
            return
    except Exception:
        print("❌ Cannot connect to backend server")
        print(f"   Make sure it's running at {args.base_url}")
        print("   Start with: cd backend && python main.py")
        return

    # Check mail health
    try:
        response = requests.get(tester.health_endpoint, timeout=2)
        if response.status_code == 200:
            health = response.json()
            print("\n📋 Mail Service Status:")
            print(f"   Status: {health.get('status')}")
            print(f"   API Key Configured: {health.get('api_key_configured')}")
            if not health.get("api_key_configured"):
                print("   ⚠️  Running in mock mode (no actual emails will be sent)")
    except Exception:  # noqa: S110
        pass

    # Run appropriate test
    if args.stress:
        tester.run_stress_test(
            recipient=args.recipient,
            total_emails=args.count,
            batch_size=args.batch_size,
            delay_between_batches=2.0,
        )
    else:
        # Regular batch test
        print(f"\n🚀 Generating {args.count} test emails for {args.recipient}...")
        emails = tester.generate_test_emails(args.count, args.recipient)

        results = tester.send_batch(emails, delay_between=args.delay)
        tester.print_results(results)


if __name__ == "__main__":
    main()
