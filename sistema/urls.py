from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path

from sistema.views import (
    Cadastro,
    CadastroAPI,
    Home,
    Login,
    LoginAPI,
    Logout,
)


urlpatterns = [
    path(
        'admin/',
        admin.site.urls,
    ),

    path(
        'receitas/',
        include('receitas.urls'),
    ),

    path(
        '',
        Home.as_view(),
        name='home',
    ),

    path(
        'login/',
        Login.as_view(),
        name='login',
    ),

    path(
        'cadastro/',
        Cadastro.as_view(),
        name='cadastro',
    ),

    path(
        'logout/',
        Logout.as_view(),
        name='logout',
    ),

    path(
        'api/login/',
        LoginAPI.as_view(),
        name='api_login',
    ),

    path(
        'api/cadastro/',
        CadastroAPI.as_view(),
        name='api_cadastro',
    ),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT,
    )