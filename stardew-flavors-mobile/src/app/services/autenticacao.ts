import { HttpClient } from '@angular/common/http';
import {
  inject,
  Injectable,
} from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import {
  BehaviorSubject,
  firstValueFrom,
} from 'rxjs';


export interface RespostaLogin {
  token: string;
  usuario_id: number;
  nome_usuario: string;
  administrador: boolean;
}


export interface EstadoSessao {
  autenticado: boolean;
  usuarioId: number | null;
  nomeUsuario: string | null;
  administrador: boolean;
}


@Injectable({
  providedIn: 'root',
})
export class AutenticacaoService {
  private readonly http =
    inject(HttpClient);

  private readonly storage =
    inject(Storage);

  private readonly urlLogin =
    'http://127.0.0.1:8000/api/login/';

  private readonly urlCadastro =
    'http://127.0.0.1:8000/api/cadastro/';

  private readonly armazenamentoPronto =
    this.storage.create();

  private readonly estadoSessaoSubject =
    new BehaviorSubject<EstadoSessao>({
      autenticado: false,
      usuarioId: null,
      nomeUsuario: null,
      administrador: false,
    });

  readonly estadoSessao$ =
    this.estadoSessaoSubject.asObservable();

  private readonly inicializacao =
    this.carregarSessaoSalva();

  private async carregarSessaoSalva():
    Promise<void> {
    await this.armazenamentoPronto;

    const [
      token,
      usuarioId,
      nomeUsuario,
      administrador,
    ] = await Promise.all([
      this.storage.get('token'),
      this.storage.get('usuario_id'),
      this.storage.get('nome_usuario'),
      this.storage.get('administrador'),
    ]);

    this.estadoSessaoSubject.next({
      autenticado: Boolean(token),

      usuarioId:
        typeof usuarioId === 'number'
          ? usuarioId
          : null,

      nomeUsuario:
        typeof nomeUsuario === 'string'
          ? nomeUsuario
          : null,

      administrador:
        administrador === true,
    });
  }

  async entrar(
    nomeUsuario: string,
    senha: string,
  ): Promise<RespostaLogin> {
    const resposta =
      await firstValueFrom(
        this.http.post<RespostaLogin>(
          this.urlLogin,
          {
            username: nomeUsuario,
            password: senha,
          },
        ),
      );

    await this.salvarSessao(
      resposta,
    );

    return resposta;
  }

  async cadastrar(
    nomeUsuario: string,
    senha: string,
    confirmacaoSenha: string,
  ): Promise<RespostaLogin> {
    const resposta =
      await firstValueFrom(
        this.http.post<RespostaLogin>(
          this.urlCadastro,
          {
            username: nomeUsuario,
            password1: senha,
            password2: confirmacaoSenha,
          },
        ),
      );

    await this.salvarSessao(
      resposta,
    );

    return resposta;
  }

  async obterToken():
    Promise<string | null> {
    await this.inicializacao;

    const token =
      await this.storage.get('token');

    return typeof token === 'string'
      ? token
      : null;
  }

  async obterUsuarioId():
    Promise<number | null> {
    await this.inicializacao;

    return this.estadoSessaoSubject
      .value
      .usuarioId;
  }

  async obterNomeUsuario():
    Promise<string | null> {
    await this.inicializacao;

    return this.estadoSessaoSubject
      .value
      .nomeUsuario;
  }

  async ehAdministrador():
    Promise<boolean> {
    await this.inicializacao;

    return this.estadoSessaoSubject
      .value
      .administrador;
  }

  async estaAutenticado():
    Promise<boolean> {
    await this.inicializacao;

    return this.estadoSessaoSubject
      .value
      .autenticado;
  }

  async sair(): Promise<void> {
    await this.inicializacao;

    await Promise.all([
      this.storage.remove('token'),
      this.storage.remove('usuario_id'),
      this.storage.remove('nome_usuario'),
      this.storage.remove('administrador'),
    ]);

    this.estadoSessaoSubject.next({
      autenticado: false,
      usuarioId: null,
      nomeUsuario: null,
      administrador: false,
    });
  }

  private async salvarSessao(
    resposta: RespostaLogin,
  ): Promise<void> {
    await this.inicializacao;

    await Promise.all([
      this.storage.set(
        'token',
        resposta.token,
      ),

      this.storage.set(
        'usuario_id',
        resposta.usuario_id,
      ),

      this.storage.set(
        'nome_usuario',
        resposta.nome_usuario,
      ),

      this.storage.set(
        'administrador',
        resposta.administrador,
      ),
    ]);

    this.estadoSessaoSubject.next({
      autenticado: true,
      usuarioId: resposta.usuario_id,
      nomeUsuario: resposta.nome_usuario,
      administrador:
        resposta.administrador,
    });
  }
}