# This script will run the uvicorn development server
import subprocess
import os
import sys

def main():
    # Ensure we run from the backend directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    subprocess.run([sys.executable, "-m", "uvicorn", "app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"])

if __name__ == "__main__":
    main()
