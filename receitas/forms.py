from django import forms
from django.forms import ModelForm

from .models import Comentario, Receita


class FormularioReceita(ModelForm):
    class Meta:
        model = Receita

        fields = [
            'titulo',
            'descricao',
            'origem',
            'imagem',
            'imagem_url',
            'ingredientes',
            'modo_preparo',
        ]

        widgets = {
            'titulo': forms.TextInput(
                attrs={
                    'class': 'campo-formulario',
                    'placeholder': 'Ex.: Torta de Abóbora',
                },
            ),

            'descricao': forms.Textarea(
                attrs={
                    'class': 'campo-formulario',
                    'rows': 4,
                    'placeholder': 'Escreva uma descrição curta da receita.',
                },
            ),

            'origem': forms.TextInput(
                attrs={
                    'class': 'campo-formulario',
                    'placeholder': 'Ex.: Canal Queen of Sauce, receita da família...',
                },
            ),

            'imagem': forms.ClearableFileInput(
                attrs={
                    'class': 'campo-formulario',
                    'accept': 'image/*',
                },
            ),

            'imagem_url': forms.URLInput(
                attrs={
                    'class': 'campo-formulario',
                    'placeholder': 'https://exemplo.com/imagem.jpg',
                },
            ),

            'ingredientes': forms.Textarea(
                attrs={
                    'class': 'campo-formulario campo-texto-longo',
                    'rows': 9,
                    'placeholder': (
                        'Escreva os ingredientes da maneira que preferir.'
                    ),
                    'wrap': 'soft',
                },
            ),

            'modo_preparo': forms.Textarea(
                attrs={
                    'class': 'campo-formulario campo-texto-longo',
                    'rows': 12,
                    'placeholder': (
                        'Descreva livremente como a receita deve ser preparada.'
                    ),
                    'wrap': 'soft',
                },
            ),
        }


class FormularioComentario(ModelForm):
    class Meta:
        model = Comentario

        fields = [
            'nota',
            'texto',
        ]

        labels = {
            'nota': 'Sua avaliação',
            'texto': 'Comentário ou sugestão',
        }

        widgets = {
            'nota': forms.Select(
                choices=[
                    (1, '1 estrela'),
                    (2, '2 estrelas'),
                    (3, '3 estrelas'),
                    (4, '4 estrelas'),
                    (5, '5 estrelas'),
                ],
                attrs={
                    'class': 'campo-formulario',
                },
            ),

            'texto': forms.Textarea(
                attrs={
                    'class': 'campo-formulario campo-texto-longo',
                    'rows': 6,
                    'placeholder': (
                        'Conte como ficou a receita ou deixe uma sugestão.'
                    ),
                    'wrap': 'soft',
                },
            ),
        }