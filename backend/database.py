import os
import re
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "").strip()

if SUPABASE_URL:
    # Ensure standard Supabase base URL format (without /rest/v1 trailing path)
    SUPABASE_URL = re.sub(r'/rest/v1/?$', '', SUPABASE_URL).rstrip('/')

if not SUPABASE_URL or not SUPABASE_KEY or "lenjytkwvsbxjytfwqce" in SUPABASE_URL or "placeholder" in SUPABASE_URL:
    logging.info("Supabase is in offline/local fallback mode (no active remote database configured).")
    supabase = None
elif SUPABASE_URL == "your_supabase_url_here" or SUPABASE_KEY == "your_supabase_anon_key_here":
    logging.warning("SUPABASE_URL or SUPABASE_KEY are set to placeholder values. Please update your .env file.")
    supabase = None
else:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        logging.error(f"Failed to initialize Supabase client: {e}")
        supabase = None
