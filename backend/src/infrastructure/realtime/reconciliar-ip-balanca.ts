/**
 * Decide o que fazer com os Devices de um agent a partir das balanças que ele
 * acabou de descobrir na rede (card #79).
 *
 * A balança pega IP por DHCP e troca de endereço ao religar. O MAC, lido pelo
 * Agent Local na tabela ARP, não muda — é por ele que a balança é reconhecida.
 *
 * Função pura: o gateway só aplica o plano. Mantê-la sem Prisma é o que deixa
 * testar os casos de troca de IP entre duas balanças sem banco.
 */

export interface DeviceRegistrado {
  id: string;
  nome: string;
  ip: string;
  porta: number;
  mac: string | null;
}

export interface BalancaDescoberta {
  ip: string;
  port: number;
  /** Ausente em agentes antigos, ou quando o agente não conseguiu afirmar o MAC. */
  mac?: string | null;
}

export interface PlanoReconciliacao {
  /** Devices cujo IP mudou, reconhecidos pelo MAC. */
  novosIps: { deviceId: string; nome: string; de: string; para: string }[];
  /** Devices ainda sem MAC vistos no IP cadastrado: passam a conhecer o próprio MAC. */
  macsAprendidos: { deviceId: string; nome: string; mac: string }[];
  /** Situações que não dá para resolver sozinho, para o log. */
  ignorados: string[];
}

const MAC_VALIDO = /^([0-9a-f]{2}:){5}[0-9a-f]{2}$/;

export function planejarReconciliacao(
  registrados: DeviceRegistrado[],
  descobertas: BalancaDescoberta[],
): PlanoReconciliacao {
  const plano: PlanoReconciliacao = { novosIps: [], macsAprendidos: [], ignorados: [] };

  // Um MAC anunciado em dois IPs ao mesmo tempo (clone, proxy ARP) não
  // identifica nada — descartado em vez de escolher um no chute.
  const porMac = new Map<string, BalancaDescoberta[]>();
  for (const d of descobertas) {
    const mac = d.mac?.toLowerCase();
    if (!mac || !MAC_VALIDO.test(mac)) continue;
    porMac.set(mac, [...(porMac.get(mac) ?? []), d]);
  }

  const ipsReservados = new Set<string>();
  for (const [mac, vistas] of porMac) {
    if (vistas.length > 1) {
      plano.ignorados.push(`MAC ${mac} anunciado em ${vistas.map((v) => v.ip).join(", ")}`);
      continue;
    }
    const [vista] = vistas;
    const dono = registrados.find((r) => r.mac === mac);

    if (dono) {
      if (dono.ip !== vista.ip) {
        plano.novosIps.push({ deviceId: dono.id, nome: dono.nome, de: dono.ip, para: vista.ip });
        ipsReservados.add(vista.ip);
      }
      continue;
    }

    const noMesmoIp = registrados.find((r) => r.ip === vista.ip);
    if (noMesmoIp && !noMesmoIp.mac) {
      plano.macsAprendidos.push({ deviceId: noMesmoIp.id, nome: noMesmoIp.nome, mac });
    } else if (noMesmoIp) {
      // O Device desse IP já tem outro MAC: ou a balança foi trocada, ou o
      // DHCP deu o IP antigo dela para outra. Nenhum dos dois se corrige sozinho.
      plano.ignorados.push(`IP ${vista.ip} cadastrado com MAC ${noMesmoIp.mac}, mas respondeu com ${mac}`);
    }
  }

  // Um IP novo que ainda está no cadastro de outro Device só pode ser usado se
  // esse outro também estiver saindo dele neste mesmo plano (duas balanças que
  // trocaram de IP entre si). Senão o @@unique([lojaId, ip]) recusaria.
  const saindo = new Set(plano.novosIps.map((n) => n.de));
  plano.novosIps = plano.novosIps.filter((n) => {
    const ocupante = registrados.find((r) => r.ip === n.para && r.id !== n.deviceId);
    if (!ocupante || saindo.has(n.para)) return true;
    plano.ignorados.push(`"${n.nome}" apareceu em ${n.para}, que ainda está cadastrado para "${ocupante.nome}"`);
    return false;
  });

  // Sem MAC para casar: sobrou exatamente um cadastro sem MAC que não responde
  // no IP dele, e exatamente uma balança anunciada, na mesma porta, que não é
  // de ninguém. É ela — e é assim que um cadastro já com o IP errado (a
  // balança religou antes do agente novo chegar) se corrige, aprendendo o MAC
  // no mesmo passo. Também cobre agentes antigos, que não mandam MAC.
  // Mais de um de qualquer lado é ambíguo e fica para o fluxo manual.
  const ipsDescobertos = new Set(descobertas.map((d) => d.ip));
  const resolvidos = new Set([...plano.novosIps.map((n) => n.deviceId), ...plano.macsAprendidos.map((m) => m.deviceId)]);
  const orfaos = registrados.filter((r) => !r.mac && !resolvidos.has(r.id) && !ipsDescobertos.has(r.ip));
  const semDono = descobertas.filter((d) => {
    const mac = d.mac?.toLowerCase();
    if (mac && registrados.some((r) => r.mac === mac)) return false;
    if (registrados.some((r) => r.ip === d.ip)) return false;
    return !ipsReservados.has(d.ip);
  });
  if (orfaos.length === 1 && semDono.length === 1 && semDono[0].port === orfaos[0].porta) {
    const [device] = orfaos;
    const [vista] = semDono;
    const mac = vista.mac?.toLowerCase();
    if (!mac || (MAC_VALIDO.test(mac) && (porMac.get(mac)?.length ?? 0) === 1)) {
      plano.novosIps.push({ deviceId: device.id, nome: device.nome, de: device.ip, para: vista.ip });
      if (mac) plano.macsAprendidos.push({ deviceId: device.id, nome: device.nome, mac });
    }
  }

  return plano;
}
