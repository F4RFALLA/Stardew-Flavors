from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Avg


class Receita(models.Model):
    titulo = models.CharField(
        max_length=150,
        verbose_name='Nome da receita',
    )

    descricao = models.CharField(
        max_length=300,
        verbose_name='Descrição curta',
    )

    origem = models.CharField(
        max_length=200,
        blank=True,
        verbose_name='Origem',
    )

    imagem = models.ImageField(
        upload_to='receitas/fotos/',
        blank=True,
        null=True,
        verbose_name='Imagem',
    )

    imagem_url = models.URLField(
        blank=True,
        verbose_name='URL da imagem',
    )

    ingredientes = models.TextField(
        verbose_name='Ingredientes',
    )

    modo_preparo = models.TextField(
        verbose_name='Modo de preparo',
    )

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='receitas',
        verbose_name='Autor',
    )

    data_publicacao = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data de publicação',
    )

    data_atualizacao = models.DateTimeField(
        auto_now=True,
        verbose_name='Última atualização',
    )

    class Meta:
        ordering = ['-data_publicacao']
        verbose_name = 'Receita'
        verbose_name_plural = 'Receitas'

    def __str__(self):
        return self.titulo

    @property
    def media_avaliacoes(self):
        resultado = self.comentarios.aggregate(media=Avg('nota'))
        media = resultado['media']

        if media is None:
            return 0

        return round(media, 1)

    @property
    def total_avaliacoes(self):
        return self.comentarios.count()


class Comentario(models.Model):
    receita = models.ForeignKey(
        Receita,
        on_delete=models.CASCADE,
        related_name='comentarios',
        verbose_name='Receita',
    )

    autor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='comentarios',
        verbose_name='Autor',
    )

    texto = models.TextField(
        verbose_name='Comentário',
    )

    nota = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5),
        ],
        verbose_name='Nota',
    )

    data_publicacao = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data de publicação',
    )

    data_atualizacao = models.DateTimeField(
        auto_now=True,
        verbose_name='Última atualização',
    )

    class Meta:
        ordering = ['-data_publicacao']
        verbose_name = 'Comentário'
        verbose_name_plural = 'Comentários'

    def __str__(self):
        return (
            f'{self.autor.username} - '
            f'{self.receita.titulo} ({self.nota}/5)'
        )


class Favorito(models.Model):
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='favoritos',
        verbose_name='Usuário',
    )

    receita = models.ForeignKey(
        Receita,
        on_delete=models.CASCADE,
        related_name='favoritada_por',
        verbose_name='Receita',
    )

    data_adicao = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Data de adição',
    )

    class Meta:
        ordering = ['-data_adicao']
        verbose_name = 'Favorito'
        verbose_name_plural = 'Favoritos'

        constraints = [
            models.UniqueConstraint(
                fields=['usuario', 'receita'],
                name='favorito_unico_por_usuario',
            ),
        ]

    def __str__(self):
        return f'{self.usuario.username} - {self.receita.titulo}'