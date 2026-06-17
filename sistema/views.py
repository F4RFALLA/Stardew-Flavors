from django.contrib.auth import (
    authenticate,
    login,
    logout,
)
from django.contrib.auth.forms import UserCreationForm
from django.shortcuts import redirect, render
from django.views.generic import View

from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.parsers import FormParser, JSONParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class Login(View):
    def get(self, request):
        contexto = {
            'mensagem': '',
        }

        if request.user.is_authenticated:
            return redirect('home')

        return render(
            request,
            'autenticacao.html',
            contexto,
        )

    def post(self, request):
        usuario = request.POST.get(
            'user',
            '',
        ).strip()

        senha = request.POST.get(
            'password',
            '',
        )

        user = authenticate(
            request,
            username=usuario,
            password=senha,
        )

        if user is not None:
            if user.is_active:
                login(
                    request,
                    user,
                )

                return redirect('home')

            contexto = {
                'mensagem': 'Usuário inativo.',
                'usuario_digitado': usuario,
            }

            return render(
                request,
                'autenticacao.html',
                contexto,
            )

        contexto = {
            'mensagem': (
                'Nome de usuário ou senha inválidos.'
            ),
            'usuario_digitado': usuario,
        }

        return render(
            request,
            'autenticacao.html',
            contexto,
        )


class LoginAPI(ObtainAuthToken):
    def post(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializador = self.serializer_class(
            data=request.data,
            context={
                'request': request,
            },
        )

        serializador.is_valid(
            raise_exception=True,
        )

        usuario = serializador.validated_data[
            'user'
        ]

        token, _ = Token.objects.get_or_create(
            user=usuario,
        )

        return Response(
            {
                'token': token.key,
                'usuario_id': usuario.pk,
                'nome_usuario': usuario.username,
                'administrador': usuario.is_staff,
            },
            status=status.HTTP_200_OK,
        )


class CadastroAPI(APIView):
    authentication_classes = []

    permission_classes = [
        AllowAny,
    ]

    parser_classes = [
        JSONParser,
        FormParser,
    ]

    def post(self, request):
        nome_usuario = str(
            request.data.get(
                'username',
                '',
            ),
        ).strip()

        senha = str(
            request.data.get(
                'password1',
                '',
            ),
        )

        confirmacao_senha = str(
            request.data.get(
                'password2',
                '',
            ),
        )

        formulario = UserCreationForm(
            {
                'username': nome_usuario,
                'password1': senha,
                'password2': confirmacao_senha,
            },
        )

        if not formulario.is_valid():
            erros = {}

            for campo, lista_erros in (
                formulario.errors
                .get_json_data()
                .items()
            ):
                erros[campo] = [
                    erro['message']
                    for erro in lista_erros
                ]

            return Response(
                erros,
                status=status.HTTP_400_BAD_REQUEST,
            )

        usuario = formulario.save(
            commit=False,
        )

        # Usuários cadastrados pelo aplicativo
        # sempre serão usuários comuns.
        usuario.is_staff = False
        usuario.is_superuser = False

        usuario.save()

        token, _ = Token.objects.get_or_create(
            user=usuario,
        )

        return Response(
            {
                'token': token.key,
                'usuario_id': usuario.pk,
                'nome_usuario': usuario.username,
                'administrador': False,
            },
            status=status.HTTP_201_CREATED,
        )


class Cadastro(View):
    def get(self, request):
        if request.user.is_authenticated:
            return redirect('home')

        formulario = UserCreationForm()

        return render(
            request,
            'cadastro.html',
            {
                'formulario': formulario,
            },
        )

    def post(self, request):
        formulario = UserCreationForm(
            request.POST,
        )

        if formulario.is_valid():
            usuario = formulario.save()

            login(
                request,
                usuario,
            )

            return redirect('home')

        return render(
            request,
            'cadastro.html',
            {
                'formulario': formulario,
            },
        )


class Logout(View):
    def get(self, request):
        logout(request)

        return redirect('home')


class Home(View):
    def get(self, request):
        return redirect(
            'listar_receitas',
        )