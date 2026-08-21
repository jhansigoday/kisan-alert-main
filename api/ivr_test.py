"""
ivr_test.py — Interactively trigger a live physical phone call.
This script checks your Twilio credentials, auto-detects your active ngrok URL,
and places a live outbound call to your keypad or smartphone!
"""

import os
import sys
from dotenv import load_dotenv
import requests

# Load env variables from backend folder
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

def main():
    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_PHONE_NUMBER")

    print("==================================================")
    print("🌾 AgriVaani Live Outbound Call Trigger 🌾")
    print("==================================================")

    # 1. Validation check
    if not account_sid or not auth_token or not from_number:
        print("\n❌ Error: Twilio credentials not fully set in backend/.env!")
        print("Please ensure these fields are configured:")
        print(" - TWILIO_ACCOUNT_SID")
        print(" - TWILIO_AUTH_TOKEN")
        print(" - TWILIO_PHONE_NUMBER")
        sys.exit(1)

    try:
        from twilio.rest import Client
    except ImportError:
        print("\n❌ Error: Twilio library is not installed in the environment!")
        print("Please run: pip install twilio")
        sys.exit(1)

    client = Client(account_sid, auth_token)

    # 2. Auto-detect running ngrok tunnel URL
    ngrok_url = None
    try:
        res = requests.get("http://127.0.0.1:4040/api/tunnels", timeout=3)
        if res.status_code == 200:
            tunnels = res.json().get("tunnels", [])
            for tunnel in tunnels:
                # Find the HTTPS forwarding tunnel pointing to port 5000
                if tunnel.get("proto") == "https" and ":5000" in tunnel.get("config", {}).get("addr", ""):
                    ngrok_url = tunnel.get("public_url")
                    print(f"✅ Auto-detected active ngrok tunnel URL: {ngrok_url}")
                    break
            if not ngrok_url and tunnels:
                # Fallback to the first HTTPS tunnel found if port 5000 not strictly matched
                for tunnel in tunnels:
                    if tunnel.get("proto") == "https":
                        ngrok_url = tunnel.get("public_url")
                        print(f"⚠️ Found ngrok tunnel (different port): {ngrok_url}")
                        break
    except Exception:
        # ngrok API not reachable
        pass

    if not ngrok_url:
        print("\n🔎 Could not auto-detect running ngrok tunnel.")
        print("💡 Please make sure ngrok is running in another terminal window:")
        print("   command: ngrok http 5000")
        print("--------------------------------------------------")
        
        ngrok_url = input("\nOr enter your active public URL manually (e.g. https://xxxx.ngrok-free.app): ").strip()
        if not ngrok_url.startswith("http"):
            print("❌ Error: Active public URL must start with 'http://' or 'https://'")
            sys.exit(1)

    # Clean trailing slash if present
    if ngrok_url.endswith("/"):
        ngrok_url = ngrok_url[:-1]

    sys.path.insert(0, os.path.dirname(__file__))
    try:
        from farmer_profile import get_latest_phone_number
        db_phone = get_latest_phone_number()
    except Exception:
        db_phone = ""

    # Check for default test number in environment
    env_phone = os.environ.get("TEST_PHONE_NUMBER", "").strip()
    
    to_number = ""
    if env_phone:
        print(f"🎯 Auto-retrieved default test phone number from .env: {env_phone}")
        to_number = env_phone
    elif db_phone:
        ans = input(f"📞 Auto-retrieved latest registered farmer phone: {db_phone}. Call this number? (Y/n): ").strip().lower()
        if ans in ["", "y", "yes"]:
            to_number = db_phone

    if not to_number:
        to_number = input("\nEnter your phone number with country code (e.g., +919876543210): ").strip()
        
    if not to_number.startswith("+"):
        print("⚠️ Warning: Phone number should start with '+' and have a country code.")
        proceed = input("Do you want to proceed anyway? (y/n): ").strip().lower()
        if proceed != 'y':
            print("Aborted.")
            sys.exit(0)

    webhook_url = f"{ngrok_url}/api/ivr/incoming-call"
    print(f"\nWebhook target set to: {webhook_url}")
    
    # Auto-update the Twilio console Incoming Phone Number webhook configuration
    try:
        incoming_numbers = client.incoming_phone_numbers.list(phone_number=from_number)
        if incoming_numbers:
            number_sid = incoming_numbers[0].sid
            client.incoming_phone_numbers(number_sid).update(
                voice_url=webhook_url,
                voice_method="POST"
            )
            print(f"🎯 Successfully updated Twilio Console Phone Number ({from_number}) Webhook to active tunnel: {webhook_url}")
            print("💡 You can now also call this Twilio number DIRECTLY from any phone (verified or unverified) to test the IVR!")
        else:
            print(f"⚠️ Could not find phone number {from_number} in your Twilio account to update its webhook automatically.")
    except Exception as e:
        print(f"⚠️ Note: Could not auto-update Twilio phone number webhook via API: {e}")

    print("\nPlacing outbound call... please keep your phone nearby!")

    try:
        call = client.calls.create(
            to=to_number,
            from_=from_number,
            url=webhook_url,
        )
        print("\n✅ Call triggered successfully!")
        print(f"Call SID: {call.sid}")
        print(f"Current Status: {call.status}")
        print("==================================================")
    except Exception as e:
        print(f"\n❌ Error placing call: {e}")
        print("Make sure your Twilio credentials are valid, the from number is verified,")
        print("and your public URL webhook endpoint is running.")

if __name__ == "__main__":
    main()