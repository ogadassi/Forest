$certDetails = @{
    Subject = "CN=localhost"
    CertStoreLocation = "Cert:\CurrentUser\My"
    KeyExportPolicy = "Exportable"
    KeySpec = "KeyExchange"
    KeyLength = 2048
    KeyUsage = "DigitalSignature","KeyEncipherment"
    KeyUsageProperty = "All"
    FriendlyName = "Forest-Localhost"
    TextExtension = @("2.5.29.37={text}1.3.6.1.5.5.7.3.1")
}

$cert = New-SelfSignedCertificate @certDetails
$pwd = ConvertTo-SecureString -String "password123" -Force -AsPlainText
$path = "$PSScriptRoot\cert\localhost.pfx"

# Create cert directory if not exists
New-Item -ItemType Directory -Force -Path "$PSScriptRoot\cert" | Out-Null

# Export PFX
Export-PfxCertificate -Cert $cert -FilePath $path -Password $pwd

Write-Host "Certificate generated using PowerShell at: $path"


