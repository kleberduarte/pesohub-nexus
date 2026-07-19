using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Reflection;
using System.Threading;
using Toledo.Componentes.Eventos;
using Toledo.MGV7.Comunicacao.Balancas;
using Toledo.MGV7.Comunicacao.Handlers;
using Toledo.MGV7.Comuns.Enums;
using Toledo.MGV7.Comuns.TOs;

/// <summary>
/// Driver standalone para comunicação com balanças Toledo Prix via MGV7.
/// Usa as DLLs oficiais da Toledo (não redistribuídas neste repositório — ver
/// agent-local/prix-driver/lib/README.md) através do mesmo fluxo validado
/// manualmente em docs/prix-toledo-investigation.md.
///
/// Uso:
///   PrixDriver.exe atualizar-preco --loja 0001 --codigo-balanca 1 --codigo-item 1
///                                   --preco 18.00 [--nome "Queijo"] [--timeout-ms 30000]
///
/// Saída: uma linha JSON em stdout ({"ok":true,...} ou {"ok":false,"erro":"..."}).
/// Exit code: 0 em sucesso, 1 em falha.
/// </summary>
class Program
{
    static int Main(string[] args)
    {
        try
        {
            if (args.Length == 0 || args[0] != "atualizar-preco")
            {
                Console.Error.WriteLine("Uso: PrixDriver.exe atualizar-preco --loja 0001 --codigo-balanca 1 --codigo-item 1 --preco 18.00 [--nome \"...\"] [--timeout-ms 30000]");
                return 2;
            }

            var opts = ParseArgs(args.Skip(1).ToArray());
            string loja = Require(opts, "loja");
            int codigoBalanca = int.Parse(Require(opts, "codigo-balanca"));
            int codigoItem = int.Parse(Require(opts, "codigo-item"));
            decimal preco = decimal.Parse(Require(opts, "preco"), System.Globalization.CultureInfo.InvariantCulture);
            string nome = opts.ContainsKey("nome") ? opts["nome"] : null;
            int timeoutMs = opts.ContainsKey("timeout-ms") ? int.Parse(opts["timeout-ms"]) : 30000;

            var resultado = AtualizarPreco(loja, codigoBalanca, codigoItem, preco, nome, timeoutMs);
            Console.WriteLine(resultado.ToJson());
            return resultado.Ok ? 0 : 1;
        }
        catch (Exception ex)
        {
            Console.WriteLine(new Resultado { Ok = false, Erro = ex.Message }.ToJson());
            return 1;
        }
    }

