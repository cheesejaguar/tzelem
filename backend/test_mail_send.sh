#!/bin/bash

# Test script to send email via mail API using curl

echo "============================================================"
echo "TZELEM MAIL API TEST SCRIPT (Shell Version)"
echo "============================================================"

# Configuration
BASE_URL="http://localhost:8000"
RECIPIENT="hello@tzlm.io"
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
ISO_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Check health first
echo ""
echo "📋 Checking mail service health..."
HEALTH_RESPONSE=$(curl -s "${BASE_URL}/api/mail/health")
if [ $? -eq 0 ]; then
    echo "   Health Response: ${HEALTH_RESPONSE}"
else
    echo "   ❌ Could not connect to backend at ${BASE_URL}"
    echo "   Make sure the backend is running: cd backend && python main.py"
    exit 1
fi

# Prepare email JSON
EMAIL_JSON=$(cat <<EOF
{
  "to": "${RECIPIENT}",
  "subject": "Test Email from Tzelem - ${TIMESTAMP}",
  "from_name": "Tzelem Test Script",
  "html": "<html><body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'><h2 style='color: #0066ff;'>Test Email from Tzelem</h2><p>This is a test email sent via the Tzelem mail API.</p><h3>Test Details:</h3><ul><li><strong>Timestamp:</strong> ${ISO_TIME}</li><li><strong>Endpoint:</strong> ${BASE_URL}/api/mail</li><li><strong>Recipient:</strong> ${RECIPIENT}</li></ul><p>If you received this email, the mail API is working correctly!</p><hr style='border: none; border-top: 1px solid #ddd; margin: 20px 0;'><p style='color: #666; font-size: 12px;'>This is an automated test email from Tzelem's mail testing script.</p></body></html>",
  "text": "Test Email from Tzelem\n\nThis is a test email sent via the Tzelem mail API.\n\nTest Details:\n- Timestamp: ${ISO_TIME}\n- Endpoint: ${BASE_URL}/api/mail\n- Recipient: ${RECIPIENT}\n\nIf you received this email, the mail API is working correctly!\n\n---\nThis is an automated test email from Tzelem's mail testing script."
}
EOF
)

# Send email
echo ""
echo "🚀 Sending test email to ${RECIPIENT}..."
echo "   Subject: Test Email from Tzelem - ${TIMESTAMP}"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d "${EMAIL_JSON}" \
    "${BASE_URL}/api/mail")

HTTP_STATUS=$(echo "${RESPONSE}" | grep "HTTP_STATUS:" | cut -d':' -f2)
BODY=$(echo "${RESPONSE}" | sed '/HTTP_STATUS:/d')

if [ "${HTTP_STATUS}" = "200" ]; then
    echo "✅ Email sent successfully!"
    echo "   Response: ${BODY}"
else
    echo "❌ Failed to send email"
    echo "   HTTP Status: ${HTTP_STATUS}"
    echo "   Response: ${BODY}"
fi

echo ""
echo "============================================================"
echo "Test completed!"

# Check if AgentMail is configured
if echo "${HEALTH_RESPONSE}" | grep -q '"api_key_configured":false'; then
    echo ""
    echo "⚠️  Note: AGENTMAIL_API_KEY is not configured."
    echo "   Set the environment variable to enable real email sending:"
    echo "   export AGENTMAIL_API_KEY='your-api-key-here'"
fi