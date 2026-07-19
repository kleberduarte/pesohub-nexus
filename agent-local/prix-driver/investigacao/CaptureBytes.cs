using System;
using System.Reflection;
using System.Collections.Generic;
using System.Threading;
using System.Linq;
using Toledo.MGV7.Comunicacao.Balancas;
using Toledo.MGV7.Comuns.Enums;
using Toledo.MGV7.Comuns.TOs;
using Toledo.MGV7.Comunicacao.Handlers;
using Toledo.Componentes.Eventos;

class CaptureBytes
{
    static ManualResetEvent done = new ManualResetEvent(false);
    static bool sucesso = false;

    static void Main(string[] args)
    {
        try
        {
            var fabrica = FabricaBalanca.Instancia;

            Assembly comuni = typeof(BalancaPrix).Assembly;
            Type grType = comuni.GetType("Toledo.MGV7.Comunicacao.GerenciadorRede");
            object gerenciador = Activator.CreateInstance(grType, nonPublic: true);

            var criaBalanca = fabrica.GetType().GetMethod("CriaBalanca");
            object balancaObj = criaBalanca.Invoke(fabrica, new object[]
            {
                1, MeioComunicacaoEnum.Ethernet, "10.10.40.37", 9000, "",
                gerenciador, TipoBalancaEnum.Prix5V89, false, null, 1
            });
            BalancaPrix balanca = (BalancaPrix)balancaObj;
            var balType = balanca.GetType();

            // --- hooks de captura de bytes crus (Periferico) ---
            Assembly comp = Assembly.LoadFrom(@"TBR.Componentes.dll");
            Type periType = comp.GetType("Toledo.Componentes.Periferico");
            Type argsType = comp.GetType("Toledo.Componentes.DadosProtocoloEventArgs");
            Type handlerType = comp.GetType("Toledo.Componentes.DadosProtocoloEventHandler");
            PropertyInfo dadoProp = argsType.GetProperty("Dado");

            HookByteEvent(periType, balanca, handlerType, dadoProp, "OnEnvioMensagem", "ENVIADO");
            HookByteEvent(periType, balanca, handlerType, dadoProp, "OnDadosProntos", "RECEBIDO");
            HookByteEvent(periType, balanca, handlerType, dadoProp, "onDadoEnviado", "onDadoEnviado");

            // --- hooks de alto nivel (progresso/log) ---
            EventInfo evSucesso = FindEvent(balType, "OnSucessoTransmissao");
            EventInfo evFalha = FindEvent(balType, "OnFalhaComunicacao");
            EventInfo evAutoriza = FindEvent(balType, "onAutorizaComunicacao");
            EventInfo evSelecao = FindEvent(balType, "onSelecaoDadosTransmissao");
            EventInfo evDebug = FindEvent(balType, "OnDebugMsg");

            AtualizacaoComunicacaoHandler hSucesso = (s, e) => { Console.WriteLine("[EVENTO] OnSucessoTransmissao!"); sucesso = true; done.Set(); };
            AtualizacaoComunicacaoHandler hFalha = (s, e) => { Console.WriteLine("[EVENTO] OnFalhaComunicacao!"); done.Set(); };
            EventHandler<EventoPadrao> hAutoriza = (s, e) => { e.Arg5 = true; };
            EventHandler<EventoBoolean> hSelecao = (s, e) => { e.Valor = true; };
            DebugHandler hDebug = (s, e) => { Console.WriteLine("[DEBUG] " + Dump(e)); };

            evSucesso.AddEventHandler(balanca, hSucesso);
            evFalha.AddEventHandler(balanca, hFalha);
            if (evAutoriza != null) evAutoriza.AddEventHandler(balanca, hAutoriza);
            if (evSelecao != null) evSelecao.AddEventHandler(balanca, hSelecao);
            if (evDebug != null) evDebug.AddEventHandler(balanca, hDebug);

            Type ebType = comuni.GetType("Toledo.MGV7.Comunicacao.Handlers.EstadoBalanca");
            object estadoBalanca = Activator.CreateInstance(ebType, nonPublic: true);
            ebType.GetProperty("Balanca").SetValue(estadoBalanca, 1);
            balType.GetProperty("InformacoesBalanca").SetValue(balanca, estadoBalanca);

            Assembly comuns = Assembly.LoadFrom(@"TBR.MGV.Comuns.dll");
            Type cfgType = comuns.GetType("Toledo.MGV7.Comuns.TOs.ConfiguracaoComunicacaoTO");
            balType.GetProperty("ConfiguracaoComunicacao").SetValue(balanca, Activator.CreateInstance(cfgType, nonPublic: true));

            balType.GetProperty("CodigoDaLoja").SetValue(balanca, 1);
            balType.GetProperty("Codigo").SetValue(balanca, 1);

            Console.WriteLine("Inicializa() = " + balanca.Inicializa());
            Console.WriteLine("AbreComunicacao() = " + balanca.AbreComunicacao());

            // depois de abrir comunicacao, tenta hookar tambem o protocolo real (PPrix)
            HookPPrixIfPresent(balanca, comp);

            var item = new ItemBalancaTO
            {
                CodigoBalanca = 1,
                CodigoItem = 1,
                Estado = (EstadoItemBalancaEnum)2,
                Manual = false,
                Codigo = "1",
            };
            balanca.DadosParaCarga = new List<ItemBalancaTO> { item };

            balType.GetMethod("TxPedidoNCarga", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(balanca, null);
            balType.GetMethod("IniciaThread", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(balanca, new object[] { 1, false });

            Console.WriteLine("Aguardando evento de conclusao (ate 30s)...");
            bool sinalizado = done.WaitOne(30000);
            Console.WriteLine("Sinalizado=" + sinalizado + " Sucesso=" + sucesso);

            balType.GetMethod("FechaComunicacao", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance)
                .Invoke(balanca, null);
            Console.WriteLine("Fechado.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERRO: " + ex);
        }
    }

    static void HookByteEvent(Type periType, object balanca, Type handlerType, PropertyInfo dadoProp, string eventName, string label)
    {
        EventInfo ev = periType.GetEvent(eventName, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
        if (ev == null) { Console.WriteLine("[!] evento nao encontrado: " + eventName); return; }

        Delegate handler = CreateByteHandler(handlerType, dadoProp, label);
        ev.AddEventHandler(balanca, handler);
    }

    static Delegate CreateByteHandler(Type handlerType, PropertyInfo dadoProp, string label)
    {
        Action<object, object> logic = (sender, e) =>
        {
            try
            {
                byte[] dado = (byte[])dadoProp.GetValue(e);
                Console.WriteLine("[BYTES " + label + "] (" + (dado != null ? dado.Length : 0) + " bytes) " + HexDump(dado));
            }
            catch (Exception ex)
            {
                Console.WriteLine("[BYTES " + label + "] erro ao ler: " + ex.Message);
            }
        };
        MethodInfo invokeMethod = logic.Method;
        return Delegate.CreateDelegate(handlerType, logic.Target, invokeMethod);
    }

    static void HookPPrixIfPresent(object balanca, Assembly comp)
    {
        try
        {
            Type periType = comp.GetType("Toledo.Componentes.Periferico");
            FieldInfo protoField = periType.GetField("_protocoloComunicacao", BindingFlags.NonPublic | BindingFlags.Instance);
            if (protoField == null) { Console.WriteLine("[!] campo _protocoloComunicacao nao encontrado"); return; }
            object proto = protoField.GetValue(balanca);
            if (proto == null) { Console.WriteLine("[!] _protocoloComunicacao ainda nulo neste ponto"); return; }
            Console.WriteLine("[*] Protocolo real em uso: " + proto.GetType().FullName);

            if (proto.GetType().FullName == "Toledo.Componentes.PPrix")
            {
                Type pprixType = proto.GetType();
                EventInfo evProntos = pprixType.GetEvent("OnDadosPPrixProntos", BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                if (evProntos != null)
                {
                    Type handlerType = evProntos.EventHandlerType;
                    Type argsType = comp.GetType("Toledo.Componentes.DadosProntosPPrixEventArgs");
                    Action<object, object> logic = (s, e) =>
                    {
                        try
                        {
                            byte opcode = (byte)argsType.GetProperty("Opcode").GetValue(e);
                            byte[] msg = (byte[])argsType.GetProperty("Mensagem").GetValue(e);
                            byte[] raw = (byte[])argsType.GetProperty("RawData").GetValue(e);
                            Console.WriteLine("[PPrix DadosProntos] Opcode=0x" + opcode.ToString("x2") +
                                " Mensagem(" + (msg != null ? msg.Length : 0) + ")=" + HexDump(msg) +
                                " Raw(" + (raw != null ? raw.Length : 0) + ")=" + HexDump(raw));
                        }
                        catch (Exception ex) { Console.WriteLine("[PPrix DadosProntos] erro: " + ex.Message); }
                    };
                    evProntos.AddEventHandler(proto, Delegate.CreateDelegate(handlerType, logic.Target, logic.Method));
                    Console.WriteLine("[*] hook OnDadosPPrixProntos instalado.");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("[!] HookPPrixIfPresent erro: " + ex);
        }
    }

    static string HexDump(byte[] b)
    {
        if (b == null) return "<null>";
        return string.Join(":", b.Select(x => x.ToString("x2")));
    }

    static string Dump(object e)
    {
        if (e == null) return "<null>";
        var t = e.GetType();
        var parts = new List<string>();
        foreach (var p in t.GetProperties())
        {
            try { parts.Add(p.Name + "=" + p.GetValue(e)); } catch { }
        }
        return string.Join(", ", parts);
    }

    static EventInfo FindEvent(Type t, string name)
    {
        while (t != null)
        {
            var ev = t.GetEvent(name, BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
            if (ev != null) return ev;
            t = t.BaseType;
        }
        return null;
    }
}
