import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { COMPANY } from "@/lib/config";
import { STANDARD_EXTRAS, type StandardExtraKey } from "@/lib/validation/contract";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  title: { fontSize: 13, fontWeight: 700, marginBottom: 4 },
  clauseTitle: { fontSize: 11, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  subTitle: { fontSize: 10, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  paragraph: { marginBottom: 6 },
  bullet: { marginBottom: 3, marginLeft: 10 },
  bold: { fontWeight: 700 },
  table: { marginTop: 20, borderWidth: 1, borderColor: "#999" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#999" },
  tableCell: { flex: 1, padding: 6, borderRightWidth: 1, borderColor: "#999" },
  tableCellLast: { flex: 1, padding: 6 },
});

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export type ContractPdfItem = {
  serviceName: string;
  serviceDescription: string | null;
};

export type ContractPdfProps = {
  client: {
    legalName: string;
    tradeName: string | null;
    documentType: "cnpj" | "cpf";
    document: string;
    addressStreet: string | null;
    addressNumber: string | null;
    addressComplement: string | null;
    addressNeighborhood: string | null;
    addressCity: string | null;
    addressState: string | null;
    addressZipCode: string | null;
    phone: string | null;
  };
  clientSignerName: string;
  startDate: string;
  endDate: string | null;
  items: ContractPdfItem[];
  includedExtraKeys: string[];
  monthlyTotalCents: number;
  firstPaymentDate: string;
};

export function ContractDocument(props: ContractPdfProps) {
  const {
    client,
    startDate,
    endDate,
    items,
    includedExtraKeys,
    monthlyTotalCents,
    firstPaymentDate,
  } = props;

  const clientAddress = [
    client.addressStreet,
    client.addressNumber,
    client.addressComplement,
  ]
    .filter(Boolean)
    .join(", ");

  const notIncludedExtras = STANDARD_EXTRAS.filter(
    (extra) => !includedExtraKeys.includes(extra.key as StandardExtraKey),
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>
          Contrato de Prestação de Serviços — {COMPANY.legalName}
        </Text>

        <Text style={styles.paragraph}>
          Pelo presente instrumento particular de Contrato de Prestação de
          Serviços de um lado, <Text style={styles.bold}>{COMPANY.legalName}</Text>
          , situada na cidade de {COMPANY.city}, {COMPANY.state},{" "}
          {COMPANY.email}, inscrito no CNPJ sob o nº {COMPANY.document},
          doravante denominado CONTRATADA;
        </Text>

        <Text style={styles.paragraph}>
          E de outro lado,{" "}
          <Text style={styles.bold}>{client.legalName}</Text>
          {client.tradeName ? `, nome fantasia ${client.tradeName}` : ""},{" "}
          {client.documentType.toUpperCase()} {client.document}
          {clientAddress ? `, situada na ${clientAddress}` : ""}
          {client.addressNeighborhood ? `, Bairro ${client.addressNeighborhood}` : ""}
          {client.addressCity
            ? `, Cidade ${client.addressCity}-${client.addressState}`
            : ""}
          {client.addressZipCode ? `, CEP: ${client.addressZipCode}` : ""}
          {client.phone ? `, Telefone/WhatsApp ${client.phone}` : ""},
          denominada CONTRATANTE.
        </Text>

        <Text style={styles.paragraph}>
          Todos em conjunto denominados PARTES e individualmente como PARTE,
          têm entre si, justo e contratado, o presente CONTRATO, que se
          regerá pelas seguintes cláusulas:
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Vigência: </Text>
          {formatDateBR(startDate)}
          {endDate ? ` até ${formatDateBR(endDate)}` : ", por prazo indeterminado"}
          . Será renovado automaticamente por iguais períodos, salvo
          manifestação contrária por escrito com antecedência mínima de 30
          (trinta) dias.
        </Text>

        <Text style={styles.clauseTitle}>CLÁUSULA PRIMEIRA — PRESTAÇÃO DE SERVIÇOS</Text>
        <Text style={styles.subTitle}>1.1. INCLUSOS NO PROJETO:</Text>
        {items.map((item, index) => (
          <View key={index}>
            <Text style={styles.bullet}>• {item.serviceName}</Text>
            {item.serviceDescription
              ?.split("\n")
              .map((line) => line.trim())
              .filter(Boolean)
              .map((line, lineIndex) => (
                <Text key={lineIndex} style={[styles.bullet, { marginLeft: 20 }]}>
                  - {line}
                </Text>
              ))}
          </View>
        ))}

        <Text style={styles.paragraph}>
          1.2. O escopo contempla até 2 (duas) rodadas de ajustes por peça ou
          campanha. Solicitações adicionais poderão ser cobradas à parte.
        </Text>

        {notIncludedExtras.length > 0 && (
          <>
            <Text style={styles.subTitle}>1.3. NÃO INCLUSOS NO PROJETO:</Text>
            {notIncludedExtras.map((extra) => (
              <Text key={extra.key} style={styles.bullet}>
                • {extra.label} ({extra.priceLabel})
              </Text>
            ))}
          </>
        )}

        <Text style={styles.paragraph}>
          1.4. Qualquer serviço não listado expressamente neste contrato será
          considerado fora do escopo e sujeito a negociação e contratação à
          parte.
        </Text>

        <Text style={styles.clauseTitle}>
          CLÁUSULA SEGUNDA – DAS CONDIÇÕES DA PRESTAÇÃO DOS SERVIÇOS
        </Text>
        <Text style={styles.subTitle}>2.1. Obrigações da CONTRATADA</Text>
        <Text style={styles.paragraph}>
          2.1.1. A CONTRATADA compromete-se a enviar todos os esforços no
          sentido de preservar a imagem da CONTRATANTE, tomando os cuidados
          necessários em especial atenção às disposições expressas no Código
          de Defesa do Consumidor.
        </Text>
        <Text style={styles.paragraph}>
          2.1.2. A CONTRATANTE, por sua vez, compromete-se a fornecer
          elementos comprobatórios sobre o(s) produto(s) e/ou serviço(s) a
          fim de que as criações textuais atendam aos dispositivos do Código
          de Defesa do Consumidor e Código Brasileiro de
          Autorregulamentação Publicitária.
        </Text>
        <Text style={styles.paragraph}>
          2.1.3. A CONTRATADA não garante resultados específicos, uma vez
          que ações de marketing dependem de fatores externos como mercado,
          comportamento do consumidor, concorrência e políticas das
          plataformas.
        </Text>
        <Text style={styles.paragraph}>2.1.4. A CONTRATADA não se responsabiliza por:</Text>
        <Text style={styles.bullet}>2.1.4.1. Bloqueios ou restrições de contas pelas plataformas;</Text>
        <Text style={styles.bullet}>2.1.4.2. Alterações de algoritmo ou políticas de anúncios;</Text>
        <Text style={styles.bullet}>2.1.4.3. Instabilidades técnicas;</Text>
        <Text style={styles.bullet}>
          2.1.4.4. Decisões tomadas pela CONTRATANTE contrárias às
          recomendações estratégicas.
        </Text>
        <Text style={styles.paragraph}>
          2.1.5. A CONTRATADA poderá suspender os serviços em caso de
          inadimplência superior a 5 (cinco) dias, até a regularização.
        </Text>

        <Text style={styles.subTitle}>2.2. Obrigações da CONTRATANTE</Text>
        <Text style={styles.paragraph}>
          2.2.1. Fornecer à CONTRATADA, de acordo com a periodicidade
          necessária, todos os materiais necessários com antecedência
          mínima de 5 (cinco) dias úteis da data final para realizarmos a
          hospedagem dos criativos nas campanhas, juntamente com a
          disponibilização do acesso às contas de titularidade do
          CONTRATANTE.
        </Text>
        <Text style={styles.paragraph}>
          2.2.2. Cumprir os prazos estipulados neste contrato no que se
          refere aos pagamentos mensais.
        </Text>
        <Text style={styles.paragraph}>
          2.2.3. A CONTRATANTE é livre para sugerir todo e qualquer conteúdo
          informativo de suas páginas, sendo ela integralmente responsável
          pelos efeitos provenientes destas informações, respondendo civil
          e criminalmente por atos contrários à lei, propaganda enganosa,
          atos obscenos e violação de direitos autorais.
        </Text>
        <Text style={styles.paragraph}>
          2.2.4. Confiar nas estratégias traçadas e desenvolvidas pela
          CONTRATADA para todos os conteúdos e lançamentos deste contrato
          até a reincidência deste instrumento, concordando que a
          frequência, as datas, os materiais a serem elaborados e as ações
          delimitadas para cada momento serão discutidas entre ambas as
          partes, mas a decisão final sobre os pontos acima expostos caberá
          exclusivamente ao CONTRATANTE, porém, caso a CONTRATANTE opte por
          decisões contrárias às recomendações da CONTRATADA, esta se exime
          de qualquer responsabilidade pelos resultados decorrentes dessas
          ações.
        </Text>

        <Text style={styles.clauseTitle}>CLÁUSULA TERCEIRA – PRAZO E RENOVAÇÃO</Text>
        <Text style={styles.paragraph}>
          3.1. O contrato terá vigência conforme indicado no início deste
          instrumento.
        </Text>
        <Text style={styles.paragraph}>
          3.2. Será renovado automaticamente por iguais períodos, salvo
          manifestação contrária por escrito com antecedência mínima de 30
          (trinta) dias.
        </Text>
        <Text style={styles.paragraph}>
          3.3. Os valores serão reajustados anualmente pelo IPCA acumulado
          no período.
        </Text>

        <Text style={styles.clauseTitle}>CLÁUSULA QUARTA – DIREITOS AUTORAIS</Text>
        <Text style={styles.paragraph}>
          4.1. É de inteira responsabilidade do CONTRATANTE a aprovação das
          artes publicitárias e quaisquer outros conteúdos que serão
          vinculados pelo gestor de anúncios durante o período de vigência
          deste contrato.
        </Text>
        <Text style={styles.paragraph}>
          4.2. Demais questões não explícitas neste documento deverão ser
          julgadas de acordo com a Lei nº 9.610, de 19 de fevereiro de
          1998, que regula as normas de Direitos Autorais.
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.clauseTitle}>
          CLÁUSULA QUINTA – VALORES E FORMAS DE PAGAMENTO
        </Text>
        <Text style={styles.paragraph}>
          5.1. Pelos serviços prestados, o CONTRATANTE pagará à CONTRATADA o
          valor mensal de {formatBRL(monthlyTotalCents)}, mediante emissão
          de boleto bancário conforme instruções da CONTRATADA, incluindo
          eventuais encargos por atraso, como multas e juros previamente
          estipulados no boleto.
        </Text>
        <Text style={styles.paragraph}>
          5.2. O primeiro pagamento vence em {formatDateBR(firstPaymentDate)},
          e os pagamentos subsequentes vencerão mensalmente nessa mesma
          data, até o término da vigência.
        </Text>
        <Text style={styles.paragraph}>
          5.3. O atraso implicará multa de 5% sobre o valor devido,
          acrescido de juros de 1% ao mês e correção monetária.
        </Text>
        <Text style={styles.paragraph}>
          5.4. O contrato poderá ser rescindido por descumprimento
          contratual, desde que a parte inadimplente seja notificada e
          tenha prazo de 15 (quinze) dias para sanar a irregularidade.
        </Text>
        <Text style={styles.paragraph}>
          5.5. Por decisões internas, sem motivação, a CONTRATANTE poderá
          rescindir o contrato, desde que notifique a CONTRATADA com no
          mínimo 30 (trinta) dias de antecedência, pagando uma multa de 40%
          referente ao valor dos meses restantes até o final do contrato.
        </Text>
        <Text style={styles.paragraph}>
          5.6. A CONTRATANTE deverá estar ciente de que a CONTRATADA
          somente realizará os itens desejados pelo mesmo que constarem no
          contrato. Qualquer pedido adicional será cobrado separadamente do
          documento.
        </Text>
        <Text style={styles.paragraph}>
          5.7. A inadimplência superior a 5 (cinco) dias poderá implicar a
          suspensão dos serviços.
        </Text>

        <Text style={styles.clauseTitle}>
          CLÁUSULA SEXTA – PROTEÇÃO DE DADOS PESSOAIS (LGPD)
        </Text>
        <Text style={styles.paragraph}>
          6.1. As PARTES se comprometem a tratar os dados pessoais
          compartilhados em razão deste contrato conforme a Lei nº
          13.709/2018 (LGPD), utilizando-os apenas para a execução dos
          serviços contratados, adotando medidas de segurança apropriadas e
          limitando o acesso a pessoas autorizadas.
        </Text>
        <Text style={styles.paragraph}>
          6.2. A CONTRATADA compromete-se a notificar o CONTRATANTE sobre
          qualquer incidente de segurança e a eliminar ou anonimizar os
          dados ao término da finalidade, salvo obrigação legal em
          contrário.
        </Text>
        <Text style={styles.paragraph}>
          6.3. O descumprimento das obrigações previstas poderá gerar
          responsabilidade por perdas e danos, além das sanções legais
          cabíveis.
        </Text>

        <Text style={styles.clauseTitle}>CLÁUSULA SÉTIMA – CONFIDENCIALIDADE</Text>
        <Text style={styles.paragraph}>
          7.1. As PARTES comprometem-se a manter sigilo sobre todas as
          informações trocadas em razão deste contrato, utilizando-as
          exclusivamente para a sua execução.
        </Text>
        <Text style={styles.paragraph}>
          7.2. O dever de confidencialidade permanecerá vigente durante o
          contrato e por um ano após seu término, salvo se a divulgação for
          exigida por lei ou decisão judicial.
        </Text>

        <Text style={styles.clauseTitle}>CLÁUSULA OITAVA – DISPOSIÇÕES GERAIS</Text>
        <Text style={styles.paragraph}>
          8.1. Ao final do contrato não serão arquivadas ou excluídas as
          campanhas já realizadas no gestor.
        </Text>
        <Text style={styles.paragraph}>
          8.2. Os signatários do presente contrato asseguram e afirmam que
          são os representantes legais competentes para assumir em nome
          das partes as obrigações descritas neste contrato e representar
          de forma efetiva seus interesses.
        </Text>
        <Text style={styles.paragraph}>
          8.3. As partes são contratantes totalmente independentes, sendo
          cada uma inteiramente responsável por seus atos, obrigações e
          conteúdo das informações prestadas, visto que o presente
          instrumento não cria vínculo empregatício nem de representação
          comercial entre elas.
        </Text>
        <Text style={styles.paragraph}>
          8.4. Aplicam-se ao presente contrato, naquilo que couber, as
          disposições da Lei 4.680/65, dos Decretos nº 57.690/66, com as
          alterações introduzidas pelo 4.563/02, da Lei 9.610/98 (Lei de
          Direitos Autorais), as Normas Padrão da Atividade Publicitária e
          do Código de Ética dos Profissionais de Propaganda.
        </Text>
        <Text style={styles.paragraph}>
          8.5. A CONTRATADA não garante resultados específicos, já que as
          ações de marketing estão sujeitas a fatores de mercado e
          comportamento de terceiros, e as aprovações realizadas por
          e-mail ou WhatsApp terão validade jurídica.
        </Text>
        <Text style={styles.paragraph}>
          8.6. Durante a vigência deste contrato e pelo período de 2 anos
          após seu término, a CONTRATANTE se compromete a não contratar,
          direta ou indiretamente, os colaboradores da CONTRATADA
          envolvidos na execução dos serviços prestados, sob pena de multa
          equivalente a 12 (doze) vezes a última remuneração mensal do
          colaborador.
        </Text>
        <Text style={styles.paragraph}>
          8.7. Os arquivos editáveis não estão inclusos, salvo acordo
          específico.
        </Text>
        <Text style={styles.paragraph}>
          8.8. A CONTRATADA poderá utilizar os materiais para fins de
          portfólio e divulgação institucional.
        </Text>
        <Text style={styles.paragraph}>
          8.9. Todas e quaisquer questões que surjam em decorrência da
          execução dos termos do presente CONTRATO, ou que dele se
          originarem, serão solucionadas amigavelmente entre as PARTES. Na
          impossibilidade de solução conciliatória, as PARTES elegem o
          foro da cidade de {COMPANY.city}-{COMPANY.state}, com exclusão de
          quaisquer outros, por mais privilegiados que sejam ou venham a
          ser.
        </Text>

        <Text style={[styles.paragraph, { marginTop: 20 }]}>
          {COMPANY.city}-{COMPANY.state}, {formatDateBR(startDate)}.
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Nome</Text>
            <Text style={styles.tableCell}>Documento</Text>
            <Text style={styles.tableCellLast}>Assinatura</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{COMPANY.legalName}</Text>
            <Text style={styles.tableCell}>{COMPANY.document}</Text>
            <Text style={styles.tableCellLast}> </Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>{client.legalName}</Text>
            <Text style={styles.tableCell}>{client.document}</Text>
            <Text style={styles.tableCellLast}> </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
