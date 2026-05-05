# ByronSpace — Sistema de Reservas Ada Byron

Sistema de reservas de espacios del edificio Ada Byron, EINA, Universidad de Zaragoza.

## Arrancar el sistema

Desde la raíz del proyecto (donde está el `docker-compose.yml`):

```bash
docker compose up --build
```

La primera vez tarda más porque construye las imágenes y ejecuta los seeders. Una vez arrancado:

- **Frontend:** http://localhost:5173
- **Gateway API:** http://localhost:3000
- **RabbitMQ Management:** http://localhost:15672 (rabbit_user / rabbit_pass)
- **PyGeoAPI:** http://localhost:5000

Para parar:

```bash
docker compose down
```

Para parar y borrar la base de datos (reset completo):

```bash
docker compose down -v
```

---

## Gestión de usuarios (solo API)

Las operaciones de creación y modificación de usuarios no tienen interfaz gráfica. Se realizan desde PowerShell con el token JWT de un gerente.

### 1. Obtener el token

Inicia sesión en la aplicación como gerente. Luego abre las DevTools del navegador (F12) → Application → Local Storage → `http://localhost:5173` → copia el valor de `token`.

Guárdalo en PowerShell:

```powershell
$TOKEN = "pega_aqui_el_token"
```

### 2. Crear un usuario

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/usuarios" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"nombre":"Nombre Apellido","email":"usuario@eina.unizar.es","contrasenia":"password123","rol":"tecnico_laboratorio","departamentoId":1}'
```

**Roles disponibles:** `estudiante`, `investigador_contratado`, `docente_investigador`, `tecnico_laboratorio`, `conserje`, `investigador_visitante`

**Departamentos:** `1` = Informática e Ingeniería de Sistemas, `2` = Ingeniería Electrónica y Comunicaciones

**Roles que requieren departamento:** `investigador_contratado`, `docente_investigador`, `tecnico_laboratorio`, `investigador_visitante`

**Roles sin departamento:** `estudiante`, `conserje`

Para crear un gerente:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/usuarios" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"nombre":"Nombre Gerente","email":"gerente2@eina.unizar.es","contrasenia":"password123","esGerente":true}'
```

Para crear un gerente que también es docente-investigador:

```powershell
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/usuarios" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"nombre":"Nombre Gerente","email":"gerente.docente@eina.unizar.es","contrasenia":"password123","rol":"docente_investigador","departamentoId":1,"esGerente":true}'
```

### 3. Modificar rol de un usuario

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/usuarios/5" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"rol":"docente_investigador","departamentoId":1}'
```

### 4. Cambiar departamento (paso 15 demo)

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/usuarios/7" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"departamentoId":2}'
```

### 5. Activar flag de gerente a un docente-investigador

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/usuarios/3" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"esGerente":true}'
```

### 6. Quitar rol a un gerente+docente (vuelve a gerente puro)

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/usuarios/1" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"rol":null}'
```

**Transiciones de rol permitidas:**
- Estudiante → Investigador contratado
- Investigador contratado → Docente-investigador
- Técnico de laboratorio → Conserje
- Conserje → Técnico de laboratorio
- Gerente puro → puede recibir rol `docente_investigador`
- Gerente+docente → puede perder el rol (queda como gerente puro)

---

## Modificar horario del edificio (solo API)

El horario y porcentaje de ocupación del edificio también se gestionan por API.

### Cambiar horario del edificio (solo afecta espacios sin horario propio)

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/edificio/1" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"horarioApertura":"09:00","horarioCierre":"19:00"}'
```

### Cambiar horario y que afecte a todos los espacios

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/edificio/1?afectarTodos=true" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"horarioApertura":"09:00","horarioCierre":"19:00"}'
```

### Cambiar porcentaje de ocupación del edificio

```powershell
Invoke-RestMethod -Method PATCH -Uri "http://localhost:3000/api/edificio/1" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $TOKEN" } `
  -Body '{"porcentajeOcupacion":50}'
```

---

## Consultar la base de datos

Para hacer consultas SQL directamente:

```powershell
docker exec -it reservas_postgres psql -U reservas_user -d reservas_db -c "SELECT id, nombre, email, rol, \"esGerente\", \"departamentoId\" FROM usuarios;"
```

```powershell
docker exec -it reservas_postgres psql -U reservas_user -d reservas_db -c "SELECT gid, nombre, uso, categoria, reservable, planta FROM espacios LIMIT 20;"
```

---

## Usuarios preconfigurados (seeders)

Todos tienen contraseña: `password`

| Email | Rol | Gerente | Departamento |
|-------|-----|---------|--------------|
| gerente.puro@eina.unizar.es | — | Sí | — |
| gerente@eina.unizar.es | docente_investigador | Sí | — |
| ana.docente@unizar.es | docente_investigador | No | Informática |
| luis.docente@unizar.es | docente_investigador | No | Electrónica |
| marta.investigadora@unizar.es | investigador_contratado | No | Informática |
| pablo.investigador@unizar.es | investigador_contratado | No | Electrónica |
| laura.tecnico@unizar.es | tecnico_laboratorio | No | Informática |
| carlos.tecnico@unizar.es | tecnico_laboratorio | No | Electrónica |
| conserje@unizar.es | conserje | No | — |
| estudiante1@unizar.es | estudiante | No | — |
| estudiante2@unizar.es | estudiante | No | — |
| visiting.inf@unizar.es | investigador_visitante | No | Informática |
| visiting.elec@unizar.es | investigador_visitante | No | Electrónica |