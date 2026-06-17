import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage-angular';
import { of } from 'rxjs';

import {
  AutenticacaoService,
  RespostaLogin,
} from './autenticacao';


describe('AutenticacaoService', () => {
  let servico: AutenticacaoService;

  let httpMock:
    jasmine.SpyObj<HttpClient>;

  let storageMock:
    jasmine.SpyObj<Storage>;

  beforeEach(() => {
    httpMock =
      jasmine.createSpyObj<HttpClient>(
        'HttpClient',
        [
          'post',
        ],
      );

    storageMock =
      jasmine.createSpyObj<Storage>(
        'Storage',
        [
          'create',
          'get',
          'set',
          'remove',
        ],
      );

    storageMock.create
      .and.resolveTo(
        storageMock,
      );

    storageMock.get
      .and.resolveTo(null);

    storageMock.set
      .and.resolveTo(null);

    storageMock.remove
      .and.resolveTo(null);

    TestBed.configureTestingModule({
      providers: [
        AutenticacaoService,

        {
          provide: HttpClient,
          useValue: httpMock,
        },

        {
          provide: Storage,
          useValue: storageMock,
        },
      ],
    });

    servico =
      TestBed.inject(
        AutenticacaoService,
      );
  });

  it(
    'deve salvar uma sessão de usuário comum',
    async () => {
      const resposta: RespostaLogin = {
        token: 'token-comum',
        usuario_id: 10,
        nome_usuario: 'usuario',
        administrador: false,
      };

      httpMock.post
        .and.returnValue(
          of(resposta),
        );

      const resultado =
        await servico.entrar(
          'usuario',
          'senha123',
        );

      expect(
        httpMock.post,
      ).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/login/',
        {
          username: 'usuario',
          password: 'senha123',
        },
      );

      expect(resultado).toEqual(
        resposta,
      );

      expect(
        storageMock.set,
      ).toHaveBeenCalledWith(
        'token',
        'token-comum',
      );

      expect(
        storageMock.set,
      ).toHaveBeenCalledWith(
        'administrador',
        false,
      );

      expect(
        await servico.estaAutenticado(),
      ).toBeTrue();

      expect(
        await servico.ehAdministrador(),
      ).toBeFalse();

      expect(
        await servico.obterNomeUsuario(),
      ).toBe('usuario');
    },
  );

  it(
    'deve reconhecer e salvar uma sessão de administrador',
    async () => {
      const resposta: RespostaLogin = {
        token: 'token-admin',
        usuario_id: 1,
        nome_usuario: 'admin',
        administrador: true,
      };

      httpMock.post
        .and.returnValue(
          of(resposta),
        );

      await servico.entrar(
        'admin',
        'senha-admin',
      );

      expect(
        storageMock.set,
      ).toHaveBeenCalledWith(
        'administrador',
        true,
      );

      expect(
        await servico.estaAutenticado(),
      ).toBeTrue();

      expect(
        await servico.ehAdministrador(),
      ).toBeTrue();

      expect(
        await servico.obterUsuarioId(),
      ).toBe(1);
    },
  );

  it(
    'deve cadastrar o usuário e salvar a nova sessão',
    async () => {
      const resposta: RespostaLogin = {
        token: 'token-cadastro',
        usuario_id: 20,
        nome_usuario: 'novo_usuario',
        administrador: false,
      };

      httpMock.post
        .and.returnValue(
          of(resposta),
        );

      const resultado =
        await servico.cadastrar(
          'novo_usuario',
          'senha-segura',
          'senha-segura',
        );

      expect(
        httpMock.post,
      ).toHaveBeenCalledWith(
        'http://127.0.0.1:8000/api/cadastro/',
        {
          username:
            'novo_usuario',

          password1:
            'senha-segura',

          password2:
            'senha-segura',
        },
      );

      expect(resultado).toEqual(
        resposta,
      );

      expect(
        storageMock.set,
      ).toHaveBeenCalledWith(
        'nome_usuario',
        'novo_usuario',
      );

      expect(
        storageMock.set,
      ).toHaveBeenCalledWith(
        'administrador',
        false,
      );

      expect(
        await servico.estaAutenticado(),
      ).toBeTrue();
    },
  );

  it(
    'deve apagar os dados ao encerrar a sessão',
    async () => {
      const resposta: RespostaLogin = {
        token: 'token-admin',
        usuario_id: 1,
        nome_usuario: 'admin',
        administrador: true,
      };

      httpMock.post
        .and.returnValue(
          of(resposta),
        );

      await servico.entrar(
        'admin',
        'senha-admin',
      );

      await servico.sair();

      expect(
        storageMock.remove,
      ).toHaveBeenCalledWith(
        'token',
      );

      expect(
        storageMock.remove,
      ).toHaveBeenCalledWith(
        'usuario_id',
      );

      expect(
        storageMock.remove,
      ).toHaveBeenCalledWith(
        'nome_usuario',
      );

      expect(
        storageMock.remove,
      ).toHaveBeenCalledWith(
        'administrador',
      );

      expect(
        await servico.estaAutenticado(),
      ).toBeFalse();

      expect(
        await servico.ehAdministrador(),
      ).toBeFalse();

      expect(
        await servico.obterNomeUsuario(),
      ).toBeNull();
    },
  );
});