    static Resultado AtualizarPreco(string loja, int codigoBalanca, int codigoItem, decimal preco, string nome, int timeoutMs)
    {
        var sw = System.Diagnostics.Stopwatch.StartNew();

        // 1. Le dados da balanca e atualiza o preco no banco do MGV7 (fonte da
        //    verdade que o driver oficial le durante a transmissao).
        string connString = string.Format(@"Server=localhost\SQL_MGV7;Database=MGV7_{0};Integrated Security=True;TrustServerCertificate=True;", loja);
        string ip;
        int porta, tipoBalancaCodigo;

        using (var conn = new SqlConnection(connString))
        {
            conn.Open();

            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = "SELECT BAL_ENDERECO_IP, BAL_PORTA_COMUNICACAO, TPB_CODIGO FROM tbBalanca WHERE BAL_CODIGO = @cod";
                cmd.Parameters.AddWithValue("@cod", codigoBalanca);
                using (var r = cmd.ExecuteReader())
                {
                    if (!r.Read()) throw new Exception(string.Format("Balanca {0} nao encontrada em MGV7_{1}.tbBalanca", codigoBalanca, loja));
                    ip = r.GetString(0);
                    porta = r.GetInt32(1);
                    tipoBalancaCodigo = r.GetInt32(2);
                }
            }

            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = nome != null
                    ? "UPDATE tbItens SET ITN_PRECO = @preco, ITN_DESCRITIVO = @nome WHERE ITN_CODIGO = @cod"
                    : "UPDATE tbItens SET ITN_PRECO = @preco WHERE ITN_CODIGO = @cod";
                cmd.Parameters.AddWithValue("@preco", preco);
                if (nome != null) cmd.Parameters.AddWithValue("@nome", nome);
                cmd.Parameters.AddWithValue("@cod", codigoItem);
                int rows = cmd.ExecuteNonQuery();
                if (rows == 0) throw new Exception(string.Format("Item {0} nao encontrado em MGV7_{1}.tbItens", codigoItem, loja));
            }

            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    IF EXISTS (SELECT 1 FROM tbItemBalanca WHERE BAL_CODIGO = @bal AND ITN_CODIGO = @item)
                        UPDATE tbItemBalanca SET ITB_ESTADO = 2, ITB_DATA = GETDATE() WHERE BAL_CODIGO = @bal AND ITN_CODIGO = @item
                    ELSE
                        INSERT INTO tbItemBalanca (BAL_CODIGO, ITN_CODIGO, ITB_ESTADO, ITB_MANUAL, ITB_DATA)
                        VALUES (@bal, @item, 2, 0, GETDATE())";
                cmd.Parameters.AddWithValue("@bal", codigoBalanca);
                cmd.Parameters.AddWithValue("@item", codigoItem);
                cmd.ExecuteNonQuery();
            }
        }

        // 2. Dispara a transmissao real via driver oficial da Toledo.
        object gerenciador = Activator.CreateInstance(
            typeof(BalancaPrix).Assembly.GetType("Toledo.MGV7.Comunicacao.GerenciadorRede"), nonPublic: true);

        var fabrica = FabricaBalanca.Instancia;
        var criaBalanca = fabrica.GetType().GetMethod("CriaBalanca");
        BalancaPrix balanca = (BalancaPrix)criaBalanca.Invoke(fabrica, new object[]
        {
            codigoBalanca, MeioComunicacaoEnum.Ethernet, ip, porta, "",
            gerenciador, (TipoBalancaEnum)tipoBalancaCodigo, false, null, int.Parse(loja),
        });
        var balType = balanca.GetType();

        var done = new ManualResetEvent(false);
        bool sucesso = false;
        string falhaMsg = null;

        AtualizacaoComunicacaoHandler hSucesso = (s, e) => { sucesso = true; done.Set(); };
        AtualizacaoComunicacaoHandler hFalha = (s, e) => { falhaMsg = "Falha reportada pela balanca durante a comunicacao."; done.Set(); };
        FindEvent(balType, "OnSucessoTransmissao").AddEventHandler(balanca, hSucesso);
        FindEvent(balType, "OnFalhaComunicacao").AddEventHandler(balanca, hFalha);
        FindEvent(balType, "onAutorizaComunicacao").AddEventHandler(balanca,
            (EventHandler<EventoPadrao>)((s, e) => e.Arg5 = true));
        FindEvent(balType, "onSelecaoDadosTransmissao").AddEventHandler(balanca,
            (EventHandler<EventoBoolean>)((s, e) => e.Valor = true));

        Type ebType = typeof(BalancaPrix).Assembly.GetType("Toledo.MGV7.Comunicacao.Handlers.EstadoBalanca");
        object estadoBalanca = Activator.CreateInstance(ebType, nonPublic: true);
        ebType.GetProperty("Balanca").SetValue(estadoBalanca, codigoBalanca);
        balType.GetProperty("InformacoesBalanca").SetValue(balanca, estadoBalanca);

        Type cfgType = typeof(ItemBalancaTO).Assembly.GetType("Toledo.MGV7.Comuns.TOs.ConfiguracaoComunicacaoTO");
        balType.GetProperty("ConfiguracaoComunicacao").SetValue(balanca, Activator.CreateInstance(cfgType, nonPublic: true));

        balType.GetProperty("CodigoDaLoja").SetValue(balanca, int.Parse(loja));
        balType.GetProperty("Codigo").SetValue(balanca, codigoBalanca);

        if (!balanca.Inicializa()) throw new Exception("Falha ao inicializar driver da balanca.");
        if (!balanca.AbreComunicacao()) throw new Exception(string.Format("Falha ao abrir conexao TCP com {0}:{1}.", ip, porta));

        try
        {
            balanca.DadosParaCarga = new List<ItemBalancaTO> {
                new ItemBalancaTO {
                    CodigoBalanca = codigoBalanca, CodigoItem = codigoItem,
                    Estado = (EstadoItemBalancaEnum)2, Manual = false, Codigo = codigoItem.ToString(),
                }
            };

            balType.GetMethod("TxPedidoNCarga", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(balanca, null);
            balType.GetMethod("IniciaThread", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(balanca, new object[] { int.Parse(loja), false });

            bool sinalizado = done.WaitOne(timeoutMs);

            if (!sinalizado)
                return new Resultado { Ok = false, Erro = "Timeout esperando confirmação da balança.", ElapsedMs = sw.ElapsedMilliseconds };
            if (!sucesso)
                return new Resultado { Ok = false, Erro = falhaMsg ?? "Falha desconhecida na comunicação.", ElapsedMs = sw.ElapsedMilliseconds };

            return new Resultado { Ok = true, ElapsedMs = sw.ElapsedMilliseconds };
        }
        finally
        {
            balType.GetMethod("FechaComunicacao", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(balanca, null);
        }
    }

    static EventInfo FindEvent(Type t, string name)
    {
        while (t != null)
        {
            var ev = t.GetEvent(name, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            if (ev != null) return ev;
            t = t.BaseType;
        }
        throw new Exception("Evento não encontrado: " + name);
    }

    static Dictionary<string, string> ParseArgs(string[] args)
    {
        var result = new Dictionary<string, string>();
        for (int i = 0; i < args.Length; i++)
        {
            if (!args[i].StartsWith("--")) continue;
            string key = args[i].Substring(2);
            string value = (i + 1 < args.Length && !args[i + 1].StartsWith("--")) ? args[++i] : "true";
            result[key] = value;
        }
        return result;
    }

    static string Require(Dictionary<string, string> opts, string key)
    {
        if (!opts.ContainsKey(key)) throw new Exception("Parametro obrigatorio ausente: --" + key);
        return opts[key];
    }
}

class Resultado
{
    public bool Ok;
    public string Erro;
    public long ElapsedMs;

    public string ToJson()
    {
        var erro = Erro != null ? "\"" + Erro.Replace("\\", "\\\\").Replace("\"", "\\\"") + "\"" : "null";
        return "{\"ok\":" + (Ok ? "true" : "false") + ",\"erro\":" + erro + ",\"elapsedMs\":" + ElapsedMs + "}";
    }
}
