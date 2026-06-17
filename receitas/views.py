from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from django.views import View
from django.views.generic import CreateView, DeleteView, DetailView, ListView, UpdateView

from rest_framework import status
from rest_framework.authentication import SessionAuthentication, TokenAuthentication
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated, IsAuthenticatedOrReadOnly, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from .forms import FormularioComentario, FormularioReceita
from .models import Comentario, Favorito, Receita
from .serializers import SerializadorComentario, SerializadorReceita


class PermissaoComentarioMixin(
    LoginRequiredMixin,
    UserPassesTestMixin,
):
    def test_func(self):
        comentario = self.get_object()

        usuario_e_autor = (
            comentario.autor == self.request.user
        )

        usuario_e_administrador = (
            self.request.user.is_staff
        )

        return usuario_e_autor or usuario_e_administrador

    def handle_no_permission(self):
        if not self.request.user.is_authenticated:
            return super().handle_no_permission()

        raise PermissionDenied(
            'Você não tem permissão para alterar este comentário.'
        )

class PermissaoReceitaMixin(
    LoginRequiredMixin,
    UserPassesTestMixin,
):
    def test_func(self):
        receita = self.get_object()

        usuario_e_autor = (
            receita.autor == self.request.user
        )

        usuario_e_administrador = (
            self.request.user.is_staff
        )

        return usuario_e_autor or usuario_e_administrador

    def handle_no_permission(self):
        if not self.request.user.is_authenticated:
            return super().handle_no_permission()

        raise PermissionDenied(
            'Você não tem permissão para alterar esta receita.'
        )
    
class ListarReceitas(ListView):
    model = Receita
    template_name = 'listar_receitas.html'
    context_object_name = 'receitas'

    def get_queryset(self):
        receitas = Receita.objects.select_related('autor').all()

        busca = self.request.GET.get('buscar', '').strip()

        if busca:
            receitas = receitas.filter(
                Q(titulo__icontains=busca)
                | Q(descricao__icontains=busca)
                | Q(origem__icontains=busca)
                | Q(autor__username__icontains=busca)
            )

        return receitas

class DetalharReceita(DetailView):
    model = Receita
    template_name = 'detalhar_receita.html'
    context_object_name = 'receita'

    def get_queryset(self):
        return (
            Receita.objects
            .select_related('autor')
            .prefetch_related('comentarios__autor')
        )

    def get_context_data(self, **kwargs):
        contexto = super().get_context_data(**kwargs)

        contexto['formulario_comentario'] = FormularioComentario()

        if self.request.user.is_authenticated:
            contexto['receita_favoritada'] = Favorito.objects.filter(
                usuario=self.request.user,
                receita=self.object,
            ).exists()
        else:
            contexto['receita_favoritada'] = False

        return contexto

class AlternarFavorito(LoginRequiredMixin, View):
    def post(self, request, pk):
        receita = get_object_or_404(
            Receita,
            pk=pk,
        )

        favorito, foi_criado = Favorito.objects.get_or_create(
            usuario=request.user,
            receita=receita,
        )

        if not foi_criado:
            favorito.delete()

        return redirect(
            'detalhar_receita',
            pk=receita.pk,
        )

class ListarFavoritos(LoginRequiredMixin, ListView):
    model = Receita
    template_name = 'listar_favoritos.html'
    context_object_name = 'receitas'

    def get_queryset(self):
        return (
            Receita.objects
            .filter(
                favoritada_por__usuario=self.request.user,
            )
            .select_related('autor')
            .order_by('-favoritada_por__data_adicao')
        )

class CriarComentario(LoginRequiredMixin, View):
    def post(self, request, pk):
        receita = get_object_or_404(
            Receita.objects
            .select_related('autor')
            .prefetch_related('comentarios__autor'),
            pk=pk,
        )

        formulario = FormularioComentario(request.POST)

        if formulario.is_valid():
            comentario = formulario.save(commit=False)

            comentario.receita = receita
            comentario.autor = request.user

            comentario.save()

            return redirect(
                'detalhar_receita',
                pk=receita.pk,
            )

        contexto = {
            'receita': receita,
            'formulario_comentario': formulario,
        }

        return render(
            request,
            'detalhar_receita.html',
            contexto,
        )
    
class EditarComentario(
    PermissaoComentarioMixin,
    UpdateView,
):
    model = Comentario
    form_class = FormularioComentario
    template_name = 'editar_comentario.html'
    context_object_name = 'comentario'

    def get_success_url(self):
        return reverse(
            'detalhar_receita',
            kwargs={
                'pk': self.object.receita.pk,
            },
        )

class ExcluirComentario(
    PermissaoComentarioMixin,
    DeleteView,
):
    model = Comentario
    template_name = 'confirmar_exclusao_comentario.html'
    context_object_name = 'comentario'

    def get_success_url(self):
        return reverse(
            'detalhar_receita',
            kwargs={
                'pk': self.object.receita.pk,
            },
        )

