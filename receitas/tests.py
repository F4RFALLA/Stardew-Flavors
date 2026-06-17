from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.urls import reverse

from .forms import FormularioReceita
from .models import Comentario, Favorito, Receita


class TestesModelReceita(TestCase):

    def setUp(self):
        self.autor = User.objects.create_user(
            username='autor',
            password='senha123',
        )

        self.receita = Receita.objects.create(
            titulo='Sopa de Abóbora',
            descricao='Uma sopa quente preparada com abóbora.',
            origem='Vila Pelicanos',
            ingredientes='1 abóbora\n1 porção de leite',
            modo_preparo='Misture os ingredientes e cozinhe.',
            autor=self.autor,
        )

    def test_criacao_receita(self):
        self.assertEqual(
            Receita.objects.count(),
            1,
        )

        self.assertEqual(
            self.receita.titulo,
            'Sopa de Abóbora',
        )

        self.assertEqual(
            self.receita.autor,
            self.autor,
        )

    def test_receita_sem_avaliacoes(self):
        self.assertEqual(
            self.receita.media_avaliacoes,
            0,
        )

        self.assertEqual(
            self.receita.total_avaliacoes,
            0,
        )

class TestesModelComentario(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='usuario',
            password='senha123',
        )

        self.receita = Receita.objects.create(
            titulo='Bolo Rosa',
            descricao='Um bolo preparado com melão.',
            origem='Vila Pelicanos',
            ingredientes='1 melão\n1 farinha\n1 açúcar',
            modo_preparo='Misture tudo e leve ao forno.',
            autor=self.usuario,
        )

    def test_comentario_com_nota_valida(self):
        comentario = Comentario(
            receita=self.receita,
            autor=self.usuario,
            texto='Receita muito boa.',
            nota=5,
        )

        comentario.full_clean()
        comentario.save()

        self.assertEqual(
            Comentario.objects.count(),
            1,
        )

        self.assertEqual(
            comentario.nota,
            5,
        )

class TestesModelFavorito(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='usuario',
            password='senha123',
        )

        self.receita = Receita.objects.create(
            titulo='Panquecas',
            descricao='Panquecas leves e saborosas.',
            origem='Vila Pelicanos',
            ingredientes='1 ovo\n1 farinha',
            modo_preparo='Misture e cozinhe em uma frigideira.',
            autor=self.usuario,
        )

    def test_criacao_favorito(self):
        favorito = Favorito.objects.create(
            usuario=self.usuario,
            receita=self.receita,
        )

        self.assertEqual(
            Favorito.objects.count(),
            1,
        )

        self.assertEqual(
            favorito.usuario,
            self.usuario,
        )

        self.assertEqual(
            favorito.receita,
            self.receita,
        )

    def test_usuario_nao_pode_favoritar_duas_vezes(self):
        Favorito.objects.create(
            usuario=self.usuario,
            receita=self.receita,
        )

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Favorito.objects.create(
                    usuario=self.usuario,
                    receita=self.receita,
                )

        self.assertEqual(
            Favorito.objects.count(),
            1,
        )

class TestesViewListarReceitas(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='autor_listagem',
            password='senha123',
        )

        self.receita = Receita.objects.create(
            titulo='Sopa de Abóbora',
            descricao='Uma sopa quente e nutritiva.',
            origem='Vila Pelicanos',
            ingredientes='1 abóbora\n1 porção de leite',
            modo_preparo='Misture e cozinhe.',
            autor=self.usuario,
        )

        self.url = reverse('listar_receitas')

    def test_listagem_pode_ser_acessada_sem_login(self):
        resposta = self.client.get(self.url)

        self.assertEqual(
            resposta.status_code,
            200,
        )

        self.assertTemplateUsed(
            resposta,
            'listar_receitas.html',
        )

    def test_listagem_exibe_as_receitas(self):
        resposta = self.client.get(self.url)

        receitas = resposta.context.get('receitas')

        self.assertEqual(
            len(receitas),
            1,
        )

        self.assertEqual(
            receitas[0],
            self.receita,
        )

