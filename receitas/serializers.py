from rest_framework import serializers

from .models import Comentario, Receita, Favorito


class SerializadorReceita(serializers.ModelSerializer):
    autor = serializers.CharField(
        source='autor.username',
        read_only=True,
    )

    media_avaliacoes = serializers.FloatField(
        read_only=True,
    )

    total_avaliacoes = serializers.IntegerField(
        read_only=True,
    )

    imagem_exibicao = serializers.SerializerMethodField()
    favoritada_pelo_usuario = serializers.SerializerMethodField()

    class Meta:
        model = Receita

        fields = [
            'id',
            'titulo',
            'descricao',
            'origem',
            'imagem',
            'imagem_url',
            'imagem_exibicao',
            'ingredientes',
            'modo_preparo',
            'autor',
            'media_avaliacoes',
            'total_avaliacoes',
            'data_publicacao',
            'data_atualizacao',
            'favoritada_pelo_usuario',
        ]

        read_only_fields = [
            'id',
            'autor',
            'media_avaliacoes',
            'total_avaliacoes',
            'data_publicacao',
            'data_atualizacao',
        ]

    def get_imagem_exibicao(self, receita):
        request = self.context.get('request')

        if receita.imagem:
            caminho_imagem = receita.imagem.url

            if request:
                return request.build_absolute_uri(
                    caminho_imagem
                )

            return caminho_imagem

        if receita.imagem_url:
            return receita.imagem_url

        return None
    
    def get_favoritada_pelo_usuario(self, receita):
        request = self.context.get('request')

        if not request:
            return False

        if not request.user.is_authenticated:
            return False

        return Favorito.objects.filter(
            usuario=request.user,
            receita=receita,
        ).exists()


class SerializadorComentario(serializers.ModelSerializer):
    autor = serializers.CharField(
        source='autor.username',
        read_only=True,
    )

    receita = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    class Meta:
        model = Comentario

        fields = [
            'id',
            'receita',
            'autor',
            'texto',
            'nota',
            'data_publicacao',
            'data_atualizacao',
        ]

        read_only_fields = [
            'id',
            'receita',
            'autor',
            'data_publicacao',
            'data_atualizacao',
        ]