class CriarReceita(LoginRequiredMixin, CreateView):
    model = Receita
    form_class = FormularioReceita
    template_name = 'nova_receita.html'
    success_url = reverse_lazy('listar_receitas')

    def form_valid(self, form):
        form.instance.autor = self.request.user

        return super().form_valid(form)

class EditarReceita(
    PermissaoReceitaMixin,
    UpdateView,
):
    model = Receita
    form_class = FormularioReceita
    template_name = 'editar_receita.html'
    context_object_name = 'receita'

    def get_success_url(self):
        return reverse(
            'detalhar_receita',
            kwargs={
                'pk': self.object.pk,
            },
        )

class ExcluirReceita(
    PermissaoReceitaMixin,
    DeleteView,
):
    model = Receita
    template_name = 'confirmar_exclusao_receita.html'
    context_object_name = 'receita'
    success_url = reverse_lazy('listar_receitas')

class AutorOuAdministradorAPI(BasePermission):
    message = (
        'Somente o autor da receita ou um administrador '
        'pode realizar esta operação.'
    )

    def has_object_permission(self, request, view, receita):
        if request.method in SAFE_METHODS:
            return True

        usuario_e_autor = (
            receita.autor == request.user
        )

        usuario_e_administrador = (
            request.user.is_staff
        )

        return usuario_e_autor or usuario_e_administrador

class AutorComentarioOuAdministradorAPI(BasePermission):
    message = (
    'Somente o autor do comentário ou um administrador '
    'pode realizar esta operação.'
    )


    def has_object_permission(self, request, view, comentario):
        if request.method in SAFE_METHODS:
            return True

        usuario_e_autor = (
            comentario.autor == request.user
        )

        usuario_e_administrador = (
            request.user.is_staff
        )

        return usuario_e_autor or usuario_e_administrador



class APIListarReceitas(ListCreateAPIView):
    serializer_class = SerializadorReceita

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticatedOrReadOnly,
    ]

    parser_classes = [
        JSONParser,
        FormParser,
        MultiPartParser,
    ]

    def get_queryset(self):
        receitas = (
            Receita.objects
            .select_related('autor')
            .all()
        )

        buscar = self.request.query_params.get(
            'buscar'
        )

        if buscar:
            receitas = receitas.filter(
                Q(titulo__icontains=buscar)
                | Q(descricao__icontains=buscar)
                | Q(origem__icontains=buscar)
                | Q(autor__username__icontains=buscar)
            )

        return receitas

    def perform_create(self, serializer):
        serializer.save(
            autor=self.request.user
        )

class APIDetalharReceita(
    RetrieveUpdateDestroyAPIView
):
    serializer_class = SerializadorReceita

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticatedOrReadOnly,
        AutorOuAdministradorAPI,
    ]

    parser_classes = [
        JSONParser,
        FormParser,
        MultiPartParser,
    ]

    def get_queryset(self):
        return (
            Receita.objects
            .select_related('autor')
            .all()
        )
    
class APIListarCriarComentarios(ListCreateAPIView):
    serializer_class = SerializadorComentario


    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticatedOrReadOnly,
    ]

    parser_classes = [
        JSONParser,
        FormParser,
    ]

    def get_queryset(self):
        return (
            Comentario.objects
            .filter(
                receita_id=self.kwargs['receita_pk']
            )
            .select_related(
                'autor',
                'receita',
            )
        )

    def perform_create(self, serializer):
        receita = get_object_or_404(
            Receita,
            pk=self.kwargs['receita_pk'],
        )

        serializer.save(
            receita=receita,
            autor=self.request.user,
        )


class APIDetalharComentario(
    RetrieveUpdateDestroyAPIView
    ):
    serializer_class = SerializadorComentario


    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticatedOrReadOnly,
        AutorComentarioOuAdministradorAPI,
    ]

    parser_classes = [
        JSONParser,
        FormParser,
    ]

    def get_queryset(self):
        return (
            Comentario.objects
            .select_related(
                'autor',
                'receita',
            )
            .all()
        )

class APIListarFavoritos(ListAPIView):
    serializer_class = SerializadorReceita

    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            Receita.objects
            .filter(
                favoritada_por__usuario=self.request.user,
            )
            .select_related('autor')
            .order_by(
                '-favoritada_por__data_adicao'
            )
        )


class APIAlternarFavorito(APIView):
    authentication_classes = [
        TokenAuthentication,
        SessionAuthentication,
    ]

    permission_classes = [
        IsAuthenticated,
    ]

    def post(self, request, pk):
        receita = get_object_or_404(
            Receita,
            pk=pk,
        )

        favorito, foi_criado = Favorito.objects.get_or_create(
            usuario=request.user,
            receita=receita,
        )

        if foi_criado:
            return Response(
                {
                    'receita_id': receita.pk,
                    'favoritada': True,
                    'mensagem': (
                        'Receita adicionada aos favoritos.'
                    ),
                },
                status=status.HTTP_201_CREATED,
            )

        favorito.delete()

        return Response(
            {
                'receita_id': receita.pk,
                'favoritada': False,
                'mensagem': (
                    'Receita removida dos favoritos.'
                ),
            },
            status=status.HTTP_200_OK,
        )