class TestesViewDetalharReceita(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='autor_detalhes',
            password='senha123',
        )

        self.receita = Receita.objects.create(
            titulo='Panquecas',
            descricao='Panquecas leves para o café da manhã.',
            origem='Fazenda',
            ingredientes='1 ovo\n1 farinha\n1 leite',
            modo_preparo='Misture e cozinhe na frigideira.',
            autor=self.usuario,
        )

        self.url = reverse(
            'detalhar_receita',
            kwargs={
                'pk': self.receita.pk,
            },
        )

    def test_detalhes_podem_ser_acessados_sem_login(self):
        resposta = self.client.get(self.url)

        self.assertEqual(
            resposta.status_code,
            200,
        )

        self.assertTemplateUsed(
            resposta,
            'detalhar_receita.html',
        )

    def test_detalhes_exibem_a_receita_correta(self):
        resposta = self.client.get(self.url)

        receita_do_contexto = resposta.context.get('receita')

        self.assertEqual(
            receita_do_contexto,
            self.receita,
        )

        self.assertEqual(
            receita_do_contexto.titulo,
            'Panquecas',
        )

    def test_receita_inexistente_retorna_404(self):
        url_inexistente = reverse(
            'detalhar_receita',
            kwargs={
                'pk': 9999,
            },
        )

        resposta = self.client.get(url_inexistente)

        self.assertEqual(
            resposta.status_code,
            404,
        )

