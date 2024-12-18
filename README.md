<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# AntriHelu Backend

Backend API untuk sistem antrian **AntriHelu** menggunakan **NestJS**. Proyek ini memiliki fitur real-time dengan **Socket.IO**, manajemen database dengan **Prisma ORM**, dan scheduled tasks dengan cron job untuk mengirimkan backup database serta laporan setiap tanggal 1.

## Fitur Utama

1. **NestJS Framework**: Backend modern dengan modularitas tinggi.
2. **Socket.IO**: Komunikasi real-time untuk sistem antrian.
3. **Prisma ORM**: Manajemen database menggunakan Prisma.
4. **SMTP Cron Job**:
    - Melakukan backup database setiap tanggal 1.
    - Mengirimkan hasil backup beserta laporan melalui email.
5. **JWT Authentication**: Manajemen autentikasi pengguna.
6. **MySQL**: Basis data utama untuk menyimpan antrian.

---

## Instalasi

### Prasyarat

-   Node.js v18 atau lebih baru.
-   MySQL Database.
-   SMTP email untuk mengirim laporan.

### Langkah Instalasi

1. **Clone repository**:

    ```bash
    git clone https://github.com/nudriin/antrian-rest-api.git
    cd antrian-rest-api
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Konfigurasi Environment**:
   Buat file `.env` di root directory:

    ```env
    # Database Configuration
    DATABASE_URL="mysql://root:password@localhost:3306/nest_queue?timezone=Asia/Jakarta"

    # JWT Secret
    JWT_SECRET=<Youtr JWT Secret>

    # SMTP Configuration
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=465
    SMTP_USER=<Your Email>
    SMTP_PASSWORD=<Your App Password>
    SMTP_FROM_EMAIL=<Your Email>

    # Cron Configuration (Timezone)
    APP_TIMEZONE=Asia/Jakarta
    ```

4. **Migrate Database**:

    ```bash
    npx prisma migrate dev --name init

    atau

    npx prisma db push
    ```

5. **Jalankan server**:
    - Development:
        ```bash
        npm run start:dev
        ```
    - Production:
        ```bash
        npm run build
        npm start
        ```

---

## Struktur Direktori

```
docs/                     # Dokumentasi proyek seperti ERD
prisma/                   # Konfigurasi Prisma ORM
src/
|-- common/               # Modul reusable seperti utilitas
|-- locket/               # Module, service, controller dan validation untuk loket
|-- model/                # DTO
|-- queue/                # Module, service, controller dan validation untuk antrian
|-- user/                 # Module, service, controller dan validation untuk user
|-- app.module.ts         # Modul utama aplikasi
|-- main.ts               # Entry point aplikasi
test/                     # Testing end-to-end
```

---

## Fitur Utama

### 1. Socket.IO Gateway

Menggunakan **WebSockets** untuk komunikasi real-time:

```typescript
@WebSocketGateway({
    namespace: 'queue',
    cors: {
        origin: '*',
    },
})
export class QueueGateway {
    @WebSocketServer()
    server: Server;

    handleEvent(
        @MessageBody() data: string,
        @ConnectedSocket() client: Socket,
    ): void {
        console.log(`SOCKET REQUEST from ${client.id}: `, data);
        this.server.emit('queue-update', data); // Emit ke semua client
        console.log(`SOCKET EMIT : queue-update => ${data}`);
    }
}
```

### 2. Prisma ORM

Prisma digunakan untuk manajemen database MySQL:

```prisma
model Queue {
  id           BigInt    @id @default(autoincrement())
  createdAt    DateTime  @default(dbgenerated("CURRENT_TIMESTAMP")) @db.Timestamp()
  queue_number Int
  status       Status    @default(UNDONE)
  updatedAt    DateTime?
  locket_id    Int
  user_id      Int

  locket Locket @relation(fields: [locket_id], references: [id])
  user   User   @relation(fields: [user_id], references: [id])

  @@map("queue")
}
```

### 3. Cron Job: Backup Database

Menggunakan **`node-cron`** dan **nodemailer** untuk mengirim backup dan laporan:

```typescript
@Cron('0 0 1 * *', { timeZone: 'Asia/Jakarta' })
async handleDatabaseBackup() {
  // Logika untuk backup database
  await this.backupService.generateBackup();
  await this.mailService.sendBackupReport();
}
```

### 4. SMTP Email Report

Mengirim email dengan **nodemailer**:

```typescript
private readonly transporter: Transporter;

    constructor(private configService: ConfigService) {
        this.transporter = createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: true,
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASSWORD'),
            },
        });
    }
```

---

## Script NPM

| Perintah            | Deskripsi                                 |
| ------------------- | ----------------------------------------- |
| `npm run start`     | Menjalankan server dalam mode produksi    |
| `npm run start:dev` | Menjalankan server dalam mode development |
| `npm run build`     | Build aplikasi untuk produksi             |
| `npm run test`      | Menjalankan testing unit                  |
| `npm run test:cov`  | Menjalankan coverage testing              |

---

## Cron Job: Backup Database & Laporan Bulanan

-   **Jadwal**: Setiap tanggal **1 pukul 00:00** (zona waktu `Asia/Jakarta`).
-   **Aksi**:
    1. Backup database dalam format `.sql` atau `.zip`.
    2. Mengirim file backup dan laporan ke email melalui SMTP.
