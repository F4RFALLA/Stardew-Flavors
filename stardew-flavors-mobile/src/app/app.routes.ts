import { Routes } from '@angular/router';


export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./home/home.page')
        .then((m) => m.HomePage),
  },

  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page')
        .then((m) => m.LoginPage),
  },

  {
    path: 'cadastro',
    loadComponent: () =>
      import(
        './pages/cadastro/cadastro.page'
      ).then((m) => m.CadastroPage),
  },

  {
    path: 'favoritos',
    loadComponent: () =>
      import(
        './pages/favoritos/favoritos.page'
      ).then((m) => m.FavoritosPage),
  },

  {
    path: 'receitas/criar',
    loadComponent: () =>
      import(
        './pages/criar-receita/criar-receita.page'
      ).then((m) => m.CriarReceitaPage),
  },

  {
    path: 'receitas/:id/editar',
    loadComponent: () =>
      import(
        './pages/editar-receita/editar-receita.page'
      ).then((m) => m.EditarReceitaPage),
  },

  {
    path: 'receitas/:id',
    loadComponent: () =>
      import(
        './pages/detalhes-receita/detalhes-receita.page'
      ).then((m) => m.DetalhesReceitaPage),
  },

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'home',
  },
];