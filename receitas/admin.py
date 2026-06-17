from django.contrib import admin

from .models import Comentario, Favorito, Receita


@admin.register(Receita)
class ReceitaAdmin(admin.ModelAdmin):
    list_display = (
        'titulo',
        'autor',
        'data_publicacao',
        'media_avaliacoes',
    )

    search_fields = (
        'titulo',
        'descricao',
        'autor__username',
    )

    list_filter = (
        'data_publicacao',
        'data_atualizacao',
    )

    readonly_fields = (
        'data_publicacao',
        'data_atualizacao',
    )


@admin.register(Comentario)
class ComentarioAdmin(admin.ModelAdmin):
    list_display = (
        'autor',
        'receita',
        'nota',
        'data_publicacao',
    )

    search_fields = (
        'autor__username',
        'receita__titulo',
        'texto',
    )

    list_filter = (
        'nota',
        'data_publicacao',
    )

    readonly_fields = (
        'data_publicacao',
        'data_atualizacao',
    )


@admin.register(Favorito)
class FavoritoAdmin(admin.ModelAdmin):
    list_display = (
        'usuario',
        'receita',
        'data_adicao',
    )

    search_fields = (
        'usuario__username',
        'receita__titulo',
    )

    list_filter = (
        'data_adicao',
    )

    readonly_fields = (
        'data_adicao',
    )