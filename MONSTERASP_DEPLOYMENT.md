# MonsterASP.NET Deployment Instructions for DealZone API

This guide provides targeted instructions for deploying the ASP.NET Core (.NET 10) Web API to **MonsterASP.NET Free Windows Hosting**.

---

## 1. MonsterASP.NET Plan Features & Free Plan Specifications

- **OS:** Windows Server / IIS 10
- **Supported Framework:** ASP.NET Core (.NET 6.0, 7.0, 8.0, 9.0, 10.0)
- **Web Space:** Up to 1 GB SSD
- **SQL Server Database:** 1x MSSQL database (1 GB space)
- **Management Tools:** Web File Manager, FTP/FTPS, Web Deploy, IIS Remote Manager
- **External Database Access:** Enabled over TCP Port 1433

---

## 2. Pre-Deployment Configuration on MonsterASP Control Panel

1. **Create Web Site:**
   - In MonsterASP Control Panel, go to **Websites** > **Add Website**.
   - Set the domain / subdomain (e.g., `dealzone-api.monsterasp.net`).
2. **Set .NET Core Runtime Version:**
   - Click on your website name.
   - Go to **Website Settings** > **ASP.NET Version**.
   - Select **.NET 10.x** (or the latest .NET Core / in-process runtime supported).
3. **Application Pool Settings:**
   - Pipeline Mode: **Integrated**.
   - Managed Pipeline: **No Managed Code** (handled by `AspNetCoreModuleV2`).
4. **Create MS SQL Database:**
   - Go to **Databases** > **MS SQL Databases** > **Add Database**.
   - Save the Server Host (e.g., `mssqlX.monsterasp.net`), Database Name, User, and Password.

---

## 3. Local Publish Workflow

Open PowerShell in the DealZone repository root:

```powershell
# Clean previous publish artifacts
if (Test-Path backend/publish) { Remove-Item -Recurse -Force backend/publish }

# Publish Release build
dotnet publish backend/src/DealZone.Api/DealZone.Api.csproj -c Release -o backend/publish
```

Verify that the output folder `backend/publish` contains:
- `DealZone.Api.dll`
- `web.config`
- `appsettings.json`
- `appsettings.Production.json`

---

## 4. Deploying via FTP / Web Deploy

### Method A: FTP / FTPS
1. In MonsterASP, navigate to **FTP Accounts**.
2. Note your FTP Host, Username, and Password.
3. Open an FTP Client (FileZilla, WinSCP) or Windows Explorer (`ftp://...`).
4. Connect using FTPS (Explicit FTP over TLS).
5. Navigate to: `/site/wwwroot/`
6. Upload the entire contents of `backend/publish/` directly into `/site/wwwroot/`.

### Method B: Web Deploy (Visual Studio or CLI)
1. In MonsterASP, download the **Publish Profile** (`.publishsettings`).
2. You can deploy directly using Visual Studio: Right-click `DealZone.Api` > **Publish** > Import Profile.

---

## 5. Setting Production Environment Variables

To keep production credentials secure without editing source-controlled files:

### Option 1: Via MonsterASP Control Panel
Navigate to your Website > **Application Settings** (or Environment Variables) and set:
- `ASPNETCORE_ENVIRONMENT` = `Production`
- `ConnectionStrings__DefaultConnection` = `Server=mssqlX.monsterasp.net;Database=YOUR_DB;User Id=YOUR_USER;Password=YOUR_PASS;TrustServerCertificate=True;`
- `JwtSettings__SecretKey` = `A_STRONG_RANDOM_SECRET_KEY_AT_LEAST_32_BYTES_LONG_2026!`
- `CorsSettings__AllowedOrigins__0` = `https://your-frontend.vercel.app`

### Option 2: Via `web.config` inside `/site/wwwroot/`
Edit the `<environmentVariables>` block in the uploaded `web.config`:

```xml
<aspNetCore processPath="dotnet" arguments=".\DealZone.Api.dll" stdoutLogEnabled="true" stdoutLogFile=".\logs\stdout" hostingModel="inprocess">
  <environmentVariables>
    <environmentVariable name="ASPNETCORE_ENVIRONMENT" value="Production" />
    <environmentVariable name="ConnectionStrings__DefaultConnection" value="Server=mssqlX.monsterasp.net;Database=YOUR_DB;User Id=YOUR_USER;Password=YOUR_PASS;TrustServerCertificate=True;" />
    <environmentVariable name="JwtSettings__SecretKey" value="YOUR_64_CHAR_HEX_OR_KEY" />
    <environmentVariable name="CorsSettings__AllowedOrigins__0" value="https://dealzone.vercel.app" />
  </environmentVariables>
</aspNetCore>
```

---

## 6. Monitoring and Troubleshooting

- **Check Health:** Visit `https://your-domain.monsterasp.net/health`.
- **View Logs:** If the app fails to start, set `stdoutLogEnabled="true"` in `web.config` and inspect the `.txt` logs generated under `/site/wwwroot/logs/`.
- **Idle Timeout:** On the free tier, the application enters an idle sleep state after 15–20 minutes without traffic. The first request after idle may take 3–5 seconds to spin up.
