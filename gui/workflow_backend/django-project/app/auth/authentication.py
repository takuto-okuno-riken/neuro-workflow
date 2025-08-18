import jwt
import requests
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class SupabaseAuthentication(authentication.BaseAuthentication):
    """
    Supabase JWT認証クラス
    """

    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request).split()

        if not auth_header or auth_header[0].lower() != b"bearer":
            return None

        if len(auth_header) == 1:
            msg = "Invalid token header. No credentials provided."
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth_header) > 2:
            msg = "Invalid token header. Token string should not contain spaces."
            raise exceptions.AuthenticationFailed(msg)

        try:
            token = auth_header[1].decode("utf-8")
        except UnicodeError:
            msg = "Invalid token header. Token string should not contain invalid characters."
            raise exceptions.AuthenticationFailed(msg)

        return self.authenticate_credentials(token)

    def authenticate_credentials(self, token):
        """
        Supabase JWTトークンを検証し、ユーザーを取得または作成
        """
        try:
            # Supabaseの公開鍵を取得してトークンを検証
            payload = self.verify_token(token)

            # ユーザー情報を取得
            user_id = payload.get("sub")
            email = payload.get("email")

            if not user_id or not email:
                raise exceptions.AuthenticationFailed("Invalid token payload.")

            # Djangoユーザーを取得または作成
            user = self.get_or_create_user(user_id, email, payload)

            return (user, token)

        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed("Token has expired.")
        except jwt.InvalidTokenError as e:
            raise exceptions.AuthenticationFailed(f"Invalid token: {str(e)}")
        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            raise exceptions.AuthenticationFailed("Authentication failed.")

    def verify_token(self, token):
        """
        SupabaseのJWTトークンを検証
        """
        # Supabaseプロジェクトの設定から取得する必要があります
        supabase_url = settings.SUPABASE_URL
        supabase_key = settings.SUPABASE_ANON_KEY

        # JWTのヘッダーから kid (key id) を取得
        unverified_header = jwt.get_unverified_header(token)

        # Supabaseの公開鍵を取得
        jwks_url = f"{supabase_url}/auth/v1/jwks"
        jwks_response = requests.get(jwks_url)
        jwks = jwks_response.json()

        # 適切な公開鍵を見つける
        public_key = None
        for key in jwks["keys"]:
            if key["kid"] == unverified_header.get("kid"):
                public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break

        if not public_key:
            raise jwt.InvalidTokenError("Unable to find appropriate key")

        # トークンを検証
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            audience="authenticated",
            issuer=f"{supabase_url}/auth/v1",
        )

        return payload

    def get_or_create_user(self, user_id, email, payload):
        """
        Supabaseのユーザー情報からDjangoユーザーを取得または作成
        """
        User = get_user_model()

        # まずSupabase UIDで検索
        try:
            user = User.objects.get(username=user_id)
            return user
        except User.DoesNotExist:
            pass

        # 次にメールアドレスで検索
        try:
            user = User.objects.get(email=email)
            # ユーザー名をSupabase UIDに更新
            user.username = user_id
            user.save()
            return user
        except User.DoesNotExist:
            pass

        # 新しいユーザーを作成
        user = User.objects.create_user(
            username=user_id,
            email=email,
            first_name=payload.get("user_metadata", {}).get("first_name", ""),
            last_name=payload.get("user_metadata", {}).get("last_name", ""),
        )

        return user


# settings.py の追加設定
"""
SUPABASE_URL = 'https://your-project.supabase.co'
SUPABASE_ANON_KEY = 'your-anon-key'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'your_app.authentication.SupabaseAuthentication',
        # 他の認証クラスも必要に応じて追加
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# CORS設定
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # 本番環境のフロントエンドURLも追加
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
"""

# views.py の例
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def protected_view(request):
    return Response({
        'message': 'Hello authenticated user!',
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
        }
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile(request):
    return Response({
        'user': {
            'id': request.user.id,
            'username': request.user.username,
            'email': request.user.email,
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
            'date_joined': request.user.date_joined,
        }
    })
"""
