from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    project_name: str = "Sindí API"
    
    # NVIDIA NIM
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    
    # Database
    database_url: str = "sqlite:///./sindi.db"
    
    # Facebook Scraping
    fb_c_user: str = ""
    fb_xs: str = ""
    
    class Config:
        env_file = ".env"

settings = Settings()
