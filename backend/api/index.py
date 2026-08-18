import sys
import os

# Ensure parent directory (backend root) is in Python path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
