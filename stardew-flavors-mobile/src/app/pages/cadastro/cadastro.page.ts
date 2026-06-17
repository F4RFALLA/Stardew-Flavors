import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Router,
  RouterLink,
} from '@angular/router';
import {
  IonContent,
  IonSpinner,
} from '@ionic/angular/standalone';

import {
  CabecalhoComponent,
} from '../../components/cabecalho/cabecalho.component';

import {
  AutenticacaoService,
} from '../../services/autenticacao';


@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonSpinner,
    CabecalhoComponent,
  ],
})
export class CadastroPage {
  private readonly autenticacaoService =
    inject(AutenticacaoService);

  private readonly router =
    inject(Router);

  nomeUsuario = '';
  senha = '';
  confirmacaoSenha = '';

  carregando = false;
  mensagemErro = '';

  async ionViewWillEnter():
    Promise<void> {
    const autenticado =
      await this.autenticacaoService
        .estaAutenticado();

    if (autenticado) {
      await this.router.navigateByUrl(
        '/home',
        {
          replaceUrl: true,
        },
      );
    }
  }

  async cadastrar(): Promise<void> {
    if (this.carregando) {
      return;
    }

    this.mensagemErro = '';

    const nomeUsuario =
      this.nomeUsuario.trim();

    if (
      !nomeUsuario
      || !this.senha
      || !this.confirmacaoSenha
    ) {
      this.mensagemErro =
        'Preencha todos os campos.';

      return;
    }

    if (
      this.senha
      !== this.confirmacaoSenha
    ) {
      this.mensagemErro =
        'As senhas informadas são diferentes.';

      return;
    }

    if (this.senha.length < 8) {
      this.mensagemErro =
        'A senha deve possuir pelo menos 8 caracteres.';

      return;
    }

    this.carregando = true;

    try {
      await this.autenticacaoService
        .cadastrar(
          nomeUsuario,
          this.senha,
          this.confirmacaoSenha,
        );

      await this.router.navigateByUrl(
        '/home',
        {
          replaceUrl: true,
        },
      );
    } catch (erro: unknown) {
      if (
        erro instanceof HttpErrorResponse
        && erro.status === 400
      ) {
        this.mensagemErro =
          this.extrairMensagemErro(
            erro.error,
          );
      } else if (
        erro instanceof HttpErrorResponse
        && erro.status === 0
      ) {
        this.mensagemErro =
          'Não foi possível conectar ao servidor Django.';
      } else {
        this.mensagemErro =
          'Não foi possível criar a conta.';
      }
    } finally {
      this.carregando = false;
    }
  }

  private extrairMensagemErro(
    resposta: unknown,
  ): string {
    if (
      !resposta
      || typeof resposta !== 'object'
    ) {
      return (
        'Confira os dados informados.'
      );
    }

    const mensagens: string[] = [];

    for (
      const valor
      of Object.values(
        resposta as Record<
          string,
          unknown
        >,
      )
    ) {
      if (Array.isArray(valor)) {
        for (const item of valor) {
          if (typeof item === 'string') {
            mensagens.push(item);
          } else if (
            item
            && typeof item === 'object'
            && 'message' in item
          ) {
            mensagens.push(
              String(
                (
                  item as {
                    message: unknown;
                  }
                ).message,
              ),
            );
          }
        }
      } else if (
        typeof valor === 'string'
      ) {
        mensagens.push(valor);
      }
    }

    return mensagens.length > 0
      ? mensagens.join(' ')
      : 'Confira os dados informados.';
  }
}