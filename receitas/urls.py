from django.urls import path

from .views import (
APIDetalharComentario,
APIDetalharReceita,
APIListarCriarComentarios,
APIListarReceitas,
AlternarFavorito,
CriarComentario,
CriarReceita,
DetalharReceita,
EditarComentario,
EditarReceita,
ExcluirComentario,
ExcluirReceita,
ListarFavoritos,
ListarReceitas,
APIAlternarFavorito,
APIListarFavoritos,
)

urlpatterns = [
    path(
        '',
        ListarReceitas.as_view(),
        name='listar_receitas',
    ),


    path(
        'nova/',
        CriarReceita.as_view(),
        name='criar_receita',
    ),

    path(
        'favoritos/',
        ListarFavoritos.as_view(),
        name='listar_favoritos',
    ),

    path(
        'api/listar/',
        APIListarReceitas.as_view(),
        name='api_listar_receitas',
    ),

    path(
        'api/<int:receita_pk>/comentarios/',
        APIListarCriarComentarios.as_view(),
        name='api_comentarios_receita',
    ),

    path(
        'api/comentarios/<int:pk>/',
        APIDetalharComentario.as_view(),
        name='api_detalhar_comentario',
    ),

    path(
        'api/<int:pk>/',
        APIDetalharReceita.as_view(),
        name='api_detalhar_receita',
    ),

    path(
        'api/favoritos/',
        APIListarFavoritos.as_view(),
        name='api_listar_favoritos',
    ),

    path(
        'api/<int:pk>/favoritar/',
        APIAlternarFavorito.as_view(),
        name='api_alternar_favorito',
    ),

    path(
        '<int:pk>/comentar/',
        CriarComentario.as_view(),
        name='criar_comentario',
    ),

    path(
        'comentarios/<int:pk>/editar/',
        EditarComentario.as_view(),
        name='editar_comentario',
    ),

    path(
        'comentarios/<int:pk>/excluir/',
        ExcluirComentario.as_view(),
        name='excluir_comentario',
    ),

    path(
        '<int:pk>/favoritar/',
        AlternarFavorito.as_view(),
        name='alternar_favorito',
    ),

    path(
        '<int:pk>/editar/',
        EditarReceita.as_view(),
        name='editar_receita',
    ),

    path(
        '<int:pk>/excluir/',
        ExcluirReceita.as_view(),
        name='excluir_receita',
    ),

    path(
        '<int:pk>/',
        DetalharReceita.as_view(),
        name='detalhar_receita',
    ),
]