class TestesViewCriarReceita(TestCase):

    def setUp(self):
        self.usuario = User.objects.create_user(
            username='autor_criacao',
            password='senha123',
        )

        self.url = reverse('criar_receita')

        self.dados_validos = {
            'titulo': 'Omelete',
            'descricao': 'Um omelete simples e saboroso.',
            'origem': 'Vila Pelicanos',
            'imagem_url': '',
            'ingredientes': '2 ovos\n1 porção de queijo',
            'modo_preparo': 'Misture os ingredientes e frite.',
        }

    def test_usuario_autenticado_acessa_formulario(self):
        self.client.force_login(self.usuario)

        resposta = self.client.get(self.url)

        self.assertEqual(
            resposta.status_code,
            200,
        )

        self.assertTemplateUsed(
            resposta,
            'nova_receita.html',
        )

        self.assertIsInstance(
            resposta.context.get('form'),
            FormularioReceita,
        )

    def test_usuario_deslogado_nao_acessa_formulario(self):
        resposta = self.client.get(self.url)

        self.assertEqual(
            resposta.status_code,
            302,
        )

        destino_esperado = (
            f"{reverse('login')}?next={self.url}"
        )

        self.assertRedirects(
            resposta,
            destino_esperado,
        )

    def test_usuario_autenticado_cria_receita(self):
        self.client.force_login(self.usuario)

        resposta = self.client.post(
            self.url,
            self.dados_validos,
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertRedirects(
            resposta,
            reverse('listar_receitas'),
        )

        self.assertEqual(
            Receita.objects.count(),
            1,
        )

    def test_autor_e_definido_automaticamente(self):
        self.client.force_login(self.usuario)

        self.client.post(
            self.url,
            self.dados_validos,
        )

        receita = Receita.objects.first()

        self.assertIsNotNone(receita)

        self.assertEqual(
            receita.autor,
            self.usuario,
        )

    def test_usuario_deslogado_nao_cria_receita(self):
        resposta = self.client.post(
            self.url,
            self.dados_validos,
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertEqual(
            Receita.objects.count(),
            0,
        )

class TestesPermissoesReceita(TestCase):

    def setUp(self):
        self.autor = User.objects.create_user(
            username='autor_receita',
            password='senha123',
        )

        self.outro_usuario = User.objects.create_user(
            username='outro_usuario',
            password='senha123',
        )

        self.administrador = User.objects.create_user(
            username='administrador',
            password='senha123',
            is_staff=True,
        )

        self.receita = Receita.objects.create(
            titulo='Ensopado de Peixe',
            descricao='Um ensopado preparado com peixe fresco.',
            origem='Praia',
            ingredientes='1 peixe\n1 tomate\n1 batata',
            modo_preparo='Misture os ingredientes e cozinhe.',
            autor=self.autor,
        )

        self.url_editar = reverse(
            'editar_receita',
            kwargs={
                'pk': self.receita.pk,
            },
        )

        self.url_excluir = reverse(
            'excluir_receita',
            kwargs={
                'pk': self.receita.pk,
            },
        )

        self.dados_atualizados = {
            'titulo': 'Ensopado de Peixe Especial',
            'descricao': 'Uma versão atualizada do ensopado.',
            'origem': 'Praia da Vila',
            'imagem_url': '',
            'ingredientes': '2 peixes\n1 tomate\n2 batatas',
            'modo_preparo': 'Misture tudo e cozinhe lentamente.',
        }

    def test_autor_acessa_edicao_da_propria_receita(self):
        self.client.force_login(self.autor)

        resposta = self.client.get(self.url_editar)

        self.assertEqual(
            resposta.status_code,
            200,
        )

        self.assertTemplateUsed(
            resposta,
            'editar_receita.html',
        )

    def test_outro_usuario_nao_acessa_edicao(self):
        self.client.force_login(self.outro_usuario)

        resposta = self.client.get(self.url_editar)

        self.assertEqual(
            resposta.status_code,
            403,
        )

    def test_administrador_acessa_edicao(self):
        self.client.force_login(self.administrador)

        resposta = self.client.get(self.url_editar)

        self.assertEqual(
            resposta.status_code,
            200,
        )

    def test_usuario_deslogado_e_redirecionado_da_edicao(self):
        resposta = self.client.get(self.url_editar)

        destino_esperado = (
            f"{reverse('login')}?next={self.url_editar}"
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertRedirects(
            resposta,
            destino_esperado,
        )

    def test_autor_edita_a_propria_receita(self):
        self.client.force_login(self.autor)

        resposta = self.client.post(
            self.url_editar,
            self.dados_atualizados,
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertRedirects(
            resposta,
            reverse(
                'detalhar_receita',
                kwargs={
                    'pk': self.receita.pk,
                },
            ),
        )

        self.receita.refresh_from_db()

        self.assertEqual(
            self.receita.titulo,
            'Ensopado de Peixe Especial',
        )

        self.assertEqual(
            self.receita.autor,
            self.autor,
        )

    def test_outro_usuario_nao_edita_receita(self):
        self.client.force_login(self.outro_usuario)

        resposta = self.client.post(
            self.url_editar,
            self.dados_atualizados,
        )

        self.assertEqual(
            resposta.status_code,
            403,
        )

        self.receita.refresh_from_db()

        self.assertEqual(
            self.receita.titulo,
            'Ensopado de Peixe',
        )

    def test_outro_usuario_nao_exclui_receita(self):
        self.client.force_login(self.outro_usuario)

        resposta = self.client.post(
            self.url_excluir,
        )

        self.assertEqual(
            resposta.status_code,
            403,
        )

        self.assertEqual(
            Receita.objects.count(),
            1,
        )

    def test_administrador_exclui_qualquer_receita(self):
        self.client.force_login(self.administrador)

        resposta = self.client.post(
            self.url_excluir,
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertEqual(
            Receita.objects.count(),
            0,
        )

class TestesPermissoesComentario(TestCase):

    def setUp(self):
        self.autor_receita = User.objects.create_user(
            username='autor_da_receita',
            password='senha123',
        )

        self.autor_comentario = User.objects.create_user(
            username='autor_do_comentario',
            password='senha123',
        )

        self.outro_usuario = User.objects.create_user(
            username='usuario_sem_permissao',
            password='senha123',
        )

        self.administrador = User.objects.create_user(
            username='administrador_comentario',
            password='senha123',
            is_staff=True,
        )

        self.receita = Receita.objects.create(
            titulo='Torta de Mirtilo',
            descricao='Uma torta doce feita com mirtilos.',
            origem='Fazenda',
            ingredientes='1 mirtilo\n1 farinha\n1 açúcar',
            modo_preparo='Misture e asse.',
            autor=self.autor_receita,
        )

        self.comentario = Comentario.objects.create(
            receita=self.receita,
            autor=self.autor_comentario,
            texto='A receita ficou muito boa.',
            nota=5,
        )

        self.url_editar = reverse(
            'editar_comentario',
            kwargs={
                'pk': self.comentario.pk,
            },
        )

        self.url_excluir = reverse(
            'excluir_comentario',
            kwargs={
                'pk': self.comentario.pk,
            },
        )

        self.dados_atualizados = {
            'nota': 4,
            'texto': 'Gostei bastante, mas diminuiria o açúcar.',
        }

    def test_outro_usuario_nao_acessa_edicao_do_comentario(self):
        self.client.force_login(self.outro_usuario)

        resposta = self.client.get(self.url_editar)

        self.assertEqual(
            resposta.status_code,
            403,
        )

    def test_autor_da_receita_nao_edita_comentario_de_outro(self):
        self.client.force_login(self.autor_receita)

        resposta = self.client.get(self.url_editar)

        self.assertEqual(
            resposta.status_code,
            403,
        )

    def test_administrador_acessa_edicao_do_comentario(self):
        self.client.force_login(self.administrador)

        resposta = self.client.get(self.url_editar)

        self.assertEqual(
            resposta.status_code,
            200,
        )

    def test_usuario_deslogado_e_redirecionado_da_edicao(self):
        resposta = self.client.get(self.url_editar)

        destino_esperado = (
            f"{reverse('login')}?next={self.url_editar}"
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertRedirects(
            resposta,
            destino_esperado,
        )

    def test_autor_edita_o_proprio_comentario(self):
        self.client.force_login(self.autor_comentario)

        resposta = self.client.post(
            self.url_editar,
            self.dados_atualizados,
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertRedirects(
            resposta,
            reverse(
                'detalhar_receita',
                kwargs={
                    'pk': self.receita.pk,
                },
            ),
        )

        self.comentario.refresh_from_db()

        self.assertEqual(
            self.comentario.nota,
            4,
        )

        self.assertEqual(
            self.comentario.texto,
            'Gostei bastante, mas diminuiria o açúcar.',
        )


    def test_autor_exclui_o_proprio_comentario(self):
        self.client.force_login(self.autor_comentario)

        resposta = self.client.post(
            self.url_excluir,
        )

        self.assertEqual(
            resposta.status_code,
            302,
        )

        self.assertRedirects(
            resposta,
            reverse(
                'detalhar_receita',
                kwargs={
                    'pk': self.receita.pk,
                },
            ),
        )

        self.assertEqual(
            Comentario.objects.count(),
            0,
        )


class TestesCriacaoComentario(TestCase):

    def setUp(self):
        self.autor_receita = User.objects.create_user(
            username='autor_receita_comentario',
            password='senha123',
        )

        self.usuario = User.objects.create_user(
            username='usuario_comentario',
            password='senha123',
        )

        self.receita = Receita.objects.create(
            titulo='Sopa de Algas',
            descricao='Uma sopa nutritiva preparada com algas.',
            origem='Praia',
            ingredientes='1 alga\n1 porção de água',
            modo_preparo='Misture os ingredientes e cozinhe.',
            autor=self.autor_receita,
        )

        self.url = reverse(
            'criar_comentario',
            kwargs={
                'pk': self.receita.pk,
            },
        )

        self.dados_validos = {
            'nota': 5,
            'texto': 'A receita ficou excelente.',
        }
