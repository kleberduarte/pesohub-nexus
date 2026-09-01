<#
.SYNOPSIS
  Extrai os layouts de etiqueta de fábrica do ECS.mdb da Ramuza para JSON.

.DESCRIPTION
  O Node não lê .mdb, então a leitura fica aqui (driver ACE, senha do banco
  `showmethemoney`) e o `importar-layout-ramuza.ts` consome o JSON gerado.

  Cada arquivo de saída tem a forma { label: {...}, items: [...] }, que é o
  formato que o importador espera.

.EXAMPLE
  # Lista os 62 layouts com nome e tamanho, sem gravar nada
  .\extrair-layouts-ramuza.ps1 -Listar

.EXAMPLE
  # Extrai layouts específicos para .\layouts-ramuza\
  .\extrair-layouts-ramuza.ps1 -LabelId 4,5,2 -Destino .\layouts-ramuza

.EXAMPLE
  # Extrai todos
  .\extrair-layouts-ramuza.ps1 -Todos -Destino .\layouts-ramuza
#>
[CmdletBinding()]
param(
  [string]$Mdb = "C:\Program Files (x86)\Ramuza\TM-xA V3.15A\ECS.mdb",
  [int[]]$LabelId,
  [switch]$Todos,
  [switch]$Listar,
  [string]$Destino = ".\layouts-ramuza"
)

if (-not (Test-Path $Mdb)) { throw "ECS.mdb não encontrado em: $Mdb" }

$conexao = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$Mdb;Jet OLEDB:Database Password=showmethemoney;"

function Invoke-Consulta {
  param([string]$Sql)
  $conn = New-Object System.Data.OleDb.OleDbConnection $conexao
  try {
    $conn.Open()
    $adaptador = New-Object System.Data.OleDb.OleDbDataAdapter($Sql, $conn)
    $tabela = New-Object System.Data.DataTable
    [void]$adaptador.Fill($tabela)
    # A vírgula impede o PowerShell de desenrolar a DataTable em DataRows —
    # sem ela, `.Columns` some e a montagem do JSON quebra com "índice nulo".
    return ,$tabela
  } finally { $conn.Close() }
}

# A tabela Label tem 32 colunas de texto constante (Text1..Text32) além dos
# metadados; o importador só usa nome e dimensões, mas os textos são levados
# junto porque são eles que dão o conteúdo dos elementos Flag1=3.
$labels = Invoke-Consulta "SELECT * FROM Label ORDER BY LabelID"

if ($Listar) {
  $labels.Rows | ForEach-Object {
    "{0,3}  {1,-28} {2,5} x {3,-5} pontos" -f $_.LabelID, $_.Name, $_.Width, $_.Height
  }
  return
}

if ($Todos) { $LabelId = $labels.Rows | ForEach-Object { [int]$_.LabelID } }
if (-not $LabelId) { throw "Informe -LabelId <n[,n]>, -Todos ou -Listar" }

if (-not (Test-Path $Destino)) { [void](New-Item -ItemType Directory -Path $Destino) }

foreach ($id in $LabelId) {
  $label = $labels.Rows | Where-Object { [int]$_.LabelID -eq $id }
  if (-not $label) { Write-Warning "LabelID $id não existe no ECS.mdb"; continue }

  $itens = Invoke-Consulta "SELECT * FROM LabelItem WHERE LabelID = $id ORDER BY SubID"

  $colunasLabel = $labels.Columns | ForEach-Object { $_.ColumnName }
  $colunasItem  = $itens.Columns  | ForEach-Object { $_.ColumnName }

  $saida = [ordered]@{
    label = [ordered]@{}
    items = @()
  }
  foreach ($c in $colunasLabel) { $saida.label[$c] = $label.$c }
  $saida.items = @($itens.Rows | ForEach-Object {
    $linha = $_
    $obj = [ordered]@{}
    foreach ($c in $colunasItem) { $obj[$c] = $linha.$c }
    $obj
  })

  # O nome vira parte do arquivo, mas sem os caracteres que o Windows recusa.
  $slug = ($label.Name -replace '[^\w\-]+', '-').Trim('-').ToLower()
  $arquivo = Join-Path $Destino ("ramuza-label-{0}-{1}.json" -f $id, $slug)
  # utf8 sem BOM: o JSON.parse do Node engasga com BOM.
  [System.IO.File]::WriteAllText(
    (Join-Path (Resolve-Path $Destino) (Split-Path $arquivo -Leaf)),
    ($saida | ConvertTo-Json -Depth 6),
    (New-Object System.Text.UTF8Encoding $false)
  )
  "{0,3}  {1,-28} {2} elementos -> {3}" -f $id, $label.Name, $itens.Rows.Count, (Split-Path $arquivo -Leaf)
}
