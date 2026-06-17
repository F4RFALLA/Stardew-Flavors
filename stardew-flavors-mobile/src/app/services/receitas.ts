import {
  HttpClient,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { AutenticacaoService } from './autenticacao';


export interface Receita {
  id: number;
  titulo: string;
  descricao: string;
  origem: string;
  imagem: string | null;
  imagem_url: string;
  imagem_exibicao: string | null;
  ingredientes: string;
  modo_preparo: string;
  autor: string;
  media_avaliacoes: number;
  total_avaliacoes: number;
  data_publicacao: string;
  data_atualizacao: string;
  favoritada_pelo_usuario: boolean;
}


export interface DadosCriacaoReceita {
  titulo: string;
  descricao: string;
  origem: string;
  imagem_url: string;
  ingredientes: string;
  modo_preparo: string;
}


export interface Comentario {
  id: number;
  receita: number;
  autor: string;
  texto: string;
  nota: number;
  data_publicacao: string;
  data_atualizacao: string;
}


export interface RespostaFavorito {
  receita_id: number;
  favoritada: boolean;
  mensagem: string;
}


@Injectable({
  providedIn: 'root',
})
export class ReceitasService {
  private readonly http = inject(HttpClient);

  private readonly autenticacaoService =
    inject(AutenticacaoService);

  private readonly urlBase =
    'http://127.0.0.1:8000/receitas/api/';

  async listar(
    busca: string = '',
  ): Promise<Receita[]> {
    const cabecalhos =
      await this.criarCabecalhos();

    let parametros = new HttpParams();

    const buscaTratada = busca.trim();

    if (buscaTratada) {
      parametros = parametros.set(
        'buscar',
        buscaTratada,
      );
    }

    return firstValueFrom(
      this.http.get<Receita[]>(
        `${this.urlBase}listar/`,
        {
          headers: cabecalhos,
          params: parametros,
        },
      ),
    );
  }

  async obterPorId(
    id: number,
  ): Promise<Receita> {
    const cabecalhos =
      await this.criarCabecalhos();

    return firstValueFrom(
      this.http.get<Receita>(
        `${this.urlBase}${id}/`,
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async criarReceita(
    dados: DadosCriacaoReceita,
    imagemArquivo: File | null = null,
  ): Promise<Receita> {
    const cabecalhos =
      await this.criarCabecalhos();

    const formulario =
      this.criarFormularioReceita(dados);

    if (imagemArquivo) {
      formulario.append(
        'imagem',
        imagemArquivo,
        imagemArquivo.name,
      );
    } else if (dados.imagem_url) {
      formulario.append(
        'imagem_url',
        dados.imagem_url,
      );
    }

    return firstValueFrom(
      this.http.post<Receita>(
        `${this.urlBase}listar/`,
        formulario,
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async atualizarReceita(
    id: number,
    dados: DadosCriacaoReceita,
    imagemArquivo: File | null = null,
    atualizarImagemUrl = true,
  ): Promise<Receita> {
    const cabecalhos =
      await this.criarCabecalhos();

    const formulario =
      this.criarFormularioReceita(dados);

    if (imagemArquivo) {
      formulario.append(
        'imagem',
        imagemArquivo,
        imagemArquivo.name,
      );

      formulario.append(
        'imagem_url',
        '',
      );
    } else if (atualizarImagemUrl) {
      formulario.append(
        'imagem_url',
        dados.imagem_url,
      );
    }

    return firstValueFrom(
      this.http.patch<Receita>(
        `${this.urlBase}${id}/`,
        formulario,
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async excluirReceita(
    id: number,
  ): Promise<void> {
    const cabecalhos =
      await this.criarCabecalhos();

    await firstValueFrom(
      this.http.delete<void>(
        `${this.urlBase}${id}/`,
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async alternarFavorito(
    id: number,
  ): Promise<RespostaFavorito> {
    const cabecalhos =
      await this.criarCabecalhos();

    return firstValueFrom(
      this.http.post<RespostaFavorito>(
        `${this.urlBase}${id}/favoritar/`,
        {},
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async listarFavoritos(): Promise<Receita[]> {
    const cabecalhos =
      await this.criarCabecalhos();

    return firstValueFrom(
      this.http.get<Receita[]>(
        `${this.urlBase}favoritos/`,
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async listarComentarios(
    receitaId: number,
  ): Promise<Comentario[]> {
    const cabecalhos =
      await this.criarCabecalhos();

    return firstValueFrom(
      this.http.get<Comentario[]>(
        `${this.urlBase}${receitaId}/comentarios/`,
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async criarComentario(
    receitaId: number,
    texto: string,
    nota: number,
  ): Promise<Comentario> {
    const cabecalhos =
      await this.criarCabecalhos();

    return firstValueFrom(
      this.http.post<Comentario>(
        `${this.urlBase}${receitaId}/comentarios/`,
        {
          texto,
          nota,
        },
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async atualizarComentario(
    comentarioId: number,
    texto: string,
    nota: number,
  ): Promise<Comentario> {
    const cabecalhos =
      await this.criarCabecalhos();

    return firstValueFrom(
      this.http.patch<Comentario>(
        `${this.urlBase}comentarios/${comentarioId}/`,
        {
          texto,
          nota,
        },
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  async excluirComentario(
    comentarioId: number,
  ): Promise<void> {
    const cabecalhos =
      await this.criarCabecalhos();

    await firstValueFrom(
      this.http.delete<void>(
        `${this.urlBase}comentarios/${comentarioId}/`,
        {
          headers: cabecalhos,
        },
      ),
    );
  }

  private criarFormularioReceita(
    dados: DadosCriacaoReceita,
  ): FormData {
    const formulario = new FormData();

    formulario.append(
      'titulo',
      dados.titulo,
    );

    formulario.append(
      'descricao',
      dados.descricao,
    );

    formulario.append(
      'origem',
      dados.origem,
    );

    formulario.append(
      'ingredientes',
      dados.ingredientes,
    );

    formulario.append(
      'modo_preparo',
      dados.modo_preparo,
    );

    return formulario;
  }

  private async criarCabecalhos():
    Promise<HttpHeaders> {
    const token =
      await this.autenticacaoService.obterToken();

    let cabecalhos = new HttpHeaders();

    if (token) {
      cabecalhos = cabecalhos.set(
        'Authorization',
        `Token ${token}`,
      );
    }

    return cabecalhos;
  }
}