"""
Simple OAuth2 implementation for Auth0
Handles login, callback, and logout flows
"""
import os
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

# Load environment variables
config = Config(environ=os.environ)

# Initialize OAuth
oauth = OAuth()

# Register Auth0 as OAuth provider
oauth.register(
    name='auth0',
    client_id=config.get('AUTH0_CLIENT_ID'),
    client_secret=config.get('AUTH0_CLIENT_SECRET'),
    client_kwargs={
        'scope': 'openid profile email',
    },
    server_metadata_url=f'https://{config.get("AUTH0_DOMAIN")}/.well-known/openid-configuration',
)
