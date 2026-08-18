from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BLACKBUSER API"
    database_url: str = "sqlite:///./blackbuser.db"
    jwt_secret: str = "blackbuser-dev-secret-change-me"
    jwt_refresh_secret: str = "blackbuser-refresh-secret-change-me"
    redis_url: str = ""
    email_provider: str = "console"
    email_from: str = "no-reply@blackbuser.com"
    email_service_id: str = ""
    email_template_id: str = ""
    email_public_key: str = ""
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')


settings = Settings()
